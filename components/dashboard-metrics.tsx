import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingDown, TrendingUp, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DashboardMetricsProps {
  monthlySpend?: string
  spendTrend?: "up" | "down" | "flat"
  trendPercentage?: string
  trendLabel?: string
  activeSubscriptionsCount?: number
  dueThisWeekCount?: number
  topSubscriptionName?: string
  topSubscriptionCost?: string
  topSubscriptionBillingCycle?: string
  className?: string
}

export function DashboardMetrics({
  monthlySpend = "₱0.00",
  spendTrend = "flat",
  trendPercentage = "0%",
  trendLabel = "no change from last month",
  activeSubscriptionsCount = 0,
  dueThisWeekCount = 0,
  topSubscriptionName = "N/A",
  topSubscriptionCost = "₱0.00",
  topSubscriptionBillingCycle = "No active subscriptions",
  className,
}: DashboardMetricsProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Monthly Spend Card */}
      <Card>
        <CardHeader>
          <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground md:text-xs lg:text-sm">
            Monthly Spend
          </CardDescription>
          <CardTitle className="text-3xl font-heading font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            {monthlySpend}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium md:text-xs lg:text-sm",
              spendTrend === "down"
                ? "text-success"
                : spendTrend === "up"
                ? "text-destructive"
                : "text-muted-foreground"
            )}
          >
            {spendTrend === "down" ? (
              <TrendingDown className="size-4 shrink-0" aria-hidden="true" />
            ) : spendTrend === "up" ? (
              <TrendingUp className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <Minus className="size-4 shrink-0" aria-hidden="true" />
            )}
            <span>
              {trendPercentage} {trendLabel}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 1x2 Cards for Active Subscriptions and Due This Week */}
      <div className="grid grid-cols-2 gap-4">
        {/* Active Subscriptions Card */}
        <Card>
          <CardHeader>
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground md:text-xs lg:text-sm">
              Active Subs
            </CardDescription>
            <CardTitle className="text-3xl font-heading font-bold text-foreground md:text-4xl lg:text-5xl">
              {activeSubscriptionsCount}
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Due This Week Card */}
        <Card>
          <CardHeader>
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground md:text-xs lg:text-sm">
              Due This Week
            </CardDescription>
            <CardTitle className="text-3xl font-heading font-bold text-warning md:text-4xl lg:text-5xl">
              {dueThisWeekCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Top Monthly Subscription Card */}
      <Card>
        <CardHeader>
          <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground md:text-xs lg:text-sm">
            Top Monthly Subscription
          </CardDescription>
          <CardTitle className="text-2xl font-heading font-bold tracking-tight text-primary md:text-3xl lg:text-4xl">
            {topSubscriptionName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-base font-medium text-foreground md:text-lg lg:text-xl">
            {topSubscriptionCost}
          </p>
          <p className="text-xs font-normal text-muted-foreground md:text-xs lg:text-sm">
            {topSubscriptionBillingCycle}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
