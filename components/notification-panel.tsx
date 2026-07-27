"use client"

import { useState } from "react"
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Clock,
  Inbox,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useNotifications } from "@/hooks/useNotifications"
import type { Notification } from "@/types/notifications"

// ── Types ───────────────────────────────────────────────────────────────────

interface NotificationPanelProps {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  actionInProgress: string | null
  markAsRead: (id: string) => void
  markAllAsRead: () => void
}

export function NotificationPanel({
  notifications,
  unreadCount,
  loading,
  actionInProgress,
  markAsRead,
  markAllAsRead,
}: NotificationPanelProps) {
  return (
    <div className="flex w-full flex-col bg-background text-foreground">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-base font-heading font-semibold leading-tight md:text-lg lg:text-xl">
          Notifications
        </h2>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            disabled={actionInProgress === "all"}
            className="h-8 px-2 text-xs font-medium leading-none text-muted-foreground hover:bg-muted hover:text-foreground md:text-xs lg:text-sm rounded-none"
          >
            <CheckCheck className="mr-1.5 size-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Feed */}
      <div className="max-h-[min(420px,calc(100dvh-120px))] min-h-40 overflow-y-auto">
        {loading ? (
          <NotificationSkeletons />
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((item) => (
              <NotificationItem
                key={item.id}
                notification={item}
                isProcessing={actionInProgress === item.id}
                onTap={() => {
                  if (!item.is_read) markAsRead(item.id)
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ── Skeleton loading state ──────────────────────────────────────────────────

function NotificationSkeletons() {
  return (
    <ul className="divide-y divide-border">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="flex items-start gap-3 px-4 py-3.5">
          <Skeleton className="mt-0.5 size-4 shrink-0" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </li>
      ))}
    </ul>
  )
}

// ── Empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex h-44 flex-col items-center justify-center gap-2.5 p-6 text-center">
      <Inbox className="size-7 stroke-[1.25] text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-medium leading-normal text-foreground md:text-base lg:text-base">
        No notifications yet
      </p>
      <p className="text-xs font-normal leading-relaxed text-muted-foreground md:text-xs lg:text-sm">
        Renewal alerts and overdue reminders will appear here.
      </p>
    </div>
  )
}

// ── Notification row ────────────────────────────────────────────────────────

interface NotificationItemProps {
  notification: Notification
  isProcessing: boolean
  onTap: () => void
}

function NotificationItem({ notification, isProcessing, onTap }: NotificationItemProps) {
  const isUnread = !notification.is_read
  const isOverdue =
    notification.title.includes("overdue") || notification.title.includes("🚨")
  const isDueTomorrow =
    notification.title.includes("due tomorrow") || notification.title.includes("⏰")

  return (
    <li>
      <button
        type="button"
        onClick={onTap}
        disabled={isProcessing || !isUnread}
        className={cn(
          "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors duration-150",
          isUnread
            ? "bg-muted/50 hover:bg-muted cursor-pointer"
            : "bg-background cursor-default"
        )}
      >
        {/* Status icon */}
        <span className="mt-0.5 shrink-0">
          {isOverdue ? (
            <AlertTriangle className="size-4 text-destructive" aria-hidden="true" />
          ) : isDueTomorrow ? (
            <Clock className="size-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          ) : (
            <Bell className="size-4 text-muted-foreground" aria-hidden="true" />
          )}
        </span>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p
              className={cn(
                "truncate text-xs leading-snug md:text-sm lg:text-base",
                isUnread ? "font-semibold text-foreground" : "font-normal text-foreground/70"
              )}
            >
              {notification.title}
            </p>
            <span className="shrink-0 text-[10px] leading-none text-muted-foreground md:text-xs lg:text-xs">
              {formatTimestamp(notification.created_at)}
            </span>
          </div>
          <p className="mt-0.5 text-xs font-normal leading-relaxed text-muted-foreground md:text-xs lg:text-sm">
            {notification.body}
          </p>
        </div>

        {/* Unread dot */}
        {isUnread && (
          <span
            className="mt-1.5 size-2 shrink-0 border border-primary bg-primary"
            aria-label="Unread"
          />
        )}
      </button>
    </li>
  )
}

// ── Notification Popover ─────────────────────────────────────────────────────

export function NotificationPopover() {
  const [open, setOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    loading,
    actionInProgress,
    markAsRead,
    markAllAsRead,
  } = useNotifications()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label="Open notifications"
            className="relative h-9 w-9 border border-border bg-background hover:bg-muted rounded-none shadow-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        }
      >
        <Bell className="size-4 text-foreground stroke-[1.5]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center border border-primary bg-background px-1 text-[10px] font-bold leading-none text-primary rounded-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-80 p-0 shadow-none border border-border rounded-none bg-background md:w-96"
      >
        <NotificationPanel
          notifications={notifications}
          unreadCount={unreadCount}
          loading={loading}
          actionInProgress={actionInProgress}
          markAsRead={markAsRead}
          markAllAsRead={markAllAsRead}
        />
      </PopoverContent>
    </Popover>
  )
}

// ── Timestamp Formatter ─────────────────────────────────────────────────────

function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  } catch {
    return ""
  }
}
