import { DashboardMetricsSkeleton } from "@/components/dashboard-metrics"
import { ActionRequiredListSkeleton } from "@/components/action-required-list"
import { Skeleton } from "@/components/ui/skeleton"
import { NAV_HEIGHT_PX } from "@/components/bottom-nav"

export default function HomeLoading() {
  return (
    <div className="flex h-mobile-screen flex-col bg-background">
      {/* Mobile layout skeleton (hidden on lg and above) */}
      <div className="flex h-mobile-screen flex-col lg:hidden">
        {/* Mobile top app bar header skeleton */}
        <header className="flex shrink-0 items-center justify-between border-b border-border bg-background px-4 pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top,0px))]">
          <Skeleton className="h-6 w-24 rounded-none" />
          <Skeleton className="size-8 rounded-none" />
        </header>

        {/* Main content area skeleton */}
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          <DashboardMetricsSkeleton />
          <ActionRequiredListSkeleton />
        </main>

        {/* Bottom navbar skeleton */}
        <nav
          className="relative z-20 shrink-0 border-t border-border bg-background pb-[env(safe-area-inset-bottom,0px)]"
          style={{ height: `calc(${NAV_HEIGHT_PX}px + env(safe-area-inset-bottom, 0px))` }}
        >
          <div className="grid h-full grid-cols-4">
            <div className="flex flex-col items-center justify-center gap-1 border-r border-border p-2">
              <Skeleton className="size-6 rounded-none" />
              <Skeleton className="h-3 w-12 rounded-none" />
            </div>
            <div className="flex flex-col items-center justify-center gap-1 border-r border-border p-2">
              <Skeleton className="size-6 rounded-none" />
              <Skeleton className="h-3 w-12 rounded-none" />
            </div>
            <div className="flex flex-col items-center justify-center gap-1 border-r border-border p-2">
              <Skeleton className="size-6 rounded-none" />
              <Skeleton className="h-3 w-10 rounded-none" />
            </div>
            <div className="flex flex-col items-center justify-center gap-1 p-2">
              <Skeleton className="size-6 rounded-none" />
              <Skeleton className="h-3 w-12 rounded-none" />
            </div>
          </div>
        </nav>
      </div>

      {/* Desktop layout skeleton (hidden below lg) */}
      <div className="hidden h-screen overflow-hidden bg-background lg:flex">
        {/* Sidebar skeleton */}
        <aside className="w-64 border-r border-border bg-card p-4 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-none" />
            <Skeleton className="h-6 w-28 rounded-none" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-9 w-full rounded-none" />
            <Skeleton className="h-9 w-full rounded-none" />
            <Skeleton className="h-9 w-full rounded-none" />
            <Skeleton className="h-9 w-full rounded-none" />
          </div>
        </aside>

        {/* Main calendar area skeleton */}
        <main className="flex-1 overflow-hidden p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <Skeleton className="h-8 w-44 rounded-none" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16 rounded-none" />
              <Skeleton className="h-8 w-8 rounded-none" />
              <Skeleton className="h-8 w-8 rounded-none" />
            </div>
          </div>
          <div className="grid flex-1 grid-cols-7 gap-px bg-border p-px">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="bg-background p-2">
                <Skeleton className="h-4 w-6 mb-2 rounded-none" />
                {i % 4 === 0 && <Skeleton className="h-5 w-full mt-1 rounded-none" />}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
