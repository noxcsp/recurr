"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { User, Bell, LogOut, Loader2, ChevronRight } from "lucide-react"
import { NotificationPopover } from "@/components/notification-panel"
import { Button } from "@/components/ui/button"
import { ThemeSettings } from "@/components/theme-settings"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { signout } from "@/app/auth/actions"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { useHomeData } from "@/contexts/home-data-context"
import type { Tab } from "@/components/bottom-nav"

export const TOP_NAV_HEIGHT_PX = 52

interface TopNavProps {
  onSelectTab?: (tab: Tab) => void
}

export function TopNav({ onSelectTab }: TopNavProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const { clearFcmToken } = usePushNotifications()

  // Safely retrieve user profile from context if available
  let userEmail = ""
  let displayName = ""
  try {
    const homeData = useHomeData()
    userEmail = homeData.user?.email || ""
    displayName =
      homeData.profile?.display_name ||
      homeData.user?.user_metadata?.display_name ||
      homeData.user?.user_metadata?.full_name ||
      homeData.user?.user_metadata?.name ||
      userEmail.split("@")[0] ||
      "User"
  } catch {
    // Fallback if rendered outside context
  }

  const avatarInitial = displayName.charAt(0).toUpperCase() || "U"

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

      <div className="flex items-center gap-2">
        <NotificationPopover />

        {/* Personal Tactile User Avatar Pill Trigger & Settings Sheet */}
        <Sheet
          open={sheetOpen}
          onOpenChange={(nextOpen) => {
            if (!nextOpen && isSigningOut) return
            setSheetOpen(nextOpen)
          }}
        >
          <SheetTrigger
            render={
              <motion.button
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                type="button"
                aria-label="Open profile & settings menu"
                className="relative flex size-8 shrink-0 items-center justify-center border border-border bg-foreground text-background font-heading font-bold text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
              />
            }
          >
            <span>{avatarInitial}</span>
            <span
              className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border border-background bg-emerald-500"
              aria-hidden="true"
            />
          </SheetTrigger>

          <SheetContent
            side="right"
            showCloseButton={!isSigningOut}
            className="flex flex-col w-4/5 sm:max-w-xs p-0 bg-card border-l border-border"
          >
            <SheetHeader className="border-b border-border px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]">
              <SheetTitle className="font-heading text-lg font-bold">Settings</SheetTitle>
            </SheetHeader>

            <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
              {/* Profile Card Header */}
              {userEmail && (
                <div className="flex items-center gap-3 border-b border-border bg-muted/20 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center border border-border bg-foreground text-background font-heading font-bold text-sm">
                    {avatarInitial}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {displayName}
                    </span>
                    <span className="truncate text-xs font-mono text-muted-foreground">
                      {userEmail}
                    </span>
                  </div>
                </div>
              )}

              {/* Staggered Navigation Buttons */}
              <div className="flex flex-col border-b border-border p-2 space-y-1">
                {/* Account Button */}
                <motion.button
                  whileTap={isSigningOut ? undefined : { scale: 0.98 }}
                  disabled={isSigningOut}
                  onClick={() => {
                    if (isSigningOut) return
                    setSheetOpen(false)
                    onSelectTab?.("account")
                  }}
                  className="flex items-center justify-between w-full p-3 text-left border border-transparent hover:border-border hover:bg-muted/40 transition-colors group disabled:pointer-events-none disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <User className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden="true" />
                    <span className="text-sm font-medium text-foreground">Account</span>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                </motion.button>

                {/* Notifications Button */}
                <motion.button
                  whileTap={isSigningOut ? undefined : { scale: 0.98 }}
                  disabled={isSigningOut}
                  onClick={() => {
                    if (isSigningOut) return
                    setSheetOpen(false)
                    onSelectTab?.("notifications")
                  }}
                  className="flex items-center justify-between w-full p-3 text-left border border-transparent hover:border-border hover:bg-muted/40 transition-colors group disabled:pointer-events-none disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden="true" />
                    <span className="text-sm font-medium text-foreground">Notifications</span>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                </motion.button>
              </div>

              {/* Theme Settings Switch */}
              <ThemeSettings disabled={isSigningOut} />

              <div className="mt-auto border-t border-border px-4 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]">
                <form onSubmit={handleSignOut}>
                  <Button
                    variant="outline"
                    type="submit"
                    disabled={isSigningOut}
                    className="w-full text-sm font-medium"
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
          </SheetContent>
        </Sheet>
      </div>
    </motion.header>
  )
}
