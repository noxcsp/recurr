"use client"

import { motion } from "motion/react"
import { Bell } from "lucide-react"
import { NotificationSettings } from "@/components/notification-settings"
import { useHomeData } from "@/contexts/home-data-context"

export function NotificationsTab() {
  const { user, profile } = useHomeData()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex flex-col gap-4 p-4 md:p-6 overflow-y-auto pb-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h1 className="text-xl font-heading font-semibold leading-tight md:text-2xl lg:text-3xl flex items-center gap-2">
          <Bell className="size-5 md:size-6 text-foreground" aria-hidden="true" />
          Notification Settings
        </h1>
      </div>

      {/* Push & Alerts Component */}
      <NotificationSettings user={user} profile={profile} />
    </motion.div>
  )
}
