"use server"

import { revalidatePath } from "next/cache"
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
    cost: validated.data.cost,
    plan_type: validated.data.plan_type,
    payment_mode: validated.data.payment_mode,
    next_due_date: validated.data.next_due_date.toISOString(),
    is_trial: validated.data.is_trial,
    trial_end_date: validated.data.is_trial && validated.data.trial_end_date
      ? validated.data.trial_end_date.toISOString()
      : null,
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
      cost: validated.data.cost,
      plan_type: validated.data.plan_type,
      payment_mode: validated.data.payment_mode,
      next_due_date: validated.data.next_due_date.toISOString(),
      is_trial: validated.data.is_trial,
      trial_end_date:
        validated.data.is_trial && validated.data.trial_end_date
          ? validated.data.trial_end_date.toISOString()
          : null,
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
