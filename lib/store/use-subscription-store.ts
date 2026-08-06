import { create } from "zustand"
import type { Subscription } from "@/types/subscriptions"
import { cancelSubscription, renewSubscription } from "@/app/home/actions"
import { toast } from "@/hooks/use-toast"

export interface PendingAction {
  subscription: Subscription
  originalStatus: Subscription["subscription_status"]
  toastId: string
  isUndone: boolean
}

interface SubscriptionStoreState {
  pendingCancellations: Record<string, PendingAction>
  pendingReactivations: Record<string, PendingAction>
  committedStatuses: Record<string, Subscription["subscription_status"]>
  stageCancellation: (sub: Subscription) => void
  undoCancellation: (subId: string) => void
  commitCancellation: (subId: string) => Promise<void>
  stageReactivation: (sub: Subscription) => void
  undoReactivation: (subId: string) => void
  commitReactivation: (subId: string) => Promise<void>
  getEffectiveStatus: (sub: Subscription) => Subscription["subscription_status"]
}

export const useSubscriptionStore = create<SubscriptionStoreState>((set, get) => ({
  pendingCancellations: {},
  pendingReactivations: {},
  committedStatuses: {},

  stageCancellation: (sub: Subscription) => {
    const existingCancel = get().pendingCancellations[sub.id]
    if (existingCancel && existingCancel.toastId) {
      toast.dismiss(existingCancel.toastId)
    }

    const existingReact = get().pendingReactivations[sub.id]
    if (existingReact && existingReact.toastId) {
      toast.dismiss(existingReact.toastId)
    }

    set((state) => {
      const nextReact = { ...state.pendingReactivations }
      delete nextReact[sub.id]
      const nextCommitted = { ...state.committedStatuses }
      delete nextCommitted[sub.id]
      return {
        pendingReactivations: nextReact,
        committedStatuses: nextCommitted,
      }
    })

    const toastId = toast.info("Subscription cancelled", {
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
    if (pending.toastId) {
      toast.dismiss(pending.toastId)
    }

    set((state) => {
      const nextCancellations = { ...state.pendingCancellations }
      delete nextCancellations[subId]
      return { pendingCancellations: nextCancellations }
    })
  },

  commitCancellation: async (subId: string) => {
    const pending = get().pendingCancellations[subId]
    if (!pending || pending.isUndone) return

    set((state) => {
      const nextPending = { ...state.pendingCancellations }
      delete nextPending[subId]
      return {
        pendingCancellations: nextPending,
        committedStatuses: {
          ...state.committedStatuses,
          [subId]: "cancelled",
        },
      }
    })

    const result = await cancelSubscription(subId)
    if (result?.error) {
      set((state) => {
        const nextCommitted = { ...state.committedStatuses }
        delete nextCommitted[subId]
        return { committedStatuses: nextCommitted }
      })
      toast.error("Failed to cancel subscription", {
        description: result.error,
      })
    }
  },

  stageReactivation: (sub: Subscription) => {
    const existingReact = get().pendingReactivations[sub.id]
    if (existingReact && existingReact.toastId) {
      toast.dismiss(existingReact.toastId)
    }

    const existingCancel = get().pendingCancellations[sub.id]
    if (existingCancel && existingCancel.toastId) {
      toast.dismiss(existingCancel.toastId)
    }

    set((state) => {
      const nextCancel = { ...state.pendingCancellations }
      delete nextCancel[sub.id]
      const nextCommitted = { ...state.committedStatuses }
      delete nextCommitted[sub.id]
      return {
        pendingCancellations: nextCancel,
        committedStatuses: nextCommitted,
      }
    })

    const toastId = toast.info("Subscription reactivated", {
      description: `${sub.service_name} marked as active.`,
      timeout: 5000,
      actionProps: {
        children: "Undo",
        onClick: () => {
          get().undoReactivation(sub.id)
        },
      },
      onClose: () => {
        const pending = get().pendingReactivations[sub.id]
        if (pending && !pending.isUndone) {
          get().commitReactivation(sub.id)
        }
      },
    })

    set((state) => ({
      pendingReactivations: {
        ...state.pendingReactivations,
        [sub.id]: {
          subscription: sub,
          originalStatus: sub.subscription_status,
          toastId,
          isUndone: false,
        },
      },
    }))
  },

  undoReactivation: (subId: string) => {
    const pending = get().pendingReactivations[subId]
    if (!pending) return

    pending.isUndone = true
    if (pending.toastId) {
      toast.dismiss(pending.toastId)
    }

    set((state) => {
      const nextReactivations = { ...state.pendingReactivations }
      delete nextReactivations[subId]
      return { pendingReactivations: nextReactivations }
    })
  },

  commitReactivation: async (subId: string) => {
    const pending = get().pendingReactivations[subId]
    if (!pending || pending.isUndone) return

    set((state) => {
      const nextPending = { ...state.pendingReactivations }
      delete nextPending[subId]
      return {
        pendingReactivations: nextPending,
        committedStatuses: {
          ...state.committedStatuses,
          [subId]: "unpaid",
        },
      }
    })

    const result = await renewSubscription(subId, "today")
    if (result?.error) {
      set((state) => {
        const nextCommitted = { ...state.committedStatuses }
        delete nextCommitted[subId]
        return { committedStatuses: nextCommitted }
      })
      toast.error("Failed to reactivate subscription", {
        description: result.error,
      })
    }
  },

  getEffectiveStatus: (sub: Subscription) => {
    const pendingCancel = get().pendingCancellations[sub.id]
    if (pendingCancel && !pendingCancel.isUndone) {
      return "cancelled"
    }
    const pendingReact = get().pendingReactivations[sub.id]
    if (pendingReact && !pendingReact.isUndone) {
      return "unpaid"
    }
    const committed = get().committedStatuses[sub.id]
    if (committed) {
      if (
        sub.subscription_status === committed ||
        (committed === "unpaid" && sub.subscription_status !== "cancelled")
      ) {
        delete get().committedStatuses[sub.id]
      } else {
        return committed
      }
    }
    return sub.subscription_status
  },
}))
