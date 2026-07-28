export interface PaymentRecord {
  id: string
  user_id: string
  subscription_id: string | null
  service_name: string
  amount: number
  plan_type: string
  payment_date: string
  created_at: string
}

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
