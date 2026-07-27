"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/app/home/notification-actions"
import type { Notification } from "@/types/notifications"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

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

      if (!user || !isMounted) return

      const channelTopic = `notif_user_${user.id}`

      const existingChannel = supabase
        .getChannels()
        .find((ch) => ch.topic === `realtime:${channelTopic}`)

      if (existingChannel) {
        await supabase.removeChannel(existingChannel)
      }

      if (!isMounted) return

      activeChannel = supabase
        .channel(channelTopic)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload: RealtimePostgresChangesPayload<Notification>) => {
            if (!isMounted) return

            if (payload.eventType === "INSERT") {
              const newNotif = payload.new as Notification
              setNotifications((prev) => {
                if (prev.some((n) => n.id === newNotif.id)) return prev
                return [newNotif, ...prev]
              })
            } else if (payload.eventType === "UPDATE") {
              const updatedNotif = payload.new as Notification
              setNotifications((prev) =>
                prev.map((n) => (n.id === updatedNotif.id ? { ...n, ...updatedNotif } : n))
              )
            } else if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as Partial<Notification>).id
              if (deletedId) {
                setNotifications((prev) => prev.filter((n) => n.id !== deletedId))
              }
            }
          }
        )
        .subscribe()
    }

    initNotifications()

    return () => {
      isMounted = false
      if (activeChannel) {
        supabase.removeChannel(activeChannel)
      }
    }
  }, [supabase])

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
