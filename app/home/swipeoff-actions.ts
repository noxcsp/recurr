"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

/**
 * Completes the daily swipe-off flow.
 *
 * Batches all status updates into at most 2 Supabase calls to avoid
 * rate-limit burn-out:
 *   1. Bulk update subscription_status → 'paid' for swiped-right IDs
 *   2. Update profiles.last_swipeoff_date to today
 *
 * After both writes succeed the /home path is revalidated so the
 * server component refetches fresh data on the next render.
 */
export async function completeSwipeoff(paidSubscriptionIds: string[]) {
  const supabase = await createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()

  if (authError || !userData?.user) {
    return { error: "You must be logged in to complete the daily swipe-off." }
  }

  const userId = userData.user.id

  // 1. Bulk-update subscriptions that were swiped right (marked paid)
  if (paidSubscriptionIds.length > 0) {
    const { error: subsError } = await supabase
      .from("subscriptions")
      .update({ subscription_status: "paid" })
      .in("id", paidSubscriptionIds)
      .eq("user_id", userId)

    if (subsError) {
      return { error: subsError.message }
    }
  }

  // 2. Stamp today's date on the profile so the swipe-off won't show again
  const today = new Date().toISOString().split("T")[0] // "YYYY-MM-DD"

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ last_swipeoff_date: today })
    .eq("id", userId)

  if (profileError) {
    return { error: profileError.message }
  }

  revalidatePath("/home")
  return { success: true }
}
