"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/app/home/notification-actions"
import type { Notification } from "@/types/notifications"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"

const MAX_NOTIFICATIONS = 50
const DEBOUNCE_MS = 1000

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  
  const supabase = useMemo(() => createClient(), [])
  const lastFetchRef = useRef<number>(0)

  const refetch = useCallback(async (force = false) => {
    const now = Date.now()
    if (!force && now - lastFetchRef.current < DEBOUNCE_MS) {
      return
    }
    lastFetchRef.current = now

    const res = await getNotifications(MAX_NOTIFICATIONS)
    if (res.data) {
      setNotifications(res.data)
      setUnreadCount(res.unreadCount)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let isMounted = true
    let activeChannel: RealtimeChannel | null = null

    const initNotifications = async () => {
      const res = await getNotifications(MAX_NOTIFICATIONS)
      if (isMounted) {
        if (res.data) {
          setNotifications(res.data)
          setUnreadCount(res.unreadCount)
        }
        setLoading(false)
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !isMounted) return

      const topic = `notifications_changes_${user.id}`
      const existingChannel = supabase
        .getChannels()
        .find((ch) => ch.topic === `realtime:${topic}`)

      if (existingChannel) {
        await supabase.removeChannel(existingChannel)
      }

      if (!isMounted) return

      activeChannel = supabase
        .channel(topic)
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
              if (newNotif && newNotif.id) {
                setNotifications((prev) => {
                  if (prev.some((n) => n.id === newNotif.id)) return prev
                  return [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS)
                })
                if (!newNotif.is_read) {
                  setUnreadCount((c) => c + 1)
                }
              }
            } else if (payload.eventType === "UPDATE") {
              const updatedNotif = payload.new as Notification
              if (updatedNotif && updatedNotif.id) {
                setNotifications((prev) => {
                  const existing = prev.find((n) => n.id === updatedNotif.id)
                  if (existing && existing.is_read !== updatedNotif.is_read) {
                    setUnreadCount((c) => (updatedNotif.is_read ? Math.max(0, c - 1) : c + 1))
                  }
                  return prev.map((n) => (n.id === updatedNotif.id ? { ...n, ...updatedNotif } : n))
                })
              }
            } else if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as Partial<Notification>)?.id
              if (deletedId) {
                setNotifications((prev) => {
                  const target = prev.find((n) => n.id === deletedId)
                  if (target && !target.is_read) {
                    setUnreadCount((c) => Math.max(0, c - 1))
                  }
                  return prev.filter((n) => n.id !== deletedId)
                })
              }
              refetch(true)
            }
          }
        )

      activeChannel.subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(`Supabase Realtime notification channel status: ${status}`, err)
        }
      })
    }

    initNotifications()

    return () => {
      isMounted = false
      if (activeChannel) {
        supabase.removeChannel(activeChannel)
      }
    }
  }, [supabase, refetch])

  useEffect(() => {
    const handleNotifEvent = () => {
      refetch(true)
    }

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        refetch(false)
      }
    }

    window.addEventListener("phase-notification-received", handleNotifEvent)
    document.addEventListener("visibilitychange", handleVisibilityOrFocus)
    window.addEventListener("focus", handleVisibilityOrFocus)

    return () => {
      window.removeEventListener("phase-notification-received", handleNotifEvent)
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus)
      window.removeEventListener("focus", handleVisibilityOrFocus)
    }
  }, [refetch])

  const markAsRead = useCallback(
    async (id: string) => {
      setActionInProgress(id)
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
      try {
        const res = await markNotificationAsRead(id)
        if (res?.error) {
          await refetch(true)
        }
      } catch {
        await refetch(true)
      } finally {
        setActionInProgress(null)
      }
    },
    [refetch]
  )

  const markAllAsRead = useCallback(async () => {
    setActionInProgress("all")
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
    try {
      const res = await markAllNotificationsAsRead()
      if (res?.error) {
        await refetch(true)
      }
    } catch {
      await refetch(true)
    } finally {
      setActionInProgress(null)
    }
  }, [refetch])

  const deleteNotif = useCallback(
    async (id: string) => {
      setActionInProgress(id)
      // Optimistic update
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id)
        if (target && !target.is_read) {
          setUnreadCount((c) => Math.max(0, c - 1))
        }
        return prev.filter((n) => n.id !== id)
      })
      try {
        const res = await deleteNotification(id)
        if (res?.error) {
          await refetch(true)
        }
      } catch {
        await refetch(true)
      } finally {
        setActionInProgress(null)
      }
    },
    [refetch]
  )

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
