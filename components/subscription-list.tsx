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
import { RefreshCw, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { deleteSubscription, renewSubscription } from "@/app/home/actions"
import { parseUtcToLocalDate } from "@/lib/utils/date"

interface SubscriptionListProps {
  subscriptions: Subscription[]
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isRenewing, startRenewTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [swipeX, setSwipeX] = useState(0)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isSwiping = useRef(false)

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
      setDeleteDialogOpen(true)
    }
    setSwipeX(0)
    isSwiping.current = false
  }

  const handleRenew = () => {
    startRenewTransition(async () => {
      const result = await renewSubscription(sub.id)
      if (result?.error) {
        toast.error("Failed to renew", {
          position: "top-right",
          description: result.error,
        })
      } else if (result?.success) {
        toast.success("Subscription renewed", {
          position: "top-right",
          description: `${sub.service_name} has been marked as paid.`,
        })
      }
      setRenewDialogOpen(false)
    })
  }

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await deleteSubscription(sub.id)
      if (result?.error) {
        toast.error("Failed to delete", {
          position: "top-right",
          description: result.error,
        })
      } else if (result?.success) {
        toast.success("Subscription cancelled", {
          position: "top-right",
          description: `${sub.service_name} has been removed.`,
        })
      }
      setDeleteDialogOpen(false)
    })
  }

  return (
    <>
      <li className="relative overflow-hidden">
        {/* Delete zone revealed on swipe */}
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
          {/* Card body */}
          <div className="flex items-center justify-between px-3 py-2.5 text-left">
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
              <span
                className={cn(
                  "ml-auto text-[11px] font-medium md:text-xs lg:text-xs",
                  getCountdownColorClass(dueDays)
                )}
              >
                {getCountdownText(dueDays)}
              </span>
            </div>

            {/* Renew button */}
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
          </div>
        </div>
      </li>

      {/* Renew AlertDialog */}
      <AlertDialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Paid?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark{" "}
              <span className="font-medium text-foreground">
                {sub.service_name}
              </span>{" "}
              as paid and advance the due date to the next billing cycle.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRenewing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRenew}
              disabled={isRenewing}
              className={cn(buttonVariants({ variant: "default" }), "rounded-none")}
            >
              {isRenewing ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">
                {sub.service_name}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Keep
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function SubscriptionList({ subscriptions }: SubscriptionListProps) {
  if (subscriptions.length === 0) {
    return (
      <div className="border border-dashed p-6 text-center text-sm text-muted-foreground md:text-base lg:text-base">
        No subscriptions yet. Add one to get started.
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
