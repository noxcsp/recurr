"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Notification } from "@/types/notifications"

export async function getNotifications(limit: number = 20): Promise<{
  data: Notification[]
  error?: string
}> {
  const supabase = await createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()

  if (authError || !userData?.user) {
    return { data: [], error: "Unauthorized" }
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: (data ?? []) as Notification[] }
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationAsRead(id: string) {
  const supabase = await createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()

  if (authError || !userData?.user) {
    return { error: "Unauthorized" }
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", userData.user.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

/**
 * Marks all unread notifications for the user as read.
 */
export async function markAllNotificationsAsRead() {
  const supabase = await createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()

  if (authError || !userData?.user) {
    return { error: "Unauthorized" }
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userData.user.id)
    .eq("is_read", false)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/home")
  return { success: true }
}

/**
 * Deletes a notification by ID.
 */
export async function deleteNotification(id: string) {
  const supabase = await createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()

  if (authError || !userData?.user) {
    return { error: "Unauthorized" }
  }

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("user_id", userData.user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/home")
  return { success: true }
}
