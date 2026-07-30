import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Profile } from "@/types/profiles"
import { Subscription } from "@/types/subscriptions"
import { PaymentRecord } from "@/types/analytics"
import { calculateDashboardAnalytics } from "@/lib/analytics"
import { Sidebar } from "@/components/sidebar"
import { SubscriptionCalendar } from "@/components/calendar"
import { BottomNav } from "@/components/bottom-nav"
import { HomeClient } from "@/components/home-client"

export default async function HomePage() {
  const supabase = await createClient()

  const { data: userData, error } = await supabase.auth.getUser()

  if (error || !userData?.user) {
    redirect("/")
  }

  const user = userData.user

  // Optimize query window for payment records: only fetch payments from previous year onwards
  // to calculate current month, previous month, and current year analytics without scanning millions of historical rows.
  const currentYear = new Date().getFullYear()
  const paymentWindowStartDate = `${currentYear - 1}-01-01T00:00:00.000Z`

  const [{ data: profileData }, { data: subscriptionsData }, { data: paymentsData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single(),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscription_payments")
      .select("id, subscription_id, user_id, amount, payment_date, created_at")
      .eq("user_id", user.id)
      .gte("payment_date", paymentWindowStartDate)
      .order("payment_date", { ascending: false }),
  ])

  const profile = profileData as Profile | null
  const subscriptions = (subscriptionsData ?? []) as Subscription[]
  const payments = (paymentsData ?? []) as PaymentRecord[]
  const analytics = calculateDashboardAnalytics(subscriptions, payments)

  // Compute today's date string (YYYY-MM-DD) server-side for consistent comparison
  const todayDateStr = new Date().toISOString().split("T")[0]

  return (
    <HomeClient
      todayDateStr={todayDateStr}
      lastSwipeoffDate={profile?.last_swipeoff_date ?? null}
      subscriptions={subscriptions}
    >
      {/* Mobile layout — bottom navbar (hidden on lg and above) */}
      <BottomNav
        user={user}
        profile={profile}
        subscriptions={subscriptions}
        analytics={analytics}
      />

      {/* Desktop layout — sidebar + calendar (hidden below lg) */}
      <div className="hidden h-screen overflow-hidden bg-background lg:flex">
        <Sidebar user={user} profile={profile} subscriptions={subscriptions} />
        <main className="flex-1 overflow-hidden p-4">
          <SubscriptionCalendar subscriptions={subscriptions} />
        </main>
      </div>
    </HomeClient>
  )
}
