import { create } from "zustand"
import type { Subscription } from "@/types/subscriptions"
import { cancelSubscription } from "@/app/home/actions"
import { toast } from "@/hooks/use-toast"

export interface PendingCancellation {
  subscription: Subscription
  originalStatus: Subscription["subscription_status"]
  timerId: ReturnType<typeof setTimeout>
  toastId: string
  isUndone: boolean
}

interface SubscriptionStoreState {
  pendingCancellations: Record<string, PendingCancellation>
  stageCancellation: (sub: Subscription) => void
  undoCancellation: (subId: string) => void
  commitCancellation: (subId: string) => Promise<void>
  getEffectiveStatus: (sub: Subscription) => Subscription["subscription_status"]
}

export const useSubscriptionStore = create<SubscriptionStoreState>((set, get) => ({
  pendingCancellations: {},

  stageCancellation: (sub: Subscription) => {
    const existing = get().pendingCancellations[sub.id]
    if (existing) {
      clearTimeout(existing.timerId)
      if (existing.toastId) {
        toast.dismiss(existing.toastId)
      }
    }

    let toastId = ""

    const timerId = setTimeout(() => {
      get().commitCancellation(sub.id)
    }, 5000)

    toastId = toast.info("Subscription cancelled", {
      description: `${sub.service_name} marked as cancelled.`,
      timeout: 5000,
      actionProps: {
        children: "Undo",
        onClick: () => {
          get().undoCancellation(sub.id)
        },
      },
      onClose: () => {
        const pending = get().pendingCancellations[sub.id]
        if (pending && !pending.isUndone) {
          clearTimeout(pending.timerId)
          get().commitCancellation(sub.id)
        }
      },
    })

    set((state) => ({
      pendingCancellations: {
        ...state.pendingCancellations,
        [sub.id]: {
          subscription: sub,
          originalStatus: sub.subscription_status,
          timerId,
          toastId,
          isUndone: false,
        },
      },
    }))
  },

  undoCancellation: (subId: string) => {
    const pending = get().pendingCancellations[subId]
    if (!pending) return

    pending.isUndone = true
    clearTimeout(pending.timerId)
    if (pending.toastId) {
      toast.dismiss(pending.toastId)
    }

    set((state) => {
      const nextMap = { ...state.pendingCancellations }
      delete nextMap[subId]
      return { pendingCancellations: nextMap }
    })
  },

  commitCancellation: async (subId: string) => {
    const pending = get().pendingCancellations[subId]
    if (!pending || pending.isUndone) return

    set((state) => {
      const nextMap = { ...state.pendingCancellations }
      delete nextMap[subId]
      return { pendingCancellations: nextMap }
    })

    const result = await cancelSubscription(subId)
    if (result?.error) {
      toast.error("Failed to cancel subscription", {
        position: "top-right",
        description: result.error,
      })
    } else if (result?.success) {
      toast.success("Subscription cancelled", {
        position: "top-right",
        description: `${pending.subscription.service_name} status updated to cancelled.`,
      })
    }
  },

  getEffectiveStatus: (sub: Subscription) => {
    const pending = get().pendingCancellations[sub.id]
    if (pending && !pending.isUndone) {
      return "cancelled"
    }
    return sub.subscription_status
  },
}))
