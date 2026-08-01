"use client"

import { useHomeData } from "@/contexts/home-data-context"
import { DashboardMetrics } from "@/components/dashboard-metrics"
import { OverdueSubscriptions } from "@/components/overdue-subscriptions"

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

export function DashboardTab() {
  const { user, profile, analytics, subscriptions } = useHomeData()
  const greeting = getTimeBasedGreeting()
  const displayName =
    profile?.display_name ||
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 overflow-y-auto pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-heading font-semibold leading-tight md:text-2xl lg:text-3xl">
          {displayName ? `${greeting}, ${displayName}!` : `${greeting}!`}
        </h1>
      </div>
      <DashboardMetrics
        monthlySpend={analytics?.monthlySpend}
        spendTrend={analytics?.spendTrend}
        trendPercentage={analytics?.trendPercentage}
        trendLabel={analytics?.trendLabel}
        activeSubscriptionsCount={analytics?.activeSubscriptionsCount}
        dueThisWeekCount={analytics?.dueThisWeekCount}
        topSubscriptionName={analytics?.topSubscriptionName}
        topSubscriptionCost={analytics?.topSubscriptionCost}
        topSubscriptionBillingCycle={analytics?.topSubscriptionBillingCycle}
      />
      <OverdueSubscriptions subscriptions={subscriptions} />
    </div>
  )
}
