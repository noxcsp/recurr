import { Badge } from "@/components/ui/badge"
import { Subscription } from "@/types/subscriptions"
import { CalendarDays, CreditCard, FlaskConical } from "lucide-react"
import { cn } from "@/lib/utils"

const planTypeStyles: Record<
  Subscription["plan_type"],
  { badge: string; bar: string }
> = {
  Weekly: {
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    bar: "bg-amber-400 dark:bg-amber-500",
  },
  Monthly: {
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    bar: "bg-blue-400 dark:bg-blue-500",
  },
  Annual: {
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    bar: "bg-emerald-400 dark:bg-emerald-500",
  },
}

interface SubscriptionListProps {
  subscriptions: Subscription[]
}

export function SubscriptionList({ subscriptions }: SubscriptionListProps) {
  if (subscriptions.length === 0) {
    return (
      <div className="border border-dashed p-6 text-center text-sm text-muted-foreground">
        No subscriptions yet. Add one to get started.
      </div>
    )
  }

  return (
    <ul className="flex flex-col divide-y border">
      {subscriptions.map((sub) => {
        const styles = planTypeStyles[sub.plan_type]
        return (
          <li key={sub.id} className="flex items-stretch">
            {/* Colored left accent bar */}
            <div className={cn("w-1 shrink-0", styles.bar)} aria-hidden="true" />

            <div className="flex flex-1 items-start justify-between gap-3 px-4 py-3">
              {/* Left: name + meta */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">
                    {sub.service_name}
                  </span>
                  {sub.is_trial && (
                    <span
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                      title="Free trial"
                    >
                      <FlaskConical className="size-3" />
                      Trial
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CreditCard className="size-3" />
                    {sub.payment_mode}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3" />
                    Due&nbsp;
                    {new Date(sub.next_due_date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Right: cost + badge */}
              <div className="flex flex-col items-end gap-2">
                <span className="text-sm font-semibold tabular-nums">
                  ₱{sub.cost.toLocaleString()}
                </span>
                <Badge
                  className={cn(
                    "rounded-none border-transparent",
                    styles.badge
                  )}
                >
                  {sub.plan_type}
                </Badge>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
