"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LayoutDashboard, CalendarDays, List, Settings, LogOut, Loader2, Trash2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileCalendar } from "@/components/mobile-calendar"
import { SubscriptionList } from "@/components/subscription-list"
import { AddFAB } from "@/components/add-fab"
import { AddSubscriptionButton } from "@/components/add-subscription-button"
import { Button } from "@/components/ui/button"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { deleteAccount, signout } from "@/app/auth/actions"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/types/profiles"
import type { Subscription } from "@/types/subscriptions"
import type { DashboardAnalytics } from "@/types/analytics"
import { NotificationSettings } from "@/components/notification-settings"
import { NotificationPopover } from "@/components/notification-panel"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DashboardMetrics } from "@/components/dashboard-metrics"
import { OverdueSubscriptions } from "@/components/overdue-subscriptions"

// Nav height in px — shared with AddFAB so the button clears the bar exactly
export const NAV_HEIGHT_PX = 72

type Tab = "dashboard" | "calendar" | "subscriptions" | "settings"

interface BottomNavProps {
  user: User
  profile: Profile | null
  subscriptions: Subscription[]
  analytics?: DashboardAnalytics
}

export function BottomNav({ user, profile, subscriptions, analytics }: BottomNavProps) {
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
        {activeTab === "dashboard" && (
          <DashboardPanel user={user} profile={profile} analytics={analytics} subscriptions={subscriptions} />
        )}
        {activeTab === "calendar" && (
          <MobileCalendar subscriptions={subscriptions} />
        )}
        {activeTab === "subscriptions" && (
          <SubscriptionsPanel subscriptions={subscriptions} />
        )}
        {activeTab === "settings" && <SettingsPanel user={user} profile={profile} />}
      </main>

      {/* Floating Add Button — above the nav, bottom-right */}
      {activeTab === "dashboard" ? <AddFAB bottomOffset={NAV_HEIGHT_PX} /> : null}

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

// ── Tab panels ────────────────────────────────────────────────────────────────

interface DashboardPanelProps {
  user: User
  profile: Profile | null
  analytics?: DashboardAnalytics
  subscriptions: Subscription[]
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

function DashboardPanel({ user, profile, analytics, subscriptions }: DashboardPanelProps) {
  const greeting = getTimeBasedGreeting()
  const displayName = profile?.display_name || user.user_metadata?.display_name || user.user_metadata?.full_name || user.user_metadata?.name

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 overflow-y-auto pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-heading font-semibold leading-tight md:text-2xl lg:text-3xl">
          {displayName ? `${greeting}, ${displayName}!` : `${greeting}!`}
        </h1>
      </div>
      <DashboardMetrics
        monthlySpend={analytics?.monthlySpend}
        spendTrend={analytics?.spendTrend}
        trendPercentage={analytics?.trendPercentage}
        trendLabel={analytics?.trendLabel}
        activeSubscriptionsCount={analytics?.activeSubscriptionsCount}
        dueThisWeekCount={analytics?.dueThisWeekCount}
        topSubscriptionName={analytics?.topSubscriptionName}
        topSubscriptionCost={analytics?.topSubscriptionCost}
        topSubscriptionBillingCycle={analytics?.topSubscriptionBillingCycle}
      />
      <OverdueSubscriptions subscriptions={subscriptions} />
    </div>
  )
}

function SubscriptionsPanel({ subscriptions }: { subscriptions: Subscription[] }) {
  return (
    <div className="flex flex-col">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h1 className="text-xl font-heading font-semibold leading-tight md:text-2xl lg:text-3xl">
            My Subscriptions
          </h1>
          <p className="text-xs font-normal leading-normal text-muted-foreground md:text-xs lg:text-sm">
            {subscriptions.length === 0
              ? "No active subscriptions"
              : `${subscriptions.length} subscription${subscriptions.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <AddSubscriptionButton size="sm" variant="outline" />
      </div>

      {/* List */}
      <SubscriptionList subscriptions={subscriptions} />
    </div>
  )
}

function SettingsPanel({ user, profile }: { user: User; profile: Profile | null }) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { clearFcmToken } = usePushNotifications()

  const handleSignOut = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSigningOut(true)
    try {
      await clearFcmToken()
    } catch (error) {
      console.error("Failed to clear FCM token on sign out:", error)
    }
    await signout()
  }

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true)
    setDeleteError(null)
    try {
      await clearFcmToken()
    } catch (error) {
      console.error("Failed to clear FCM token before deletion:", error)
    }
    const result = await deleteAccount()
    if (result?.error) {
      setDeleteError(result.error)
      setIsDeletingAccount(false)
    } else if (result?.success) {
      router.push('/success')
    }
  }

  return (
    <div className="flex flex-col">
      {/* Panel header */}
      <div className="border-b border-border px-4 py-3">
        <h1 className="text-xl font-heading font-semibold leading-tight md:text-2xl lg:text-3xl">
          Settings
        </h1>
      </div>

      {/* Account section */}
      <div className="border-b border-border px-4 py-4">
        <h2 className="mb-3 text-xs font-heading font-semibold uppercase tracking-wide leading-none text-muted-foreground md:text-xs lg:text-sm">
          Account
        </h2>
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm font-normal leading-relaxed md:text-base lg:text-base">
          <span className="font-medium text-muted-foreground">Email</span>
          <span className="truncate">{user.email}</span>
          <span className="font-medium text-muted-foreground">Last sign in</span>
          <span>
            {user.last_sign_in_at
              ? new Date(user.last_sign_in_at).toLocaleString()
              : "N/A"}
          </span>
        </div>
      </div>

      {/* Granular Notification Settings */}
      <NotificationSettings user={user} profile={profile} />

      {/* Danger Zone */}
      <div className="border-b border-border px-4 py-4">
        <h2 className="mb-1 text-xs font-heading font-semibold uppercase tracking-wide leading-none text-destructive md:text-xs lg:text-sm">
          Danger Zone
        </h2>
        <p className="mb-3 text-xs font-normal leading-normal text-muted-foreground md:text-xs lg:text-sm">
          Irreversible and destructive account actions.
        </p>

        {deleteError && (
          <div className="mb-3 border border-destructive p-3 text-xs font-medium text-destructive">
            {deleteError}
          </div>
        )}

        <AlertDialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (isDeletingAccount) return
            setIsDialogOpen(open)
          }}
        >
          <AlertDialogTrigger
            render={
              <Button
                variant="destructive"
                disabled={isSigningOut || isDeletingAccount}
                className="w-full text-sm font-medium leading-none md:text-sm lg:text-base"
              />
            }
          >
            <Trash2 className="mr-2 size-4" aria-hidden="true" />
            Delete Account
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="size-5" aria-hidden="true" />
                Delete Account
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action is non-recoverable. All of your subscription records, notification feeds, and account data will be permanently wiped.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingAccount}>
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                    Deleting...
                  </>
                ) : (
                  "Delete My Account"
                )}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Sign out */}
      <div className="border-b border-border px-4 py-4">
        <form onSubmit={handleSignOut}>
          <Button
            variant="outline"
            type="submit"
            disabled={isSigningOut || isDeletingAccount}
            className="w-full text-sm font-medium leading-none md:text-sm lg:text-base"
          >
            {isSigningOut ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="mr-2 size-4" aria-hidden="true" />
                Sign out
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}


