"use client"

import { motion } from "motion/react"
import { NotificationPopover } from "@/components/notification-panel"

export const TOP_NAV_HEIGHT_PX = 52

export function TopNav() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top,0px))]"
    >
      <span className="font-heading text-lg font-bold tracking-tight text-foreground">
        RECURR
      </span>
      <NotificationPopover />
    </motion.header>
  )
}
