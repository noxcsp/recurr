"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/app/home/notification-actions"
import type { Notification } from "@/types/notifications"
import type { RealtimeChannel } from "@supabase/supabase-js"

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    const res = await getNotifications()
    if (res.data) {
      setNotifications(res.data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let isMounted = true
    let activeChannel: RealtimeChannel | null = null
    const supabase = createClient()

    const initNotifications = async () => {
      const res = await getNotifications()
      if (isMounted) {
        if (res.data) {
          setNotifications(res.data)
        }
        setLoading(false)
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user && isMounted) {
        const channelName = `notif_${user.id}_${Math.random().toString(36).substring(2, 8)}`
        activeChannel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            async () => {
              const freshRes = await getNotifications()
              if (isMounted && freshRes.data) {
                setNotifications(freshRes.data)
              }
            }
          )
          .subscribe()
      }
    }

    initNotifications()

    return () => {
      isMounted = false
      if (activeChannel) {
        supabase.removeChannel(activeChannel)
      }
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    setActionInProgress(id)
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    await markNotificationAsRead(id)
    setActionInProgress(null)
  }, [])

  const markAllAsRead = useCallback(async () => {
    setActionInProgress("all")
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    await markAllNotificationsAsRead()
    setActionInProgress(null)
  }, [])

  const deleteNotif = useCallback(async (id: string) => {
    setActionInProgress(id)
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    await deleteNotification(id)
    setActionInProgress(null)
  }, [])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return {
    notifications,
    unreadCount,
    loading,
    actionInProgress,
    refetch,
    markAsRead,
    markAllAsRead,
    deleteNotif,
  }
}
