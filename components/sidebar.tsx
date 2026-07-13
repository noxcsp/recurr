"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Profile } from "@/types/profiles"
import { Subscription } from "@/types/subscriptions"
import { AddSubscriptionForm } from "@/components/add-subscription-form"
import { SubscriptionList } from "@/components/subscription-list"
import { signout } from "@/app/auth/actions"
import { LogOut } from "lucide-react"
import type { User } from "@supabase/supabase-js"

interface SidebarProps {
  user: User
  profile: Profile | null
  subscriptions: Subscription[]
}

export function Sidebar({ user, profile, subscriptions }: SidebarProps) {
  return (
    <aside className="flex h-screen w-1/5 flex-col border-r bg-card">
      {/* Header — account & profile details */}
      <div className="shrink-0 border-b p-6">
        <CardHeader className="p-0">
          <CardTitle className="text-2xl font-bold">Welcome!</CardTitle>
          <CardDescription>
            You have successfully logged in. Here are your account and profile
            details.
          </CardDescription>
        </CardHeader>

        <div className="mt-4 space-y-4">
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
        </div>
      </div>

      {/* Subscriptions list */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold">My Subscriptions</h2>
            <p className="text-sm text-muted-foreground">
              {subscriptions.length === 0
                ? "No active subscriptions"
                : `${subscriptions.length} subscription${subscriptions.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <AddSubscriptionForm />
        </div>

        <div className="flex-1 overflow-y-auto">
          <SubscriptionList subscriptions={subscriptions} />
        </div>
      </div>

      {/* Sign out button */}
      <div className="shrink-0 border-t p-4">
        <form action={signout} className="w-full">
          <Button variant="outline" className="w-full" type="submit">
            <LogOut className="mr-2 size-4" />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  )
}
