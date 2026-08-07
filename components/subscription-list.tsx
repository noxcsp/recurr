"use client"

import { Subscription } from "@/types/subscriptions"
import { parseUtcToLocalDate } from "@/lib/utils/date"
import { SubscriptionCard } from "@/components/subscription-card"
import { cn } from "@/lib/utils"

interface SubscriptionListProps {
  subscriptions: Subscription[]
  emptyMessage?: string
  disabled?: boolean
}

export function SubscriptionList({ subscriptions, emptyMessage, disabled = false }: SubscriptionListProps) {
  if (subscriptions.length === 0) {
    return (
      <div className={cn("border border-dashed border-border p-6 text-center text-xs text-muted-foreground md:text-sm lg:text-sm", disabled && "pointer-events-none opacity-60")}>
        {emptyMessage || "No subscriptions yet. Add one to get started."}
      </div>
    )
  }

  const sortedSubscriptions = [...subscriptions].sort((a, b) => {
    const dateStrA = a.is_trial && a.trial_end_date ? a.trial_end_date : a.next_due_date
    const dateStrB = b.is_trial && b.trial_end_date ? b.trial_end_date : b.next_due_date
    const timeA = dateStrA ? (parseUtcToLocalDate(dateStrA)?.getTime() ?? Infinity) : Infinity
    const timeB = dateStrB ? (parseUtcToLocalDate(dateStrB)?.getTime() ?? Infinity) : Infinity
    return timeA - timeB
  })

  return (
    <ul className={cn("flex flex-col gap-3", disabled && "pointer-events-none opacity-60")}>
      {sortedSubscriptions.map((sub) => (
        <SubscriptionCard key={sub.id} sub={sub} />
      ))}
    </ul>
  )
}
