"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from "motion/react"
import { Check, X, CreditCard, CalendarDays, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { completeSwipeoff } from "@/app/home/swipeoff-actions"
import type { Subscription } from "@/types/subscriptions"

// ── Plan-type accent styles (mirrors subscription-list.tsx) ─────────────────

const planTypeStyles: Record<
  Subscription["plan_type"],
  { badge: string; bar: string }
> = {
  Weekly: {
    badge: "border-amber-600/40 text-amber-700 dark:border-amber-400/40 dark:text-amber-400",
    bar: "bg-amber-400 dark:bg-amber-500",
  },
  Monthly: {
    badge: "border-blue-600/40 text-blue-700 dark:border-blue-400/40 dark:text-blue-400",
    bar: "bg-blue-400 dark:bg-blue-500",
  },
  Annual: {
    badge: "border-emerald-600/40 text-emerald-700 dark:border-emerald-400/40 dark:text-emerald-400",
    bar: "bg-emerald-400 dark:bg-emerald-500",
  },
}

// ── Status badge styles ─────────────────────────────────────────────────────

const statusStyles: Record<Subscription["subscription_status"], string> = {
  paid: "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400",
  unpaid: "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400",
  overdue: "border-destructive text-destructive",
}

// ── Swipe threshold ─────────────────────────────────────────────────────────

const SWIPE_THRESHOLD = 120

// ── Types ───────────────────────────────────────────────────────────────────

type SwipeDecision = { id: string; decision: "paid" | "skipped" }

type FlowState = "swiping" | "completing" | "done"

interface DailySwipeoffProps {
  subscriptions: Subscription[]
  onComplete: () => void
}

// ── Main Component ──────────────────────────────────────────────────────────

export function DailySwipeoff({
  subscriptions,
  onComplete,
}: DailySwipeoffProps) {
  const [flowState, setFlowState] = useState<FlowState>("swiping")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [decisions, setDecisions] = useState<SwipeDecision[]>([])
  // Direction of the most recent programmatic swipe (for button-triggered animation)
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(
    null
  )

  const total = subscriptions.length
  const progress = Math.min(currentIndex, total)

  // The subscription currently on top of the stack
  const currentSub = currentIndex < total ? subscriptions[currentIndex] : null

  // ── Handle swipe decision ───────────────────────────────────────────────

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      if (!currentSub) return

      const decision: SwipeDecision = {
        id: currentSub.id,
        decision: direction === "right" ? "paid" : "skipped",
      }

      const newDecisions = [...decisions, decision]
      setDecisions(newDecisions)

      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)

      // If all cards are done, submit
      if (nextIndex >= total) {
        setFlowState("completing")
        const paidIds = newDecisions
          .filter((d) => d.decision === "paid")
          .map((d) => d.id)

        completeSwipeoff(paidIds).then((result) => {
          if (result.error) {
            // Still move to done state — the user can update manually via calendar
            console.error("Swipeoff error:", result.error)
          }
          setFlowState("done")
          // Auto-dismiss after 1.5s
          setTimeout(() => {
            onComplete()
          }, 1500)
        })
      }
    },
    [currentSub, decisions, currentIndex, total, onComplete]
  )

  // ── Button handlers (trigger programmatic swipe with animation) ──────────

  const handleSkipButton = useCallback(() => {
    setExitDirection("left")
  }, [])

  const handlePaidButton = useCallback(() => {
    setExitDirection("right")
  }, [])

  // Called by AnimatePresence after exit animation completes
  const handleExitComplete = useCallback(() => {
    setExitDirection(null)
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background pb-[env(safe-area-inset-bottom,0px)]">
      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      <div className="w-full shrink-0 bg-muted">
        <div
          className="h-1 bg-primary transition-all duration-300 ease-out"
          style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
        />
      </div>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-border px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide leading-none text-muted-foreground md:text-xs lg:text-sm">
          Daily Check-in
        </span>
        <h1 className="text-xl font-heading font-semibold leading-tight text-foreground md:text-2xl lg:text-3xl">
          {flowState === "done"
            ? "All caught up!"
            : flowState === "completing"
              ? "Saving..."
              : `Today's Subscriptions`}
        </h1>
        <p className="mt-0.5 text-xs font-normal leading-normal text-muted-foreground md:text-xs lg:text-sm">
          {flowState === "swiping" &&
            `${progress} of ${total} reviewed`}
          {flowState === "completing" && "Updating your subscriptions..."}
          {flowState === "done" && "Your subscriptions are up to date."}
        </p>
      </div>

      {/* ── Card area ────────────────────────────────────────────────────── */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4">
        {flowState === "swiping" && (
          <AnimatePresence onExitComplete={handleExitComplete}>
            {/* Render up to 3 stacked cards behind the active one */}
            {subscriptions
              .slice(currentIndex, currentIndex + 3)
              .reverse()
              .map((sub, reversedI) => {
                const stackSize = Math.min(3, total - currentIndex)
                const stackIndex = stackSize - 1 - reversedI // 0 = top
                const isTop = stackIndex === 0

                return isTop ? (
                  <SwipeCard
                    key={sub.id}
                    subscription={sub}
                    stackIndex={0}
                    onSwipe={handleSwipe}
                    exitDirection={exitDirection}
                  />
                ) : (
                  <StackedCard
                    key={sub.id}
                    subscription={sub}
                    stackIndex={stackIndex}
                  />
                )
              })}
          </AnimatePresence>
        )}

        {flowState === "completing" && (
          <div className="flex flex-col items-center gap-3">
            <Loader2
              className="size-8 animate-spin text-muted-foreground"
              strokeWidth={1.25}
            />
            <p className="text-sm font-normal leading-relaxed text-muted-foreground md:text-base lg:text-base">
              Saving your decisions...
            </p>
          </div>
        )}

        {flowState === "done" && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="flex size-16 items-center justify-center border border-border">
              <Check className="size-8 text-foreground" strokeWidth={1.25} />
            </div>
            <p className="text-lg font-heading font-medium leading-snug text-foreground md:text-xl lg:text-2xl">
              All caught up!
            </p>
            <p className="text-xs font-normal leading-normal text-muted-foreground md:text-xs lg:text-sm">
              {decisions.filter((d) => d.decision === "paid").length} marked
              paid · {decisions.filter((d) => d.decision === "skipped").length}{" "}
              skipped
            </p>
            <Button
              type="button"
              variant="default"
              onClick={onComplete}
              className="mt-2 h-9 px-5 rounded-none text-sm font-medium leading-none md:text-sm lg:text-base"
            >
              Continue to Dashboard
            </Button>
          </motion.div>
        )}
      </div>

      {/* ── Action Buttons ───────────────────────────────────────────────── */}
      {flowState === "swiping" && currentSub && (
        <div className="shrink-0 border-t border-border px-4 py-4">
          <div className="mx-auto grid max-w-sm grid-cols-2 gap-3">
            {/* Skip (left) button */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              aria-label="Skip — mark as unpaid"
              onClick={handleSkipButton}
              className="h-11 gap-2 rounded-none border-border bg-background text-sm font-medium leading-none text-foreground hover:bg-muted hover:text-foreground md:h-12 md:text-sm lg:text-base"
            >
              <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
              <span>Skip</span>
            </Button>

            {/* Paid (right) button */}
            <Button
              type="button"
              variant="default"
              size="lg"
              aria-label="Mark as paid"
              onClick={handlePaidButton}
              className="h-11 gap-2 rounded-none border border-primary bg-primary text-sm font-medium leading-none text-primary-foreground hover:bg-primary/90 md:h-12 md:text-sm lg:text-base"
            >
              <Check className="size-4" strokeWidth={1.5} aria-hidden="true" />
              <span>Mark Paid</span>
            </Button>
          </div>

          {/* Swipe hint */}
          <p className="mt-3 text-center text-xs font-normal leading-normal text-muted-foreground md:text-xs lg:text-sm">
            Swipe right to mark paid · Swipe left to skip
          </p>
        </div>
      )}
    </div>
  )
}

// ── Stacked (non-interactive) card ──────────────────────────────────────────

function StackedCard({
  subscription,
  stackIndex,
}: {
  subscription: Subscription
  stackIndex: number
}) {
  const scale = 1 - stackIndex * 0.05
  const yOffset = stackIndex * 8

  return (
    <motion.div
      className="pointer-events-none absolute w-full max-w-sm"
      style={{
        scale,
        y: yOffset,
        zIndex: 10 - stackIndex,
      }}
      initial={false}
      animate={{ scale, y: yOffset }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <SubscriptionCard subscription={subscription} />
    </motion.div>
  )
}

// ── Interactive swipe card ──────────────────────────────────────────────────

function SwipeCard({
  subscription,
  onSwipe,
  exitDirection,
}: {
  subscription: Subscription
  stackIndex: number
  onSwipe: (direction: "left" | "right") => void
  exitDirection: "left" | "right" | null
}) {
  const [isDragging, setIsDragging] = useState(false)
  const x = useMotionValue(0)

  // Rotation based on drag distance: max ±12deg
  const rotate = useTransform(x, [-300, 0, 300], [-12, 0, 12])

  // Opacity of the "PAID" / "SKIP" overlay labels
  const paidOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1])
  const skipOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0])

  // Determine exit animation based on button press or drag
  const exitX = exitDirection === "right" ? 600 : exitDirection === "left" ? -600 : 0
  const shouldExit = exitDirection !== null

  // ── Automated Idle Hint Animation ─────────────────────────────────────────
  useEffect(() => {
    if (shouldExit || isDragging) return

    let animationControls: ReturnType<typeof animate> | null = null

    // Start idle peek animation after 2 second of inactivity
    const timer = setTimeout(() => {
      // Low-threshold subtle peek animation (24px offset right & left)
      animationControls = animate(x, [0, 24, 0, -24, 0], {
        duration: 1.4,
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 2.5,
      })
    }, 2000)

    return () => {
      clearTimeout(timer)
      animationControls?.stop()
    }
  }, [x, shouldExit, isDragging])

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      setIsDragging(false)
      const offsetX = info.offset.x
      const velocityX = info.velocity.x

      // Swipe right
      if (offsetX > SWIPE_THRESHOLD || velocityX > 500) {
        onSwipe("right")
        return
      }

      // Swipe left
      if (offsetX < -SWIPE_THRESHOLD || velocityX < -500) {
        onSwipe("left")
        return
      }

      // Otherwise snap back (motion handles this via dragSnapToOrigin)
    },
    [onSwipe]
  )

  return (
    <motion.div
      className="absolute z-10 w-full max-w-sm cursor-grab touch-none active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragElastic={0.7}
      dragSnapToOrigin={!shouldExit}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        x: shouldExit ? exitX : 0,
      }}
      exit={{
        x: exitX || (x.get() > 0 ? 600 : -600),
        opacity: 0,
        transition: { duration: 0.3, ease: "easeOut" },
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onAnimationComplete={() => {
        // When button-triggered animation finishes at the exit position
        if (shouldExit && exitDirection) {
          onSwipe(exitDirection)
        }
      }}
    >
      {/* Swipe decision overlays */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
        style={{ opacity: paidOpacity }}
      >
        <span className="border-2 border-emerald-600 px-4 py-2 text-2xl font-bold uppercase tracking-wider text-emerald-600 dark:border-emerald-400 dark:text-emerald-400">
          Paid
        </span>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
        style={{ opacity: skipOpacity }}
      >
        <span className="border-2 border-muted-foreground px-4 py-2 text-2xl font-bold uppercase tracking-wider text-muted-foreground">
          Skip
        </span>
      </motion.div>

      <SubscriptionCard subscription={subscription} />
    </motion.div>
  )
}

// ── Shared card content ─────────────────────────────────────────────────────

function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  const sub = subscription
  const styles = planTypeStyles[sub.plan_type]
  const statusStyle = statusStyles[sub.subscription_status]

  const formattedDate = useMemo(() => {
    const d = new Date(sub.next_due_date)
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }, [sub.next_due_date])

  return (
    <div className="flex flex-col overflow-hidden border border-border bg-card ring-1 ring-foreground/10">
      {/* Plan-type accent bar */}
      <div className={cn("h-1 w-full shrink-0", styles.bar)} aria-hidden="true" />

      <div className="flex flex-col gap-4 p-5">
        {/* Top row: service name + status */}
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 flex-1 truncate text-lg font-heading font-medium leading-snug text-foreground md:text-xl lg:text-2xl">
            {sub.service_name}
          </h2>
          <Badge
            variant="outline"
            className={cn("shrink-0 uppercase", statusStyle)}
          >
            {sub.subscription_status}
          </Badge>
        </div>

        {/* Cost — large display */}
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wide leading-none text-muted-foreground md:text-xs lg:text-sm">
            Cost
          </span>
          <span className="mt-1 text-2xl font-bold tabular-nums leading-tight text-foreground md:text-3xl lg:text-4xl">
            ₱{sub.cost.toLocaleString()}
          </span>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide leading-none text-muted-foreground md:text-xs lg:text-sm">
              Plan
            </span>
            <Badge
              variant="outline"
              className={cn("w-fit rounded-none", styles.badge)}
            >
              {sub.plan_type}
            </Badge>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide leading-none text-muted-foreground md:text-xs lg:text-sm">
              Payment
            </span>
            <span className="flex items-center gap-1 text-sm font-normal leading-relaxed text-foreground md:text-base lg:text-base">
              <CreditCard className="size-3.5 text-muted-foreground" />
              {sub.payment_mode}
            </span>
          </div>

          <div className="col-span-2 flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide leading-none text-muted-foreground md:text-xs lg:text-sm">
              Due Date
            </span>
            <span className="flex items-center gap-1 text-sm font-normal leading-relaxed text-foreground md:text-base lg:text-base">
              <CalendarDays className="size-3.5 text-muted-foreground" />
              {formattedDate}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
