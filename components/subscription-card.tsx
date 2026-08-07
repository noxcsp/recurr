"use client"

import { useState, useTransition, useCallback } from "react"
import { motion, useMotionValue, useTransform } from "motion/react"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
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
import { RefreshCw, Trash2, RotateCcw, Check, X, Zap, Loader2 } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import {
  renewSubscription,
  deleteSubscription,
  getSubscriptionPaymentCount,
} from "@/app/home/actions"
import { parseUtcToLocalDate } from "@/lib/utils/date"
import { EditSubscriptionForm } from "@/components/edit-subscription-form"
import { useSubscriptionStore } from "@/lib/store/use-subscription-store"

export interface SubscriptionCardProps {
  sub: Subscription
  enableSwipe?: boolean
  showActions?: boolean
  index?: number
  animateEntry?: boolean
}

function getDaysRemaining(dateStr: string | null): number {
  if (!dateStr) return Infinity
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

function formatDuration(totalDays: number): string {
  const years = Math.floor(totalDays / 365)
  const remainingAfterYears = totalDays % 365
  const months = Math.floor(remainingAfterYears / 30)
  const days = remainingAfterYears % 30

  const parts: string[] = []
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? "year" : "years"}`)
  }
  if (months > 0) {
    parts.push(`${months} ${months === 1 ? "month" : "months"}`)
  }
  if (days > 0) {
    parts.push(`${days} ${days === 1 ? "day" : "days"}`)
  }

  if (parts.length === 0) {
    return "0 days"
  }

  return parts.join(", ")
}

function getCountdownText(days: number): string {
  if (days < 0) {
    return `Expired ${formatDuration(Math.abs(days))} ago`
  }
  if (days === 0) return "Today"
  if (days === 1) return "Tomorrow"
  return `in ${formatDuration(days)}`
}

function getCountdownColorClass(days: number): string {
  if (days <= 3) return "text-destructive"
  if (days <= 7) return "text-warning"
  return "text-success"
}

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return ""
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
    if (trialDays < 0) {
      return {
        label: "Trial Expired",
        className: "bg-destructive/10 border-transparent text-destructive",
      }
    }
    if (trialDays <= 7) {
      return {
        label: "Trial ending soon",
        className: "bg-warning/10 border-transparent text-warning",
      }
    }
    return {
      label: "Trial active",
      className: "bg-success/10 border-transparent text-success",
    }
  }

  if (!sub.next_due_date) {
    return {
      label: "Active",
      className: "bg-success/10 border-transparent text-success",
    }
  }

  if (sub.subscription_status === "overdue") {
    return {
      label: "Overdue",
      className: "bg-destructive/10 border-transparent text-destructive",
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

  return {
    label: "Active",
    className: "bg-success/10 border-transparent text-success",
  }
}

const SWIPE_THRESHOLD = 60

export function SubscriptionCard({
  sub,
  enableSwipe = true,
  showActions = true,
  index = 0,
  animateEntry = false,
}: SubscriptionCardProps) {
  const [renewDialogOpen, setRenewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [paymentHistoryCount, setPaymentHistoryCount] = useState<number | null>(null)
  const [isFetchingHistory, setIsFetchingHistory] = useState(false)
  const [selectedStartMode, setSelectedStartMode] = useState<"trial_end" | "today">("trial_end")
  const [isRenewing, startRenewTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()

  const stageCancellation = useSubscriptionStore((s) => s.stageCancellation)
  const stageReactivation = useSubscriptionStore((s) => s.stageReactivation)
  const undoCancellation = useSubscriptionStore((s) => s.undoCancellation)
  const effectiveStatus = useSubscriptionStore((s) => s.getEffectiveStatus(sub))
  const isCancelled = effectiveStatus === "cancelled"
  const isTrial = sub.is_trial && !!sub.trial_end_date
  const refDateStr = isTrial ? sub.trial_end_date : sub.next_due_date
  const dueDays = getDaysRemaining(refDateStr)
  const statusBadge = getStatusBadge({ ...sub, subscription_status: effectiveStatus })

  // Motion value for physics-driven gestures
  const x = useMotionValue(0)

  // Dynamic interpolation for continuous gesture feedback
  const deleteBgOpacity = useTransform(x, [0, 60], [0, 1])
  const deleteIconScale = useTransform(x, [0, 60, 100], [0.8, 1, 1.2])
  const cancelBgOpacity = useTransform(x, [-60, 0], [1, 0])
  const cancelIconScale = useTransform(x, [-100, -60, 0], [1.2, 1, 0.8])

  const handleOpenDeleteDialog = useCallback(async () => {
    setDeleteDialogOpen(true)
    setIsFetchingHistory(true)
    const result = await getSubscriptionPaymentCount(sub.id)
    setPaymentHistoryCount(result.count)
    setIsFetchingHistory(false)
  }, [sub.id])

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      if (!enableSwipe) return
      const offsetX = info.offset.x
      const velocityX = info.velocity.x

      // Swipe Left -> Stage Cancellation (soft cancel)
      if (offsetX < -SWIPE_THRESHOLD || velocityX < -400) {
        stageCancellation(sub)
        return
      }

      // Swipe Right -> Hard Delete flow
      if (offsetX > SWIPE_THRESHOLD || velocityX > 400) {
        handleOpenDeleteDialog()
        return
      }
    },
    [enableSwipe, sub, stageCancellation, handleOpenDeleteDialog]
  )

  const handleConfirmDelete = () => {
    startDeleteTransition(async () => {
      const result = await deleteSubscription(sub.id)
      if (result?.error) {
        toast.error("Failed to delete subscription", {
          position: "top-right",
          description: result.error,
        })
      } else {
        toast.success("Subscription deleted", {
          position: "top-right",
          description: `${sub.service_name} was permanently deleted.`,
        })
        setDeleteDialogOpen(false)
      }
    })
  }

  const handleRenewOrSubscribeAgain = (startDateMode: "today" | "trial_end" = "today") => {
    undoCancellation(sub.id)
    startRenewTransition(async () => {
      const result = await renewSubscription(sub.id, startDateMode)
      if (result?.error) {
        toast.error(
          isCancelled
            ? "Failed to resubscribe"
            : isTrial
            ? "Failed to activate subscription"
            : "Failed to renew",
          {
            position: "top-right",
            description: result.error,
          }
        )
      } else if (result?.success) {
        toast.success(
          isCancelled
            ? "Subscription reactivated"
            : isTrial
            ? "Subscription activated"
            : "Subscription renewed",
          {
            position: "top-right",
            description: isCancelled
              ? `${sub.service_name} is active again.`
              : isTrial
              ? `${sub.service_name} paid subscription is now active.`
              : `${sub.service_name} has been marked as paid.`,
          }
        )
      }
      setRenewDialogOpen(false)
    })
  }

  return (
    <>
      <motion.li
        layout
        initial={animateEntry ? { opacity: 0, y: 10, scale: 0.97 } : false}
        animate={animateEntry ? { opacity: 1, y: 0, scale: 1 } : undefined}
        transition={{
          type: "spring",
          stiffness: 450,
          damping: 30,
          delay: index * 0.04,
        }}
        className="relative overflow-hidden list-none"
      >
        {/* Revealed Action Zones on Swipe */}
        {enableSwipe && (
          <>
            {/* Right drag action zone: Hard Delete */}
            <motion.div
              className="absolute inset-y-0 left-0 flex items-center justify-start bg-destructive/10 px-4"
              style={{ opacity: deleteBgOpacity }}
              aria-hidden="true"
            >
              <motion.div
                className="flex items-center gap-1.5 text-xs font-semibold text-destructive"
                style={{ scale: deleteIconScale }}
              >
                <Trash2 className="size-4" />
                <span>Delete</span>
              </motion.div>
            </motion.div>

            {/* Left drag action zone: Stage Cancellation */}
            <motion.div
              className="absolute inset-y-0 right-0 flex items-center justify-end bg-warning/10 px-4"
              style={{ opacity: cancelBgOpacity }}
              aria-hidden="true"
            >
              <motion.div
                className="flex items-center gap-1.5 text-xs font-semibold text-warning"
                style={{ scale: cancelIconScale }}
              >
                <X className="size-4" />
                <span>Cancel</span>
              </motion.div>
            </motion.div>
          </>
        )}

        {/* Swipeable / Interactive card container with spring physics */}
        <motion.div
          className="relative border border-border bg-card transition-colors touch-pan-y"
          style={{ x }}
          drag={enableSwipe ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          dragSnapToOrigin={true}
          onDragEnd={handleDragEnd}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {/* Card body - clicking opens Edit Form */}
          <div
            className="flex items-center justify-between px-3 py-2.5 text-left cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => setEditDialogOpen(true)}
          >
            <div className="space-y-0.5 min-w-0 flex-1 pr-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="text-sm font-heading font-semibold text-foreground md:text-base lg:text-base truncate">
                  {sub.service_name}
                </div>
                {/* Desktop Accessible Action Icons (Hidden on mobile) */}
                <div className="hidden md:flex items-center gap-0.5 shrink-0">
                  {!isCancelled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="rounded-none text-muted-foreground hover:text-warning hover:bg-warning/10 transition-colors"
                      title="Cancel subscription"
                      aria-label={`Cancel ${sub.service_name} subscription`}
                      onClick={(e) => {
                        e.stopPropagation()
                        stageCancellation(sub)
                      }}
                    >
                      <X className="size-3.5" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="rounded-none text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete subscription"
                    aria-label={`Delete ${sub.service_name} subscription`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenDeleteDialog()
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground md:text-xs lg:text-xs">
                {sub.category}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="flex items-baseline justify-end gap-0.5 text-xs font-medium text-foreground md:text-sm lg:text-sm">
                <span>{formatCurrency(sub.cost)}</span>
                <span className="text-xs font-normal text-muted-foreground md:text-xs lg:text-xs">
                  |
                </span>
                {sub.payment_mode && (
                  <span className="text-[11px] font-normal text-muted-foreground md:text-xs lg:text-xs">
                    {sub.payment_mode}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide md:text-xs lg:text-xs">
                / {sub.plan_type.toLowerCase()}{isTrial ? " after trial" : ""}
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
                {isCancelled
                  ? formatDueDate(sub.cancelled_at || refDateStr)
                    ? `last ${formatDueDate(sub.cancelled_at || refDateStr)}`
                    : ""
                  : formatDueDate(refDateStr)}
              </span>
              {!isCancelled && dueDays !== Infinity && (
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

            {/* Action buttons */}
            {showActions && (
              <>
                {isCancelled ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className="w-full rounded-none py-3.5"
                    onClick={() => stageReactivation(sub)}
                  >
                    <RotateCcw className="size-3" data-icon="inline-start" />
                    Subscribe Again
                  </Button>
                ) : isTrial && dueDays < 0 ? (
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      className="w-full rounded-none py-3.5"
                      onClick={() => stageCancellation(sub)}
                    >
                      <X className="size-3" data-icon="inline-start" />
                      Didn&apos;t Renew
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="xs"
                      className="w-full rounded-none py-3.5"
                      onClick={() => setRenewDialogOpen(true)}
                      disabled={isRenewing}
                    >
                      <Check className="size-3" data-icon="inline-start" />
                      {isRenewing ? "Activating..." : "Start Paid Plan"}
                    </Button>
                  </div>
                ) : isTrial ? (
                  <Button
                    type="button"
                    variant="default"
                    size="xs"
                    className="w-full rounded-none py-3.5"
                    onClick={() => setRenewDialogOpen(true)}
                    disabled={isRenewing}
                  >
                    <Zap className="size-3" data-icon="inline-start" />
                    {isRenewing ? "Activating..." : "Activate"}
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
              </>
            )}
          </div>
        </motion.div>
      </motion.li>

      {/* Edit Form Modal */}
      <EditSubscriptionForm
        subscription={sub}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* Hard Delete AlertDialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-4 shrink-0" />
              {isFetchingHistory
                ? "Delete Subscription?"
                : paymentHistoryCount === 0
                ? "Delete Subscription?"
                : "Delete Subscription & History?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-xs md:text-sm">
              {isFetchingHistory ? (
                <span className="flex items-center gap-2 py-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  Checking payment history...
                </span>
              ) : paymentHistoryCount === 0 ? (
                <>
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-foreground">
                    {sub.service_name}
                  </span>
                  ? This subscription has no recorded payment history and is safe to delete permanently.
                </>
              ) : (
                <>
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-foreground">
                    {sub.service_name}
                  </span>
                  ? This subscription has{" "}
                  <span className="font-semibold text-foreground">
                    {paymentHistoryCount} recorded payment
                    {paymentHistoryCount === 1 ? "" : "s"}
                  </span>
                  . Deleting it will permanently remove the subscription, and its past payment history will no longer be included in your analytics calculations.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting || isFetchingHistory}
              className={cn(buttonVariants({ variant: "destructive" }), "rounded-none")}
            >
              {isDeleting ? "Deleting..." : "Delete Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Renew / Subscribe Again / Activate AlertDialog */}
      {showActions && (
        <AlertDialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
          <AlertDialogContent className="rounded-none sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {isCancelled
                  ? "Subscribe Again?"
                  : isTrial
                  ? "Activate Paid Subscription"
                  : "Mark as Paid?"}
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
                ) : isTrial ? (
                  <>
                    When did your paid billing for{" "}
                    <span className="font-medium text-foreground">
                      {sub.service_name}
                    </span>{" "}
                    start? Select an option below to accurately calculate your upcoming due date:
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

            {isTrial ? (
              <div className="space-y-2 py-2">
                <button
                  type="button"
                  disabled={isRenewing}
                  onClick={() => setSelectedStartMode("trial_end")}
                  className={`w-full flex flex-col items-start p-3 border transition-all text-left rounded-none ${
                    selectedStartMode === "trial_end"
                      ? "border-foreground bg-accent/40 ring-1 ring-foreground"
                      : "border-border hover:border-foreground/50 hover:bg-muted/30"
                  }`}
                >
                  <div className="text-xs font-semibold text-foreground md:text-sm flex items-center justify-between w-full">
                    <div className="flex items-center gap-1.5">
                      <span>Auto-charged when trial ended</span>
                      {selectedStartMode === "trial_end" && (
                        <Check className="size-3.5 text-foreground stroke-3" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {formatDueDate(sub.trial_end_date)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Billed on trial end date. Next due date will be calculated from {formatDueDate(sub.trial_end_date)}.
                  </p>
                </button>

                <button
                  type="button"
                  disabled={isRenewing}
                  onClick={() => setSelectedStartMode("today")}
                  className={`w-full flex flex-col items-start p-3 border transition-all text-left rounded-none ${
                    selectedStartMode === "today"
                      ? "border-foreground bg-accent/40 ring-1 ring-foreground"
                      : "border-border hover:border-foreground/50 hover:bg-muted/30"
                  }`}
                >
                  <div className="text-xs font-semibold text-foreground md:text-sm flex items-center justify-between w-full">
                    <div className="flex items-center gap-1.5">
                      <span>Subscribed / Billed today</span>
                      {selectedStartMode === "today" && (
                        <Check className="size-3.5 text-foreground stroke-3" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      Today
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Started or renewed today. Next due date will be calculated from today.
                  </p>
                </button>
              </div>
            ) : null}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRenewing}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleRenewOrSubscribeAgain(isTrial ? selectedStartMode : "today")}
                disabled={isRenewing}
                className={cn(buttonVariants({ variant: "default" }), "rounded-none")}
              >
                {isRenewing ? "Processing..." : isTrial ? "Confirm & Activate" : "Confirm"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}
