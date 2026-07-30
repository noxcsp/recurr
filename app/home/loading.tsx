import { DashboardMetricsSkeleton } from "@/components/dashboard-metrics"
import { OverdueSubscriptionsSkeleton } from "@/components/overdue-subscriptions"
import { Skeleton } from "@/components/ui/skeleton"

export default function HomeLoading() {
  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Mobile layout skeleton (hidden on lg and above) */}
      <div className="flex flex-col gap-4 p-4 md:p-6 overflow-y-auto pb-8 lg:hidden">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48 md:h-8 lg:h-9" />
        </div>
        <DashboardMetricsSkeleton />
        <OverdueSubscriptionsSkeleton />
      </div>

      {/* Desktop layout skeleton (hidden below lg) */}
      <div className="hidden h-screen overflow-hidden bg-background lg:flex">
        {/* Sidebar skeleton */}
        <aside className="w-64 border-r border-border bg-card p-4 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8" />
            <Skeleton className="h-6 w-28" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </aside>

        {/* Main calendar area skeleton */}
        <main className="flex-1 overflow-hidden p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <Skeleton className="h-8 w-44" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
          <div className="grid flex-1 grid-cols-7 gap-px bg-border p-px">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="bg-background p-2">
                <Skeleton className="h-4 w-6 mb-2" />
                {i % 4 === 0 && <Skeleton className="h-5 w-full mt-1" />}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
