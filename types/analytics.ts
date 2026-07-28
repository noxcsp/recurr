import type { Database } from "@/types/supabase"

export type PaymentRecord = Database["public"]["Tables"]["subscription_payments"]["Row"]
export interface DashboardAnalytics {
  monthlySpend: string
  yearlySpend: string
  spendTrend: "up" | "down" | "flat"
  trendPercentage: string
  trendLabel: string
  activeSubscriptionsCount: number
  dueThisWeekCount: number
  topSubscriptionName: string
  topSubscriptionCost: string
  topSubscriptionBillingCycle: string
}
