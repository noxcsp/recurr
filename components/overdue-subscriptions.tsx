"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface OverdueSubscriptionItem {
  id: string
  name: string
  billingCycle: string
  daysOverdue: number | string
  price: string
  imageUrl: string
}

export interface OverdueSubscriptionsProps {
  subscriptions?: OverdueSubscriptionItem[]
  className?: string
}

const DEFAULT_OVERDUE_SUBSCRIPTIONS: OverdueSubscriptionItem[] = [
  {
    id: "overdue-1",
    name: "Netflix",
    billingCycle: "Monthly",
    daysOverdue: "3 days",
    price: "$15.99",
    imageUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=120&h=120&fit=crop&auto=format",
  },
  {
    id: "overdue-2",
    name: "Adobe Creative Cloud",
    billingCycle: "Annual",
    daysOverdue: "5 days",
    price: "$54.99",
    imageUrl: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=120&h=120&fit=crop&auto=format",
  },
  {
    id: "overdue-3",
    name: "Spotify Premium",
    billingCycle: "Monthly",
    daysOverdue: "12 days",
    price: "$10.99",
    imageUrl: "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=120&h=120&fit=crop&auto=format",
  },
  {
    id: "overdue-4",
    name: "Spotify Premium",
    billingCycle: "Monthly",
    daysOverdue: "12 days",
    price: "$10.99",
    imageUrl: "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=120&h=120&fit=crop&auto=format",
  },
  {
    id: "overdue-5",
    name: "Spotify Premium",
    billingCycle: "Monthly",
    daysOverdue: "12 days",
    price: "$10.99",
    imageUrl: "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=120&h=120&fit=crop&auto=format",
  },
]

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
      <img
        src={src}
        alt={alt}
        onError={() => setHasError(true)}
        className="size-full rounded-none object-cover"
      />
    </div>
  )
}

export function OverdueSubscriptions({
  subscriptions = DEFAULT_OVERDUE_SUBSCRIPTIONS,
  className,
}: OverdueSubscriptionsProps) {
  if (subscriptions.length === 0) {
    return null
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      {/* Header section outside of card */}
      <div className="flex items-center justify-between px-0.5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground md:text-xs lg:text-sm">
            Overdue Subscriptions
          </span>
          <h2 className="text-xl font-heading tracking-tight text-foreground md:text-xl lg:text-2xl">
            Action Required
          </h2>
        </div>
        <Badge variant="outline" className="rounded-none border-destructive text-xs font-semibold text-destructive">
          {subscriptions.length} Overdue
        </Badge>
      </div>

      {/* Card container for the subscription list */}
      <Card className="rounded-none border-border [--card-spacing:spacing(0)]">
        <CardContent className="max-h-72 overflow-y-auto p-0">
          <ul className="divide-y divide-border">
            {subscriptions.map((sub) => (
              <li
                key={sub.id}
                className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/50"
              >
                <SubscriptionLogo src={sub.imageUrl} alt={`${sub.name} logo`} name={sub.name} />
                {/* Left side: Subscription Name & Billing Cycle */}
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="truncate text-sm font-semibold leading-tight text-foreground md:text-base lg:text-base">
                    {sub.name}
                  </h4>
                  <p className="text-xs font-normal text-muted-foreground md:text-xs lg:text-sm">
                    {sub.billingCycle}
                  </p>
                </div>

                {/* Right side: Days overdue & price */}
                <div className="flex shrink-0 items-center gap-3 md:gap-4">
                  <div className="flex flex-col items-end space-y-0.5 text-right">
                    <span className="text-xs font-medium text-destructive md:text-xs lg:text-sm">
                      {typeof sub.daysOverdue === "number" ? `${sub.daysOverdue} days overdue` : sub.daysOverdue}
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
