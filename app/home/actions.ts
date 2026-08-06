"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { subscriptionSchema, type SubscriptionFormValues } from "@/lib/validations/subscription"

export async function addSubscription(data: SubscriptionFormValues) {
  const supabase = await createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()

  if (authError || !userData?.user) {
    return { error: "You must be logged in to add a subscription." }
  }

  const validated = subscriptionSchema.safeParse(data)
  if (!validated.success) {
    return { error: "Invalid input fields." }
  }

  const { error } = await supabase.from("subscriptions").insert({
    user_id: userData.user.id,
    service_name: validated.data.service_name,
    category: validated.data.category || "Other",
    cost: validated.data.cost,
    plan_type: validated.data.plan_type,
    payment_mode: validated.data.payment_mode,
    next_due_date: validated.data.is_trial
      ? null
      : validated.data.next_due_date
      ? validated.data.next_due_date.toISOString()
      : null,
    is_trial: validated.data.is_trial,
    trial_end_date: validated.data.is_trial && validated.data.trial_end_date
      ? validated.data.trial_end_date.toISOString()
      : null,
    subscription_status: validated.data.subscription_status,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/home")
  return { success: true }
}

export async function updateSubscription(
  id: string,
  data: SubscriptionFormValues
) {
  const idParsed = z.string().uuid().safeParse(id)
  if (!idParsed.success) {
    return { error: "Invalid subscription ID." }
  }

  const supabase = await createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()

  if (authError || !userData?.user) {
    return { error: "You must be logged in to update a subscription." }
  }

  const validated = subscriptionSchema.safeParse(data)
  if (!validated.success) {
    return { error: "Invalid input fields." }
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({
      service_name: validated.data.service_name,
      category: validated.data.category || "Other",
      cost: validated.data.cost,
      plan_type: validated.data.plan_type,
      payment_mode: validated.data.payment_mode,
      next_due_date: validated.data.is_trial
        ? null
        : validated.data.next_due_date
        ? validated.data.next_due_date.toISOString()
        : null,
      is_trial: validated.data.is_trial,
      trial_end_date:
        validated.data.is_trial && validated.data.trial_end_date
          ? validated.data.trial_end_date.toISOString()
          : null,
      subscription_status: validated.data.subscription_status,
    })
    .eq("id", id)
    .eq("user_id", userData.user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/home")
  return { success: true }
}

export async function cancelSubscription(id: string) {
  const idParsed = z.string().uuid().safeParse(id)
  if (!idParsed.success) {
    return { error: "Invalid subscription ID." }
  }

  const supabase = await createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()

  if (authError || !userData?.user) {
    return { error: "You must be logged in to cancel a subscription." }
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({
      subscription_status: "cancelled" as const,
    })
    .eq("id", id)
    .eq("user_id", userData.user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/home")
  return { success: true }
}

export async function deleteSubscription(id: string) {
  const idParsed = z.string().uuid().safeParse(id)
  if (!idParsed.success) {
    return { error: "Invalid subscription ID." }
  }

  const supabase = await createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()

  if (authError || !userData?.user) {
    return { error: "You must be logged in to delete a subscription." }
  }

  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("id", id)
    .eq("user_id", userData.user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/home")
  return { success: true }
}

export async function getSubscriptionPaymentCount(id: string) {
  const idParsed = z.string().uuid().safeParse(id)
  if (!idParsed.success) {
    return { count: 0, error: "Invalid subscription ID." }
  }

  const supabase = await createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()

  if (authError || !userData?.user) {
    return { count: 0, error: "You must be logged in." }
  }

  const { count, error } = await supabase
    .from("subscription_payments")
    .select("id", { count: "exact", head: true })
    .eq("subscription_id", id)
    .eq("user_id", userData.user.id)

  if (error) {
    return { count: 0, error: error.message }
  }

  return { count: count ?? 0 }
}

export async function renewSubscription(
  id: string,
  startDateMode: "today" | "trial_end" = "today"
) {
  const idParsed = z.string().uuid().safeParse(id)
  if (!idParsed.success) {
    return { error: "Invalid subscription ID." }
  }

  const modeParsed = z.enum(["today", "trial_end"]).safeParse(startDateMode)
  if (!modeParsed.success) {
    return { error: "Invalid start date mode." }
  }

  const supabase = await createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()

  if (authError || !userData?.user) {
    return { error: "You must be logged in to renew a subscription." }
  }

  const { data: sub, error: fetchError } = await supabase
    .from("subscriptions")
    .select("id, is_trial, trial_end_date, plan_type, cost, service_name")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .single()

  if (fetchError || !sub) {
    return { error: fetchError?.message ?? "Subscription not found." }
  }

  if (sub.is_trial) {
    let baseDate = new Date()
    if (startDateMode === "trial_end" && sub.trial_end_date) {
      const parts = sub.trial_end_date.split("-").map(Number)
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        baseDate = new Date(parts[0], parts[1] - 1, parts[2])
      }
    }
    baseDate.setHours(0, 0, 0, 0)

    const nextDueDate = new Date(baseDate)
    if (sub.plan_type === "Weekly") {
      nextDueDate.setDate(nextDueDate.getDate() + 7)
    } else if (sub.plan_type === "Annual") {
      nextDueDate.setFullYear(nextDueDate.getFullYear() + 1)
    } else {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1)
    }

    // Insert payment record into subscription_payments ledger
    const { error: paymentError } = await supabase
      .from("subscription_payments")
      .insert({
        user_id: userData.user.id,
        subscription_id: id,
        service_name: sub.service_name,
        amount: sub.cost,
        plan_type: sub.plan_type,
        payment_date: baseDate.toISOString(),
      })

    if (paymentError) {
      return { error: paymentError.message }
    }

    const yyyy = nextDueDate.getFullYear()
    const mm = String(nextDueDate.getMonth() + 1).padStart(2, "0")
    const dd = String(nextDueDate.getDate()).padStart(2, "0")
    const nextDueDateStr = `${yyyy}-${mm}-${dd}`

    const { error } = await supabase
      .from("subscriptions")
      .update({
        is_trial: false,
        trial_end_date: null,
        next_due_date: nextDueDateStr,
        subscription_status: "unpaid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userData.user.id)

    if (error) {
      return { error: error.message }
    }
  } else {
    const { error } = await supabase
      .from("subscriptions")
      .update({
        subscription_status: "paid" as const,
      })
      .eq("id", id)
      .eq("user_id", userData.user.id)

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath("/home")
  return { success: true }
}
