"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { Subscription } from "@/types/subscriptions"
import { getOverdueSubscriptions } from "@/lib/analytics"
import { CheckCheck } from "lucide-react"
import Image from "next/image"

export interface OverdueSubscriptionItem {
  id: string
  name: string
  billingCycle: string
  daysOverdue: string
  price: string
  imageUrl: string
}

export interface OverdueSubscriptionsProps {
  subscriptions?: Subscription[] | OverdueSubscriptionItem[]
  isLoading?: boolean
  className?: string
}

export function OverdueSubscriptionsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex items-center justify-between px-0.5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground md:text-xs lg:text-sm">
            Overdue Subscriptions
          </span>
          <h2 className="text-xl font-heading tracking-tight text-foreground md:text-xl lg:text-2xl">
            Action Required
          </h2>
        </div>
        <Skeleton className="h-5 w-20" />
      </div>

      <Card className="rounded-none border-border [--card-spacing:spacing(0)]">
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex items-center justify-between gap-3 p-4">
                <Skeleton className="size-10 shrink-0 md:size-12" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-2/5" />
                </div>
                <div className="flex flex-col items-end space-y-1.5">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function SubscriptionLogo({ src, alt, name }: { src: string; alt: string; name: string }) {
  const [hasError, setHasError] = React.useState(false)

  if (hasError || !src) {
    return (
      <div className="flex size-10 shrink-0 items-center justify-center rounded-none border border-border bg-muted font-heading text-xs font-bold text-muted-foreground md:size-12">
        {name.slice(0, 2).toUpperCase()}
      </div>
    )
  }

  return (
    <div className="relative size-10 shrink-0 overflow-hidden rounded-none border border-border bg-muted md:size-12">
      <Image src={src} alt={alt} fill className="rounded-none object-cover" onError={() => setHasError(true)} />
    </div>
  )
}

export function OverdueSubscriptions({
  subscriptions = [],
  isLoading = false,
  className,
}: OverdueSubscriptionsProps) {
  const overdueItems: OverdueSubscriptionItem[] = React.useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) return []

    const firstItem = subscriptions[0] as Record<string, unknown>
    if ("service_name" in firstItem && "next_due_date" in firstItem) {
      const { overdueItems: items } = getOverdueSubscriptions(subscriptions as Subscription[])
      return items
    }

    return subscriptions as OverdueSubscriptionItem[]
  }, [subscriptions])

  if (isLoading) {
    return <OverdueSubscriptionsSkeleton className={className} />
  }

  if (overdueItems.length === 0) {
    return (
      <div className={cn("space-y-2.5", className)}>
        <div className="flex items-center justify-between px-0.5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground md:text-xs lg:text-sm">
              Overdue Subscriptions
            </span>
            <h2 className="text-xl font-heading tracking-tight text-foreground md:text-xl lg:text-2xl">
              Action Required
            </h2>
          </div>
        </div>

        <Card className="rounded-none border-border [--card-spacing:spacing(0)]">
          <CardContent className="max-h-72 overflow-y-auto p-0">
            <div className="flex h-44 flex-col items-center justify-center gap-2.5 p-6 text-center">
              <CheckCheck className="size-7 stroke-[1.25] text-success" aria-hidden="true" />
              <p className="text-base font-heading font-medium leading-normal text-foreground md:text-md lg:text-lg">
                You&apos;re all caught up!
              </p>
              <p className="text-xs font-normal leading-relaxed text-muted-foreground md:text-xs lg:text-sm">
                No overdue subscriptions detected. Great job!
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
            Overdue Subscriptions
          </span>
          <h2 className="text-xl font-heading tracking-tight text-foreground md:text-xl lg:text-2xl">
            Action Required
          </h2>
        </div>
        <Badge variant="outline" className="rounded-none border-destructive text-xs font-medium text-destructive">
          {overdueItems.length} Overdue
        </Badge>
      </div>

      {/* Card container for the subscription list */}
      <Card className="rounded-none border-border [--card-spacing:spacing(0)]">
        <CardContent className="max-h-72 overflow-y-auto p-0">
          <ul className="divide-y divide-border">
            {overdueItems.map((sub) => (
              <li
                key={sub.id}
                className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/50"
              >
                <SubscriptionLogo src={sub.imageUrl} alt={`${sub.name} logo`} name={sub.name} />
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="truncate text-sm font-semibold leading-tight text-foreground md:text-base lg:text-base">
                    {sub.name}
                  </h4>
                  <p className="text-xs font-normal text-muted-foreground md:text-xs lg:text-sm">
                    {sub.billingCycle}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3 md:gap-4">
                  <div className="flex flex-col items-end space-y-0.5 text-right">
                    <span className="text-xs font-normal text-destructive md:text-xs lg:text-sm">
                      {sub.daysOverdue}
                    </span>
                    <span className="text-sm font-bold text-foreground md:text-base lg:text-base tabular-nums">
                      {sub.price}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
