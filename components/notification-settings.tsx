"use client"

import { useEffect, useState, useRef } from "react"
import { Bell, BellOff, AlertCircle, ShieldAlert, CalendarDays } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useNotificationStore } from "@/lib/store/useNotificationStore"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types/profiles"
import type { User } from "@supabase/supabase-js"

interface NotificationSettingsProps {
  user?: User | null
  profile?: Profile | null
  className?: string
}

const ADVANCE_REMINDER_OPTIONS = [
  { label: "Off", value: 0 },
  { label: "3 Days Before", value: 3 },
  { label: "7 Days Before", value: 7 },
] as const

const DEBOUNCE_DELAY_MS = 500

export function NotificationSettings({ user, profile, className }: NotificationSettingsProps) {
  const supabase = createClient()
  const [isProcessing, setIsProcessing] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)

  // Rate-limiting debounce timer ref for DB calls
  const advanceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const {
    pushEnabled,
    notifyAdvanceDays,
    permissionState,
    setPushEnabled,
    setNotifyAdvanceDays,
    syncWithBrowser,
    syncWithProfile,
  } = useNotificationStore()

  const { requestAndSaveToken, disableNotifications } = usePushNotifications()

  // Clean up debounce timer on component unmount
  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current)
    }
  }, [])

  // Initial sync with profile & active browser permission check
  useEffect(() => {
    if (profile) {
      syncWithProfile(profile)
    }
    const currentPermission = syncWithBrowser()

    // Self-healing: if permission is granted but no cached local storage token exists, heal token silently
    if (currentPermission === "granted" && user?.id) {
      const cacheKey = `fcm_token_${user.id}`
      const cachedToken = typeof window !== "undefined" ? localStorage.getItem(cacheKey) : null
      if (!cachedToken) {
        requestAndSaveToken().catch((err) => {
          console.warn("Silent token self-healing failed:", err)
        })
      }
    }
  }, [profile, user?.id, syncWithBrowser, syncWithProfile, requestAndSaveToken])

  // Optimistic Master Push Toggle Handler
  const handleTogglePush = async (checked: boolean) => {
    const currentPerm = syncWithBrowser()

    if (checked && currentPerm === "denied") {
      toast.error("Notification permission is blocked by your browser settings.", {
        position: "top-right",
      })
      return
    }

    // Save previous state for rollback on failure
    const previousState = pushEnabled

    // 1. Optimistic UI update: instantly update UI switch
    setPushEnabled(checked)
    setIsProcessing(true)
    setDbError(null)

    try {
      if (checked) {
        const success = await requestAndSaveToken()
        if (!success) {
          // Revert optimistic change if permission or token generation failed
          setPushEnabled(false)
          toast.error("Failed to enable push notifications. Check browser permissions.", {
            position: "top-right",
          })
        }
      } else {
        const success = await disableNotifications()
        if (!success) {
          // Revert optimistic change if deletion failed
          setPushEnabled(true)
          toast.error("Failed to disable push notifications. Please try again.", {
            position: "top-right",
          })
        }
      }
    } catch (error) {
      console.error("Error updating push notification setting:", error)
      // Rollback optimistic state
      setPushEnabled(previousState)
      toast.error("An error occurred while updating push notifications.", {
        position: "top-right",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Rate-limited handler for notify_advance_days (Debounced DB access)
  const handleAdvanceDaysChange = (values: string[]) => {
    const val = values[0]
    if (!val) return
    const days = parseInt(val, 10)
    if (isNaN(days)) return

    // 1. Instant local UI update
    setNotifyAdvanceDays(days)

    // 2. Debounce DB update to rate limit queries
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current)
    }

    advanceTimeoutRef.current = setTimeout(async () => {
      if (!user?.id) return
      const { error } = await supabase
        .from("profiles")
        .update({ notify_advance_days: days })
        .eq("id", user.id)

      if (error) {
        console.error("Failed to update advance notification days in DB:", error)
        toast.error("Failed to save advance reminder setting.", {
          position: "top-right",
        })
        setDbError("Failed to save advance reminder setting to server.")
      }
    }, DEBOUNCE_DELAY_MS)
  }

  const isPermissionDenied = permissionState === "denied"

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-1">
        <h2 className="text-xs font-heading font-semibold uppercase tracking-wide leading-none text-muted-foreground md:text-xs lg:text-sm">
          Push & Alerts
        </h2>
        <p className="text-xs font-normal leading-normal text-muted-foreground md:text-xs lg:text-sm">
          Manage hardware device permissions and advance reminder schedules.
        </p>
      </div>

      {dbError && (
        <Alert variant="destructive" className="rounded-none border border-destructive">
          <AlertCircle className="size-4 text-destructive" />
          <AlertTitle className="text-xs font-semibold md:text-sm">Database Error</AlertTitle>
          <AlertDescription className="text-xs md:text-xs">{dbError}</AlertDescription>
        </Alert>
      )}

      {/* Hardware Permission Denied Banner */}
      {isPermissionDenied && (
        <Alert variant="destructive" className="rounded-none border border-destructive bg-card">
          <ShieldAlert className="size-4 text-destructive" />
          <AlertTitle className="text-xs font-semibold text-destructive md:text-sm">
            Notifications Blocked by Browser
          </AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground md:text-xs">
            Push permissions are blocked at the browser or system level. To enable push alerts, click the lock or settings icon in your browser address bar and set Notifications to <strong className="text-foreground">Allow</strong>.
          </AlertDescription>
        </Alert>
      )}

      {/* Master Push Toggle Card */}
      <Card className="rounded-none border border-border bg-card shadow-none">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {pushEnabled && !isPermissionDenied ? (
                <Bell className="size-4 text-foreground" />
              ) : (
                <BellOff className="size-4 text-muted-foreground" />
              )}
              <CardTitle className="text-sm font-heading font-medium md:text-base lg:text-base">
                Push Notifications
              </CardTitle>
            </div>
            <Switch
              id="master-push-switch"
              checked={pushEnabled && !isPermissionDenied}
              onCheckedChange={handleTogglePush}
              disabled={isProcessing || isPermissionDenied}
              aria-label="Toggle Push Notifications"
            />
          </div>
          <CardDescription className="text-xs text-muted-foreground md:text-xs lg:text-sm mt-1">
            {isPermissionDenied
              ? "Push notifications are currently blocked by browser hardware permissions."
              : pushEnabled
                ? "Active. Device is registered to receive subscription alerts."
                : "Disabled. Turn on to receive push alerts before renewals."}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Advance Reminders Selection */}
      <Card className="rounded-none border border-border bg-card shadow-none">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center gap-2.5">
            <CalendarDays className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm font-heading font-medium md:text-base lg:text-base">
              Advance Reminders
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground md:text-xs lg:text-sm">
            Choose when to receive renewal notifications prior to the payment due date.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <ToggleGroup
            value={[String(notifyAdvanceDays)]}
            onValueChange={handleAdvanceDaysChange}
            spacing={0}
            className="w-full grid grid-cols-3 border border-border"
          >
            {ADVANCE_REMINDER_OPTIONS.map((opt) => (
              <ToggleGroupItem
                key={opt.value}
                value={String(opt.value)}
                variant="outline"
                className="w-full rounded-none border-y-0 border-r border-border last:border-r-0 py-2 text-xs md:text-xs lg:text-sm font-medium data-[state=on]:bg-foreground data-[state=on]:text-background"
              >
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardContent>
      </Card>
    </div>
  )
}
