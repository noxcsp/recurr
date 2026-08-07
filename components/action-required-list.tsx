"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { Subscription } from "@/types/subscriptions"
import { SubscriptionCard } from "@/components/subscription-card"
import { CheckCheck } from "lucide-react"

export interface ActionRequiredListItem {
  id: string
  name: string
  billingCycle: string
  daysOverdue: string
  price: string | number
  imageUrl: string
}

export interface ActionRequiredListProps {
  subscriptions?: Subscription[] | ActionRequiredListItem[]
  isLoading?: boolean
  className?: string
}

/**
 * Filter subscriptions that require action:
 * Includes both overdue subscriptions AND subscriptions due within the next 7 days.
 */
export function getActionRequiredSubscriptions(
  subscriptions: Subscription[],
  referenceDate: Date = new Date()
): Subscription[] {
  if (!subscriptions || subscriptions.length === 0) return []

  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)

  const sevenDaysLater = new Date(today)
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)
  sevenDaysLater.setHours(23, 59, 59, 999)

  return subscriptions
    .filter((sub) => {
      if (sub.subscription_status === "cancelled") return false
      if (sub.subscription_status === "paid") return false

      const refDateStr = sub.is_trial && sub.trial_end_date ? sub.trial_end_date : sub.next_due_date
      if (!refDateStr) return false

      const dateParts = refDateStr.split("T")[0].split("-").map(Number)
      if (dateParts.length < 3 || !dateParts[0] || !dateParts[1] || !dateParts[2]) return false

      const dueDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2])

      const isOverdue = sub.subscription_status === "overdue" || dueDate < today
      const isDueThisWeek = dueDate >= today && dueDate <= sevenDaysLater

      return isOverdue || isDueThisWeek
    })
    .sort((a, b) => {
      const dateStrA = a.is_trial && a.trial_end_date ? a.trial_end_date : a.next_due_date ?? ""
      const dateStrB = b.is_trial && b.trial_end_date ? b.trial_end_date : b.next_due_date ?? ""
      return dateStrA.localeCompare(dateStrB)
    })
}

export function ActionRequiredListSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex items-center justify-between px-0.5">
        <div className="space-y-1">
          <Skeleton className="h-3.5 w-24 md:h-4" />
          <Skeleton className="h-6 w-36 md:h-7" />
        </div>
        <Skeleton className="h-7 w-16" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-none" />
        ))}
      </div>
    </div>
  )
}

export function ActionRequiredList({
  subscriptions = [],
  isLoading = false,
  className,
}: ActionRequiredListProps) {
  const handleSeeAll = React.useCallback(() => {
    const subsNavBtn = document.getElementById("nav-subscriptions")
    if (subsNavBtn) {
      subsNavBtn.click()
    } else {
      const desktopList = document.getElementById("desktop-subscriptions-list")
      if (desktopList) {
        desktopList.scrollIntoView({ behavior: "smooth" })
      }
    }
  }, [])

  const actionRequiredItems = React.useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) return []
    const firstItem = subscriptions[0] as Record<string, unknown>
    if ("service_name" in firstItem) {
      return getActionRequiredSubscriptions(subscriptions as Subscription[])
    }
    return []
  }, [subscriptions])

  if (isLoading) {
    return <ActionRequiredListSkeleton className={className} />
  }

  if (actionRequiredItems.length === 0) {
    return (
      <div className={cn("space-y-2.5", className)}>
        <div className="flex items-center justify-between px-0.5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground md:text-xs lg:text-sm">
              Due & Overdue
            </span>
            <h2 className="text-xl font-heading tracking-tight text-foreground md:text-xl lg:text-2xl">
              Action Required
            </h2>
          </div>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={handleSeeAll}
            className="rounded-none border-border text-xs font-medium"
          >
            See all
          </Button>
        </div>

        <Card className="rounded-none border-border [--card-spacing:spacing(0)]">
          <CardContent className="p-0">
            <div className="flex h-44 flex-col items-center justify-center gap-2.5 p-6 text-center">
              <CheckCheck className="size-7 stroke-[1.25] text-success" aria-hidden="true" />
              <p className="text-base font-heading font-medium leading-normal text-foreground md:text-md lg:text-lg">
                You&apos;re all caught up!
              </p>
              <p className="text-xs font-normal leading-relaxed text-muted-foreground md:text-xs lg:text-sm">
                No overdue subscriptions or items due this week. Great job!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex items-center justify-between px-0.5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground md:text-xs lg:text-sm">
            Due & Overdue
          </span>
          <h2 className="text-xl font-heading tracking-tight text-foreground md:text-xl lg:text-2xl">
            Action Required
          </h2>
        </div>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={handleSeeAll}
          className="rounded-none border-border text-xs font-medium"
        >
          See all
        </Button>
      </div>

      <ul className="flex flex-col gap-3">
        {actionRequiredItems.map((sub) => (
          <SubscriptionCard
            key={sub.id}
            sub={sub}
            enableSwipe={false}
            showActions={false}
          />
        ))}
      </ul>
    </div>
  )
}
