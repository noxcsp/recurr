import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface NotificationState {
  pushEnabled: boolean
  notifyAdvanceDays: number
  notificationTtlDays: number
  permissionState: NotificationPermission | "default"
  setPushEnabled: (enabled: boolean) => void
  setNotifyAdvanceDays: (days: number) => void
  setNotificationTtlDays: (days: number) => void
  syncWithBrowser: () => NotificationPermission | "default"
  syncWithProfile: (profile: {
    fcm_token?: string | null
    notify_advance_days?: number | null
    notification_ttl_days?: number | null
  }) => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      pushEnabled: false,
      notifyAdvanceDays: 3,
      notificationTtlDays: 3,
      permissionState: "default",

      setPushEnabled: (enabled: boolean) => set({ pushEnabled: enabled }),

      setNotifyAdvanceDays: (days: number) => set({ notifyAdvanceDays: days }),

      setNotificationTtlDays: (days: number) => set({ notificationTtlDays: days }),

      syncWithBrowser: () => {
        if (typeof window === "undefined" || !("Notification" in window)) {
          set({ pushEnabled: false, permissionState: "denied" })
          return "denied"
        }

        const currentPermission = Notification.permission
        set({ permissionState: currentPermission })

        // Automatically override UI push toggle state to false if permission is denied or default
        if (currentPermission === "denied" || currentPermission === "default") {
          set({ pushEnabled: false })
        }

        return currentPermission
      },

      syncWithProfile: (profile) => {
        const update: Partial<NotificationState> = {}

        if (typeof profile.notify_advance_days === "number") {
          update.notifyAdvanceDays = profile.notify_advance_days
        }

        if (typeof profile.notification_ttl_days === "number") {
          update.notificationTtlDays = profile.notification_ttl_days
        }

        // If fcm_token exists in profile and permission is granted, set pushEnabled true
        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted" &&
          profile.fcm_token
        ) {
          update.pushEnabled = true
        }

        set(update)
      },
    }),
    {
      name: "notification-settings-storage",
      partialize: (state) => ({
        pushEnabled: state.pushEnabled,
        notifyAdvanceDays: state.notifyAdvanceDays,
        notificationTtlDays: state.notificationTtlDays,
      }),
    }
  )
)
