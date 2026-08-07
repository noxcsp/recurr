"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { TopNav } from "@/components/top-nav"
import { BottomNavbar, NAV_HEIGHT_PX, type Tab } from "@/components/bottom-nav"
import { AddFAB } from "@/components/add-fab"
import { DashboardTab } from "@/components/mobile-tabs/dashboard-tab"
import { CalendarTab } from "@/components/mobile-tabs/calendar-tab"
import { SubscriptionsTab } from "@/components/mobile-tabs/subscriptions-tab"
import { SettingsTab } from "@/components/mobile-tabs/settings-tab"

interface MobileLayoutProps {
  initialTab?: Tab
}

export function MobileLayout({ initialTab = "dashboard" }: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)

  return (
    <div className="flex h-mobile-screen flex-col lg:hidden">
      {/* Extracted Top App Bar */}
      <TopNav />

      {/* Main Tab Content Container with Spring Motion Page Transitions */}
      <main className="relative min-h-0 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            id={`tabpanel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`nav-${activeTab}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="h-full w-full"
          >
            {activeTab === "dashboard" && <DashboardTab />}
            {activeTab === "calendar" && <CalendarTab />}
            {activeTab === "subscriptions" && <SubscriptionsTab />}
            {activeTab === "settings" && <SettingsTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Action Button for Adding Subscriptions */}
      {(activeTab === "dashboard" || activeTab === "subscriptions") && (
        <AddFAB bottomOffset={NAV_HEIGHT_PX} />
      )}

      {/* Extracted Motion Bottom Navbar */}
      <BottomNavbar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
