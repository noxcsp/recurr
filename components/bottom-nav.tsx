"use client"

import { cloneElement, ReactElement } from "react"
import { LayoutDashboard, CalendarDays, List } from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { MobileLayout } from "@/components/mobile-layout"

// Nav height in px — shared with AddFAB and loading skeleton so element clears the bar exactly
export const NAV_HEIGHT_PX = 56

export type Tab = "dashboard" | "calendar" | "subscriptions" | "account" | "notifications"

export interface BottomNavbarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export function BottomNavbar({ activeTab, onTabChange }: BottomNavbarProps) {
  const tabs: { id: "dashboard" | "calendar" | "subscriptions"; label: string; icon: ReactElement<{ strokeWidth?: number; className?: string }> }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="size-5" />,
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: <CalendarDays className="size-5" />,
    },
    {
      id: "subscriptions",
      label: "Subscriptions",
      icon: <List className="size-5" />,
    },
  ]

  return (
    <nav
      className="relative z-20 shrink-0 border-t border-border bg-card pb-[env(safe-area-inset-bottom,0px)]"
      style={{ height: `calc(${NAV_HEIGHT_PX}px + env(safe-area-inset-bottom, 0px))` }}
    >
      <div role="tablist" aria-label="Main Navigation" className="grid h-full grid-cols-3 relative">
        {tabs.map((tab) => (
          <NavTab
            key={tab.id}
            id={`nav-${tab.id}`}
            label={tab.label}
            icon={tab.icon}
            active={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          />
        ))}
      </div>
    </nav>
  )
}

interface NavTabProps {
  id: string
  label: string
  icon: ReactElement<{ strokeWidth?: number; className?: string }>
  active: boolean
  onClick: () => void
}

function NavTab({ id, label, icon, active, onClick }: NavTabProps) {
  return (
    <motion.button
      id={id}
      type="button"
      role="tab"
      aria-selected={active}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={cn(
        "group relative flex h-full flex-col items-center justify-center gap-1 z-10",
        "text-[9px] uppercase tracking-[0.12em] leading-none",
        "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        active
          ? "text-foreground font-bold"
          : "text-muted-foreground font-medium hover:text-foreground"
      )}
    >
      {/* Active tab sliding background highlight pill */}
      {active && (
        <motion.div
          layoutId="bottom-nav-active-pill"
          className="absolute inset-x-2 inset-y-1.5 rounded-sm bg-muted/60"
          transition={{ type: "spring", stiffness: 450, damping: 32 }}
        />
      )}

      {/* Icon with animated spring scale & weight emphasis */}
      <motion.span
        animate={{ scale: active ? 1.1 : 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="relative z-10"
      >
        {cloneElement(icon, {
          strokeWidth: active ? 2.25 : 1.5,
          className: cn(
            "size-5 transition-colors duration-150",
            active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
          ),
        })}
      </motion.span>

      {/* Label */}
      <span
        className={cn(
          "relative z-10 transition-colors duration-150",
          active ? "text-foreground font-bold" : "text-muted-foreground group-hover:text-foreground"
        )}
      >
        {label}
      </span>
    </motion.button>
  )
}

/**
 * Mobile layout wrapper component, maintained as default BottomNav export
 * for seamless backwards compatibility.
 */
export function BottomNav() {
  return <MobileLayout />
}
