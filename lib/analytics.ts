import type { Subscription } from "@/types/subscriptions"
import type { PaymentRecord, DashboardAnalytics } from "@/types/analytics"

/**
 * Calculates dashboard metrics including actual cash outflow spend trends,
 * active subscriptions count, due this week count, and top subscription details.
 */
export function calculateDashboardAnalytics(
  subscriptions: Subscription[],
  payments: PaymentRecord[],
  referenceDate: Date = new Date()
): DashboardAnalytics {
  const currentYear = referenceDate.getFullYear()
  const currentMonth = referenceDate.getMonth()
  const formatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Previous month calculations (handles January -> December transition)
  const prevMonthDate = new Date(referenceDate)
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1)
  const prevYear = prevMonthDate.getFullYear()
  const prevMonth = prevMonthDate.getMonth()

  // 1. Calculate Actual Cash Outflow for Current Month
  const currentMonthPayments = payments.filter((p) => {
    const d = new Date(p.payment_date)
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth
  })
  const currentMonthSpend = currentMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0)

  // 1b. Calculate Actual Cash Outflow for Current Year
  const currentYearPayments = payments.filter((p) => {
    const d = new Date(p.payment_date)
    return d.getFullYear() === currentYear
  })
  const currentYearSpend = currentYearPayments.reduce((sum, p) => sum + Number(p.amount), 0)

  // 2. Calculate Actual Cash Outflow for Previous Month
  const previousMonthPayments = payments.filter((p) => {
    const d = new Date(p.payment_date)
    return d.getFullYear() === prevYear && d.getMonth() === prevMonth
  })
  const previousMonthSpend = previousMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0)

  // 3. Compute Spend Trend, Percentage & Label
  let spendTrend: "up" | "down" | "flat" = "flat"
  let trendPercentage = "0%"
  let trendLabel = "no spend this month"

  if (previousMonthSpend > 0) {
    const diff = currentMonthSpend - previousMonthSpend
    if (diff === 0) {
      spendTrend = "flat"
      trendPercentage = "0%"
      trendLabel = "no change from last month"
    } else if (diff > 0) {
      const pct = Math.round((diff / previousMonthSpend) * 100)
      spendTrend = "up"
      trendPercentage = `${pct}% (+${formatter.format(diff)})`
      trendLabel = "increased from last month"
    } else {
      const absDiff = Math.abs(diff)
      const pct = Math.round((absDiff / previousMonthSpend) * 100)
      spendTrend = "down"
      trendPercentage = `${pct}% (-${formatter.format(absDiff)})`
      trendLabel = "decreased from last month"
    }
  } else if (currentMonthSpend > 0) {
    // First-tracked baseline month: Use 'flat' so it displays in neutral text rather than alarmist red
    spendTrend = "flat"
    trendPercentage = `+${formatter.format(currentMonthSpend)}`
    trendLabel = "new spend this month"
  } else {
    spendTrend = "flat"
    trendPercentage = formatter.format(0)
    trendLabel = "no spend this month"
  }

  // 4. Active Subscriptions Count
  const activeSubscriptionsCount = subscriptions.length

  // 5. Due This Week Count (Next due date within today and today + 7 days)
  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)
  const sevenDaysLater = new Date(today)
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)

  const dueThisWeekCount = subscriptions.filter((sub) => {
    // Treat next_due_date as local date (YYYY-MM-DD)
    const [y, m, d] = sub.next_due_date.split("-").map(Number)
    if (!y || !m || !d) return false
    const dueDate = new Date(y, m - 1, d)
    return dueDate >= today && dueDate <= sevenDaysLater
  }).length

  // 6. Top Subscription (highest normalized monthly cost)
  let topSubName = "N/A"
  let topSubCostStr = formatter.format(0)
  let topSubBillingCycle = "No active subscriptions"

  if (subscriptions.length > 0) {
    const getMonthlyEquivalent = (sub: Subscription) => {
      const cost = Number(sub.cost)
      if (sub.plan_type === "Weekly") return cost * (52 / 12)
      if (sub.plan_type === "Annual") return cost / 12
      return cost // Monthly
    }

    const sortedSubs = [...subscriptions].sort(
      (a, b) => getMonthlyEquivalent(b) - getMonthlyEquivalent(a)
    )
    const topSub = sortedSubs[0]

    topSubName = topSub.service_name
    topSubCostStr = formatter.format(Number(topSub.cost))

    if (topSub.plan_type === "Monthly") {
      topSubBillingCycle = "Billed monthly"
    } else if (topSub.plan_type === "Annual") {
      topSubBillingCycle = "Billed annually"
    } else {
      topSubBillingCycle = "Billed weekly"
    }
  }

  const formattedMonthlySpend = formatter.format(currentMonthSpend)
  const formattedYearlySpend = formatter.format(currentYearSpend)

  return {
    monthlySpend: formattedMonthlySpend,
    yearlySpend: formattedYearlySpend,
    spendTrend,
    trendPercentage,
    trendLabel,
    activeSubscriptionsCount,
    dueThisWeekCount,
    topSubscriptionName: topSubName,
    topSubscriptionCost: topSubCostStr,
    topSubscriptionBillingCycle: topSubBillingCycle,
  }
}
