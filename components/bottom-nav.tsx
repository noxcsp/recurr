"use client"

import { useState } from "react"
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
    <div className="flex h-dvh flex-col lg:hidden">
      {/* Mobile top app bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-background px-4 pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top,0px))]">
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

      {/* Bottom navbar — 4 equal tabs with vertical separators */}
      <nav
        className="relative z-20 shrink-0 border-t border-border bg-background pb-[env(safe-area-inset-bottom,0px)]"
        style={{ height: `calc(${NAV_HEIGHT_PX}px + env(safe-area-inset-bottom, 0px))` }}
      >
        <div className="grid h-full grid-cols-4">
          <NavTab
            id="nav-dashboard"
            label="Dashboard"
            icon={<LayoutDashboard strokeWidth={1.25} className="size-6" />}
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          />
          <NavTab
            id="nav-calendar"
            label="Calendar"
            icon={<CalendarDays strokeWidth={1.25} className="size-6" />}
            active={activeTab === "calendar"}
            onClick={() => setActiveTab("calendar")}
          />
          <NavTab
            id="nav-subscriptions"
            label="Subs"
            icon={<List strokeWidth={1.25} className="size-6" />}
            active={activeTab === "subscriptions"}
            onClick={() => setActiveTab("subscriptions")}
          />
          <NavTab
            id="nav-settings"
            label="Settings"
            icon={<Settings strokeWidth={1.25} className="size-6" />}
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
            isLast
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
  icon: React.ReactNode
  active: boolean
  onClick: () => void
  isLast?: boolean
}

function NavTab({ id, label, icon, active, onClick, isLast = false }: NavTabProps) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={cn(
        // Layout — fills the full block
        "flex h-full flex-col items-center justify-center gap-1.5",
        // Vertical separator on the right (except last tab)
        !isLast && "border-r border-border",
        // Typography — overline/eyebrow treatment to match reference
        "text-[9px] font-semibold uppercase tracking-[0.12em] leading-none",
        // State
        "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        active
          ? // Active: full block fill — foreground bg, inverted text
            "bg-foreground text-background"
          : // Inactive: transparent, muted text; subtle hover
            "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
