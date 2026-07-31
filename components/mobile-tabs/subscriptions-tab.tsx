"use client"

import { useHomeData } from "@/contexts/home-data-context"
import { SubscriptionList } from "@/components/subscription-list"
import { AddSubscriptionButton } from "@/components/add-subscription-button"

export function SubscriptionsTab() {
  const { subscriptions } = useHomeData()

  return (
    <div className="flex flex-col">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-xl font-heading font-semibold leading-tight md:text-2xl lg:text-3xl">
            My Subscriptions
          </h1>
          <p className="text-xs font-normal leading-normal text-muted-foreground md:text-xs lg:text-sm">
            {subscriptions.length === 0
              ? "No active subscriptions"
              : `${subscriptions.length} subscription${subscriptions.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <AddSubscriptionButton size="sm" variant="outline" />
      </div>

      {/* List */}
      <div className="p-4">
        <SubscriptionList subscriptions={subscriptions} />
      </div>
    </div>
  )
}
