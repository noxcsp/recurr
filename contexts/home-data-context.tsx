"use client"

import { createContext, useContext } from "react"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/types/profiles"
import type { Subscription } from "@/types/subscriptions"
import type { DashboardAnalytics } from "@/types/analytics"

export interface HomeDataContextValue {
  user: User
  profile: Profile | null
  subscriptions: Subscription[]
  analytics?: DashboardAnalytics
}

const HomeDataContext = createContext<HomeDataContextValue | null>(null)

export interface HomeDataProviderProps {
  user: User
  profile: Profile | null
  subscriptions: Subscription[]
  analytics?: DashboardAnalytics
  children: React.ReactNode
}

export function HomeDataProvider({
  user,
  profile,
  subscriptions,
  analytics,
  children,
}: HomeDataProviderProps) {
  return (
    <HomeDataContext.Provider
      value={{
        user,
        profile,
        subscriptions,
        analytics,
      }}
    >
      {children}
    </HomeDataContext.Provider>
  )
}

export function useHomeData(): HomeDataContextValue {
  const context = useContext(HomeDataContext)
  if (!context) {
    throw new Error("useHomeData must be used within a HomeDataProvider")
  }
  return context
}
