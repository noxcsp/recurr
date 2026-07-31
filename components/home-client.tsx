"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DailySwipeoff } from "@/components/daily-swipeoff"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import type { Subscription } from "@/types/subscriptions"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/types/profiles"
import type { DashboardAnalytics } from "@/types/analytics"
import { HomeDataProvider } from "@/contexts/home-data-context"

interface HomeClientProps {
  todayDateStr: string
  lastSwipeoffDate: string | null
  user: User
  profile: Profile | null
  subscriptions: Subscription[]
  analytics?: DashboardAnalytics
  children: React.ReactNode
}

/**
 * Client-side wrapper that gates the Daily Swipe-off overlay
 * and provides HomeDataContext to all child components.
 *
 * Shows the swipe-off when:
 *   1. There are subscriptions due today (matched by next_due_date)
 *   2. The swipe-off has NOT been shown today (lastSwipeoffDate !== todayDateStr)
 *
 * After the swipe-off completes, triggers a full server-side refetch
 * via router.refresh() before rendering the home UI.
 */
export function HomeClient({
  todayDateStr,
  lastSwipeoffDate,
  user,
  profile,
  subscriptions,
  analytics,
  children,
}: HomeClientProps) {
  const router = useRouter()
  const { requestAndSaveToken } = usePushNotifications()

  useEffect(() => {
    const initNotifications = async () => {
      const updated = await requestAndSaveToken()
      if (updated) {
        router.refresh()
      }
    }
    initNotifications()
  }, [requestAndSaveToken, router])

  // Filter subscriptions due today by comparing the date portion of next_due_date
  const todaySubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      // next_due_date is stored as a UTC ISO string. Extract the date part.
      const dueDateStr = sub.next_due_date.split("T")[0]
      return dueDateStr === todayDateStr
    })
  }, [subscriptions, todayDateStr])

  // Determine if the swipe-off should show
  const shouldShowSwipeoff =
    todaySubscriptions.length > 0 && lastSwipeoffDate !== todayDateStr

  const [showSwipeoff, setShowSwipeoff] = useState(shouldShowSwipeoff)

  const handleSwipeoffComplete = useCallback(() => {
    // Trigger a full server-side data refetch
    router.refresh()
    setShowSwipeoff(false)
  }, [router])

  // While swipe-off is active, only render the overlay (not the home content)
  if (showSwipeoff) {
    return (
      <DailySwipeoff
        subscriptions={todaySubscriptions}
        onComplete={handleSwipeoffComplete}
      />
    )
  }

  // Swipe-off done or not needed — render the home content wrapped in HomeDataProvider
  return (
    <HomeDataProvider
      user={user}
      profile={profile}
      subscriptions={subscriptions}
      analytics={analytics}
    >
      {children}
    </HomeDataProvider>
  )
}

