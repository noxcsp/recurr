import { useCallback, useEffect, useMemo } from "react"
import { getToken, deleteToken, onMessage } from "firebase/messaging"
import { messaging } from "@/lib/firebase"
import { createClient } from "@/lib/supabase/client"
import { useNotificationStore } from "@/lib/store/useNotificationStore"

export const usePushNotifications = () => {
  const supabase = useMemo(() => createClient(), [])
  const { setPushEnabled } = useNotificationStore()

  // Listen for real-time push notifications when the tab is in the foreground
  useEffect(() => {
    if (!messaging) return

    const unsubscribe = onMessage(messaging, (payload) => {
      const title =
        payload.notification?.title ||
        (payload.data?.title as string | undefined) ||
        "Notification"
      const body =
        payload.notification?.body ||
        (payload.data?.body as string | undefined) ||
        ""

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "/favicon.ico",
          data: payload.data,
        })
      }

      // Dispatch custom event to notify in-app notification panel to refetch
      window.dispatchEvent(
        new CustomEvent("recurr-notification-received", { detail: payload })
      )
    })

    return () => unsubscribe()
  }, [])

  // Listen for background push notifications and notification clicks forwarded by the Service Worker
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    const handleSwMessage = (event: MessageEvent) => {
      if (
        event.data?.type === "BACKGROUND_PUSH_RECEIVED" ||
        event.data?.type === "NOTIFICATION_CLICKED"
      ) {
        window.dispatchEvent(
          new CustomEvent("recurr-notification-received", { detail: event.data?.payload })
        )
      }
    }

    navigator.serviceWorker.addEventListener("message", handleSwMessage)
    return () => {
      navigator.serviceWorker.removeEventListener("message", handleSwMessage)
    }
  }, [])

  const requestAndSaveToken = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof window === "undefined" || !("Notification" in window)) {
        console.warn("This browser does not support desktop notifications")
        setPushEnabled(false)
        return false
      }

      if (Notification.permission === "denied") {
        console.warn("Notification permission is denied by browser settings")
        setPushEnabled(false)
        return false
      }

      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        console.warn("Notification permission was not granted:", permission)
        setPushEnabled(false)
        return false
      }

      if (!messaging) {
        console.warn("Firebase messaging is not initialized")
        return false
      }

      let serviceWorkerRegistration: ServiceWorkerRegistration | undefined
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        serviceWorkerRegistration = await navigator.serviceWorker.register(
          "/api/firebase-messaging-sw.js",
          { scope: "/firebase-cloud-messaging-push-scope" }
        )

        // Wait for service worker to become active with a 4-second safety timeout
        if (serviceWorkerRegistration && !serviceWorkerRegistration.active) {
          await new Promise<void>((resolve) => {
            const sw =
              serviceWorkerRegistration!.installing ??
              serviceWorkerRegistration!.waiting

            if (!sw) {
              resolve()
              return
            }

            const onStateChange = () => {
              if (sw.state === "activated") {
                sw.removeEventListener("statechange", onStateChange)
                resolve()
              }
            }

            sw.addEventListener("statechange", onStateChange)
            setTimeout(resolve, 4000)
          })
        }
      }

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      if (!vapidKey) {
        throw new Error(
          "NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing from environment variables."
        )
      }

      const currentToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration,
      })

      if (!currentToken) {
        console.warn("No FCM registration token received.")
        return false
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.warn("No authenticated user found when saving FCM token.")
        return false
      }

      const cacheKey = `fcm_token_${user.id}`
      const cachedToken = localStorage.getItem(cacheKey)

      // Caching optimization: If local storage token matches fresh token, skip DB update completely
      if (cachedToken === currentToken) {
        setPushEnabled(true)
        return true
      }

      // Update Supabase profile only when token changes or is uncached
      const { error } = await supabase
        .from("profiles")
        .update({ fcm_token: currentToken })
        .eq("id", user.id)

      if (error) {
        throw error
      }

      localStorage.setItem(cacheKey, currentToken)
      setPushEnabled(true)
      return true
    } catch (error) {
      console.error("An error occurred while requesting/saving push token:", error)
      setPushEnabled(false)
      return false
    }
  }, [supabase, setPushEnabled])

  const disableNotifications = useCallback(async (): Promise<boolean> => {
    try {
      if (messaging) {
        try {
          await deleteToken(messaging)
        } catch (err) {
          console.warn("Error deleting Firebase messaging token:", err)
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({ fcm_token: null })
          .eq("id", user.id)

        if (error) {
          console.error("Error clearing FCM token from profile:", error)
        }

        const cacheKey = `fcm_token_${user.id}`
        localStorage.removeItem(cacheKey)
      }

      setPushEnabled(false)
      return true
    } catch (error) {
      console.error("Error disabling push notifications:", error)
      return false
    }
  }, [supabase, setPushEnabled])

  const clearFcmToken = useCallback(async (): Promise<boolean> => {
    return await disableNotifications()
  }, [disableNotifications])

  return { requestAndSaveToken, disableNotifications, clearFcmToken }
}