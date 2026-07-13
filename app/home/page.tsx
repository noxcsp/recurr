import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Profile } from "@/types/profiles"
import { Subscription } from "@/types/subscriptions"
import { Sidebar } from "@/components/sidebar"
import { SubscriptionCalendar } from "@/components/calendar"

export default async function HomePage() {
  const supabase = await createClient()

  const { data: userData, error } = await supabase.auth.getUser()

  if (error || !userData?.user) {
    redirect("/")
  }

  const user = userData.user

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const profile = profileData as Profile | null

  const { data: subscriptionsData } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const subscriptions = (subscriptionsData ?? []) as Subscription[]

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} profile={profile} subscriptions={subscriptions} />
      <main className="flex-1 overflow-hidden p-4">
        <SubscriptionCalendar subscriptions={subscriptions} />
      </main>
    </div>
  )
}
