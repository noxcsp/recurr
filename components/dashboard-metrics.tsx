import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingDown, TrendingUp, Minus } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"

export interface DashboardMetricsProps {
  monthlySpend?: string | number
  spendTrend?: "up" | "down" | "flat"
  trendPercentage?: string
  trendLabel?: string
  activeSubscriptionsCount?: number
  dueThisWeekCount?: number
  topSubscriptionName?: string
  topSubscriptionCost?: string | number
  topSubscriptionBillingCycle?: string
  isLoading?: boolean
  className?: string
}

export function DashboardMetricsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Monthly Spend Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-28 md:h-4 lg:h-5" />
          <Skeleton className="h-9 w-36 md:h-10 lg:h-12" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-4 shrink-0" />
            <Skeleton className="h-4 w-44 md:h-4 lg:h-5" />
          </div>
        </CardContent>
      </Card>

      {/* 1x2 Cards for Active Subscriptions and Due This Week */}
      <div className="grid grid-cols-2 gap-4">
        {/* Active Subscriptions Card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-24 md:h-4 lg:h-5" />
            <Skeleton className="h-9 w-12 md:h-10 lg:h-12" />
          </CardHeader>
        </Card>

        {/* Due This Week Card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-28 md:h-4 lg:h-5" />
            <Skeleton className="h-9 w-12 md:h-10 lg:h-12" />
          </CardHeader>
        </Card>
      </div>

      {/* Top Monthly Subscription Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-44 md:h-4 lg:h-5" />
          <Skeleton className="h-7 w-36 md:h-8 lg:h-9" />
        </CardHeader>
        <CardContent className="space-y-1">
          <Skeleton className="h-5 w-24 md:h-6 lg:h-7" />
          <Skeleton className="h-4 w-40 md:h-4 lg:h-5" />
        </CardContent>
      </Card>
    </div>
  )
}

export function DashboardMetrics({
  monthlySpend = formatCurrency(0),
  spendTrend = "flat",
  trendPercentage = "0%",
  trendLabel = "no change from last month",
  activeSubscriptionsCount = 0,
  dueThisWeekCount = 0,
  topSubscriptionName = "N/A",
  topSubscriptionCost = formatCurrency(0),
  topSubscriptionBillingCycle = "No active subscriptions",
  isLoading = false,
  className,
}: DashboardMetricsProps) {
  if (isLoading) {
    return <DashboardMetricsSkeleton className={className} />
  }

  const formattedMonthlySpend =
    typeof monthlySpend === "number" ? formatCurrency(monthlySpend) : monthlySpend
  const formattedTopCost =
    typeof topSubscriptionCost === "number"
      ? formatCurrency(topSubscriptionCost)
      : topSubscriptionCost
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Monthly Spend Card */}
      <Card>
        <CardHeader>
          <CardDescription className="text-xs font-sans font-semibold uppercase tracking-wider text-muted-foreground md:text-xs lg:text-sm">
            Monthly Spend
          </CardDescription>
          <CardTitle className="text-4xl font-sans tabular-nums tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {formattedMonthlySpend}
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
            <CardDescription className="text-xs font-sans font-semibold uppercase tracking-wider text-muted-foreground md:text-xs lg:text-sm">
              Active Subs
            </CardDescription>
            <CardTitle className="text-3xl font-sans tabular-nums text-success md:text-4xl lg:text-5xl">
              {activeSubscriptionsCount}
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Due This Week Card */}
        <Card>
          <CardHeader>
            <CardDescription className="text-xs font-sans font-semibold uppercase tracking-wider text-muted-foreground md:text-xs lg:text-sm">
              Due This Week
            </CardDescription>
            <CardTitle className="text-3xl font-sans tabular-nums text-warning md:text-4xl lg:text-5xl">
              {dueThisWeekCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Top Monthly Subscription Card */}
      <Card>
        <CardHeader>
          <CardDescription className="text-xs font-sans font-semibold uppercase tracking-wider text-muted-foreground md:text-xs lg:text-sm">
            Top Monthly Subscription
          </CardDescription>
          <CardTitle className="text-3xl font-heading font-semibold text-foreground md:text-4xl lg:text-5xl">
            {topSubscriptionName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-base font-sans tabular-nums font-medium text-foreground md:text-lg lg:text-xl">
            {formattedTopCost}
          </p>
          <p className="text-xs font-normal text-muted-foreground md:text-xs lg:text-sm">
            {topSubscriptionBillingCycle}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
