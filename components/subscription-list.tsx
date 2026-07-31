"use client"

import { useState, useRef, useTransition } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Subscription } from "@/types/subscriptions"
import { RefreshCw, Trash2, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { cancelSubscription, renewSubscription } from "@/app/home/actions"
import { parseUtcToLocalDate } from "@/lib/utils/date"
import { EditSubscriptionForm } from "@/components/edit-subscription-form"

interface SubscriptionListProps {
  subscriptions: Subscription[]
  emptyMessage?: string
}

function getDaysRemaining(dateStr: string): number {
  const due = parseUtcToLocalDate(dateStr)
  if (!due) return Infinity
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffMs = due.getTime() - today.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

function getTrialDaysRemaining(dateStr: string | null): number {
  if (!dateStr) return Infinity
  return getDaysRemaining(dateStr)
}

function getCountdownText(days: number): string {
  if (days <= 0) return "Today"
  if (days === 1) return "Tomorrow"
  return `in ${days} days`
}

function getCountdownColorClass(days: number): string {
  if (days <= 3) return "text-destructive"
  if (days <= 7) return "text-warning"
  return "text-success"
}

function formatDueDate(dateStr: string): string {
  const date = parseUtcToLocalDate(dateStr)
  if (!date) return ""
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

interface StatusBadgeInfo {
  label: string
  className: string
}

function getStatusBadge(sub: Subscription): StatusBadgeInfo | null {
  if (sub.subscription_status === "cancelled") {
    return {
      label: "Cancelled",
      className: "bg-muted text-muted-foreground border-transparent",
    }
  }

  if (sub.is_trial && sub.trial_end_date) {
    const trialDays = getTrialDaysRemaining(sub.trial_end_date)
    if (trialDays <= 7) {
      return {
        label: "Trial ending soon",
        className: "bg-warning/10 border-transparent text-warning",
      }
    }
  }

  const dueDays = getDaysRemaining(sub.next_due_date)
  if (dueDays <= 3) {
    return {
      label: "Renewing soon",
      className: "bg-destructive/10 border-transparent text-destructive",
    }
  }
  if (dueDays <= 7) {
    return {
      label: "Renewing soon",
      className: "bg-warning/10 border-transparent text-warning",
    }
  }

  return null
}

const SWIPE_THRESHOLD = 40

function SubscriptionCard({ sub }: { sub: Subscription }) {
  const [renewDialogOpen, setRenewDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [isRenewing, startRenewTransition] = useTransition()
  const [isCancelling, startCancelTransition] = useTransition()
  const [swipeX, setSwipeX] = useState(0)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isSwiping = useRef(false)

  const isCancelled = sub.subscription_status === "cancelled"
  const dueDays = getDaysRemaining(sub.next_due_date)
  const statusBadge = getStatusBadge(sub)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isSwiping.current = false
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaX = touchStartX.current - e.touches[0].clientX
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current)

    if (!isSwiping.current && deltaY > Math.abs(deltaX)) {
      return
    }

    if (deltaX > 10) {
      isSwiping.current = true
    }

    if (isSwiping.current) {
      const clampedX = Math.max(0, Math.min(deltaX, 120))
      setSwipeX(clampedX)
    }
  }

  const handleTouchEnd = () => {
    if (swipeX >= SWIPE_THRESHOLD) {
      setCancelDialogOpen(true)
    }
    setSwipeX(0)
    isSwiping.current = false
  }

  const handleRenewOrSubscribeAgain = () => {
    startRenewTransition(async () => {
      const result = await renewSubscription(sub.id)
      if (result?.error) {
        toast.error(isCancelled ? "Failed to resubscribe" : "Failed to renew", {
          position: "top-right",
          description: result.error,
        })
      } else if (result?.success) {
        toast.success(
          isCancelled ? "Subscription reactivated" : "Subscription renewed",
          {
            position: "top-right",
            description: isCancelled
              ? `${sub.service_name} is active again.`
              : `${sub.service_name} has been marked as paid.`,
          }
        )
      }
      setRenewDialogOpen(false)
    })
  }

  const handleCancel = () => {
    startCancelTransition(async () => {
      const result = await cancelSubscription(sub.id)
      if (result?.error) {
        toast.error("Failed to cancel subscription", {
          position: "top-right",
          description: result.error,
        })
      } else if (result?.success) {
        toast.success("Subscription cancelled", {
          position: "top-right",
          description: `${sub.service_name} status updated to cancelled.`,
        })
      }
      setCancelDialogOpen(false)
    })
  }

  return (
    <>
      <li className="relative overflow-hidden">
        {/* Cancel zone revealed on swipe */}
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-center bg-destructive/10 px-4"
          style={{ width: `${swipeX}px` }}
          aria-hidden="true"
        >
          {swipeX >= SWIPE_THRESHOLD && (
            <Trash2 className="size-4 text-destructive" />
          )}
        </div>

        {/* Swipeable card */}
        <div
          className="relative border border-border bg-card transition-transform"
          style={{
            transform: `translateX(-${swipeX}px)`,
            transition: swipeX === 0 ? "transform 200ms ease-out" : "none",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Card body - clicking opens Edit Form */}
          <div
            className="flex items-center justify-between px-3 py-2.5 text-left cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => setEditDialogOpen(true)}
          >
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-foreground md:text-base lg:text-base">
                {sub.service_name}
              </div>
              <div className="text-[11px] text-muted-foreground md:text-xs lg:text-xs">
                {sub.payment_mode}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-foreground md:text-sm lg:text-sm">
                ₱{sub.cost.toLocaleString()}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide md:text-xs lg:text-xs">
                / {sub.plan_type.toLowerCase()}
              </div>
            </div>
          </div>

          {/* Card footer */}
          <div className="border-t border-border px-3 py-2 space-y-1.5">
            {/* Status row */}
            <div className="flex items-center gap-2">
              {statusBadge && (
                <Badge
                  className={cn(
                    "rounded-none shrink-0 border-transparent text-[10px] md:text-[11px] lg:text-[11px]",
                    statusBadge.className
                  )}
                >
                  {statusBadge.label}
                </Badge>
              )}
              <span className="text-[11px] text-muted-foreground md:text-xs lg:text-xs">
                {formatDueDate(sub.next_due_date)}
              </span>
              {!isCancelled && (
                <span
                  className={cn(
                    "ml-auto text-[11px] font-medium md:text-xs lg:text-xs",
                    getCountdownColorClass(dueDays)
                  )}
                >
                  {getCountdownText(dueDays)}
                </span>
              )}
            </div>

            {/* Action button: "Subscribe Again" if cancelled, "Renew" otherwise */}
            {isCancelled ? (
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="w-full rounded-none py-3.5"
                onClick={() => setRenewDialogOpen(true)}
                disabled={isRenewing}
              >
                <RotateCcw className="size-3" data-icon="inline-start" />
                {isRenewing ? "Reactivating..." : "Subscribe Again"}
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                size="xs"
                className="w-full rounded-none py-3.5"
                onClick={() => setRenewDialogOpen(true)}
                disabled={isRenewing}
              >
                <RefreshCw className="size-3" data-icon="inline-start" />
                {isRenewing ? "Renewing..." : "Renew"}
              </Button>
            )}
          </div>
        </div>
      </li>

      {/* Edit Form Modal */}
      <EditSubscriptionForm
        subscription={sub}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* Renew / Subscribe Again AlertDialog */}
      <AlertDialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isCancelled ? "Subscribe Again?" : "Mark as Paid?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isCancelled ? (
                <>
                  This will reactivate{" "}
                  <span className="font-medium text-foreground">
                    {sub.service_name}
                  </span>{" "}
                  and update its status to paid.
                </>
              ) : (
                <>
                  This will mark{" "}
                  <span className="font-medium text-foreground">
                    {sub.service_name}
                  </span>{" "}
                  as paid and advance the due date to the next billing cycle.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRenewing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRenewOrSubscribeAgain}
              disabled={isRenewing}
              className={cn(buttonVariants({ variant: "default" }), "rounded-none")}
            >
              {isRenewing ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Subscription AlertDialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update the status of{" "}
              <span className="font-medium text-foreground">
                {sub.service_name}
              </span>{" "}
              to cancelled. You can subscribe again at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Keep
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isCancelling}
              className={cn(buttonVariants({ variant: "destructive" }), "rounded-none")}
            >
              {isCancelling ? "Cancelling..." : "Cancel Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function SubscriptionList({ subscriptions, emptyMessage }: SubscriptionListProps) {
  if (subscriptions.length === 0) {
    return (
      <div className="border border-dashed border-border p-6 text-center text-xs text-muted-foreground md:text-sm lg:text-sm">
        {emptyMessage || "No subscriptions yet. Add one to get started."}
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {subscriptions.map((sub) => (
        <SubscriptionCard key={sub.id} sub={sub} />
      ))}
    </ul>
  )
}
