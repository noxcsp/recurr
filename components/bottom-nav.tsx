"use client"

import { useState, cloneElement, ReactElement } from "react"
import { LayoutDashboard, CalendarDays, List, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { AddFAB } from "@/components/add-fab"
import { NotificationPopover } from "@/components/notification-panel"
import { DashboardTab } from "@/components/mobile-tabs/dashboard-tab"
import { CalendarTab } from "@/components/mobile-tabs/calendar-tab"
import { SubscriptionsTab } from "@/components/mobile-tabs/subscriptions-tab"
import { SettingsTab } from "@/components/mobile-tabs/settings-tab"

// Nav height in px — shared with AddFAB so the button clears the bar exactly
export const NAV_HEIGHT_PX = 56

type Tab = "dashboard" | "calendar" | "subscriptions" | "settings"

export function BottomNav() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")

  return (
    <div className="flex h-mobile-screen flex-col lg:hidden">
      {/* Mobile top app bar — subtle bg-card surface separation */}
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top,0px))]">
        <span className="font-heading text-lg font-bold tracking-tight text-foreground">
          RECURR
        </span>
        <NotificationPopover />
      </header>

      {/* Tab content — fills all space above navbar */}
      <main className="min-h-0 flex-1 overflow-y-auto">
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "calendar" && <CalendarTab />}
        {activeTab === "subscriptions" && <SubscriptionsTab />}
        {activeTab === "settings" && <SettingsTab />}
      </main>

      {/* Floating Add Button — above the nav, bottom-right */}
      {activeTab === "dashboard" || activeTab === "subscriptions" ? <AddFAB bottomOffset={NAV_HEIGHT_PX} /> : null}

      {/* Bottom navbar — subtle bg-card surface, grid distribution without vertical line clutter */}
      <nav
        className="relative z-20 shrink-0 border-t border-border bg-card pb-[env(safe-area-inset-bottom,0px)]"
        style={{ height: `calc(${NAV_HEIGHT_PX}px + env(safe-area-inset-bottom, 0px))` }}
      >
        <div className="grid h-full grid-cols-4">
          <NavTab
            id="nav-dashboard"
            label="Dashboard"
            icon={<LayoutDashboard className="size-5" />}
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          />
          <NavTab
            id="nav-calendar"
            label="Calendar"
            icon={<CalendarDays className="size-5" />}
            active={activeTab === "calendar"}
            onClick={() => setActiveTab("calendar")}
          />
          <NavTab
            id="nav-subscriptions"
            label="Subscriptions"
            icon={<List className="size-5" />}
            active={activeTab === "subscriptions"}
            onClick={() => setActiveTab("subscriptions")}
          />
          <NavTab
            id="nav-settings"
            label="Settings"
            icon={<Settings className="size-5" />}
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
          />
        </div>
      </nav>
    </div>
  )
}

// ── Nav tab button ────────────────────────────────────────────────────────────

interface NavTabProps {
  id: string
  label: string
  icon: ReactElement<{ strokeWidth?: number; className?: string }>
  active: boolean
  onClick: () => void
}

function NavTab({ id, label, icon, active, onClick }: NavTabProps) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={cn(
        // Layout — fills grid column cell cleanly
        "group relative flex h-full flex-col items-center justify-center gap-1.5",
        // Typography — overline eyebrow styling
        "text-[9px] uppercase tracking-[0.12em] leading-none",
        // Micro-interactions & state feedback
        "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:bg-muted/40",
        active
          ? "text-foreground font-bold"
          : "text-muted-foreground font-medium hover:bg-muted/20 hover:text-foreground"
      )}
    >
      {/* Icon with weight & scale emphasis on active state */}
      <span className={cn("transition-transform duration-150 ease-out", active && "scale-110")}>
        {cloneElement(icon, {
          strokeWidth: active ? 2.25 : 1.5,
          className: cn(
            "size-5 transition-colors duration-150",
            active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
          )
        })}
      </span>
      <span className={cn("transition-colors duration-150", active ? "text-foreground font-bold" : "text-muted-foreground group-hover:text-foreground")}>
        {label}
      </span>
    </button>
  )
}

