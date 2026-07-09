import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Profile } from "@/types/profiles"
import { Subscription } from "@/types/subscriptions"
import { AddSubscriptionForm } from "@/components/add-subscription-form"
import { SubscriptionList } from "@/components/subscription-list"

import { signout } from "@/app/auth/actions"

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
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-lg space-y-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Welcome!</CardTitle>
            <CardDescription>
              You have successfully logged in. Here are your account and profile
              details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Account Details
              </h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="font-semibold text-muted-foreground">
                  User ID:
                </div>
                <div className="col-span-2 truncate font-mono" title={user.id}>
                  {user.id}
                </div>

                <div className="font-semibold text-muted-foreground">
                  Email:
                </div>
                <div className="col-span-2 truncate" title={user.email}>
                  {user.email}
                </div>

                <div className="font-semibold text-muted-foreground">
                  Last Sign In:
                </div>
                <div className="col-span-2">
                  {user.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString()
                    : "N/A"}
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Profile Details
              </h3>
              {profile ? (
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="font-semibold text-muted-foreground">
                    Timezone:
                  </div>
                  <div className="col-span-2">{profile.timezone}</div>

                  <div className="font-semibold text-muted-foreground">
                    FCM Token:
                  </div>
                  <div
                    className="col-span-2 truncate font-mono text-xs"
                    title={profile.fcm_token || "Not set"}
                  >
                    {profile.fcm_token || "Not set"}
                  </div>

                  <div className="font-semibold text-muted-foreground">
                    Updated At:
                  </div>
                  <div className="col-span-2">
                    {profile.updated_at
                      ? new Date(profile.updated_at).toLocaleString()
                      : "N/A"}
                  </div>
                </div>
              ) : (
                <div className="border border-destructive p-3 text-xs font-medium text-destructive">
                  Profile not found in database.
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <form action={signout} className="w-full">
              <Button variant="outline" className="w-full" type="submit">
                Sign out
              </Button>
            </form>
          </CardFooter>
        </Card>
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold">My Subscriptions</CardTitle>
              <CardDescription>
                {subscriptions.length === 0
                  ? "No active subscriptions"
                  : `${subscriptions.length} subscription${subscriptions.length !== 1 ? "s" : ""}`}
              </CardDescription>
            </div>
            <AddSubscriptionForm />
          </CardHeader>
          <CardContent className="p-0 pb-1">
            <SubscriptionList subscriptions={subscriptions} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
