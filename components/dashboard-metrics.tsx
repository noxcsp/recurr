import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingDown, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DashboardMetricsProps {
  monthlySpend?: string
  spendTrend?: "up" | "down"
  trendPercentage?: string
  activeSubscriptionsCount?: number
  dueThisWeekCount?: number
  topSubscriptionName?: string
  topSubscriptionCost?: string
  topSubscriptionBillingCycle?: string
  className?: string
}

export function DashboardMetrics({
  monthlySpend = "$248.50",
  spendTrend = "down",
  trendPercentage = "12%",
  activeSubscriptionsCount = 12,
  dueThisWeekCount = 3,
  topSubscriptionName = "ChatGPT Plus",
  topSubscriptionCost = "$20.00 / month",
  topSubscriptionBillingCycle = "Renews on the 1st of every month",
  className,
}: DashboardMetricsProps) {
  const isSpendDecreased = spendTrend === "down"

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
              isSpendDecreased ? "text-success" : "text-destructive"
            )}
          >
            {isSpendDecreased ? (
              <TrendingDown className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <TrendingUp className="size-4 shrink-0" aria-hidden="true" />
            )}
            <span>
              {trendPercentage} {isSpendDecreased ? "decreased" : "increased"} from last month
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
