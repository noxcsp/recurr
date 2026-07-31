"use client"

import { useHomeData } from "@/contexts/home-data-context"
import { MobileCalendar } from "@/components/mobile-calendar"

export function CalendarTab() {
  const { subscriptions } = useHomeData()
  return <MobileCalendar subscriptions={subscriptions} />
}
