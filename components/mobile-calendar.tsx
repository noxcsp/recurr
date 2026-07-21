"use client"

import React, { useCallback, useMemo, useState } from "react"
import moment from "moment"
import {
  type Formats,
  momentLocalizer,
  type ToolbarProps,
  Views,
  type DateCellWrapperProps,
} from "react-big-calendar"
import ShadcnBigCalendar from "@/components/shadcn-big-calendar/shadcn-big-calendar"
import { Subscription } from "@/types/subscriptions"
import { AddSubscriptionForm } from "@/components/add-subscription-form"
import { EditSubscriptionForm } from "@/components/edit-subscription-form"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const localizer = momentLocalizer(moment)

// ── Types ──────────────────────────────────────────────────────────────────────

type SubscriptionEvent = {
  title: string
  start: Date
  end: Date
  allDay: boolean
  subscription: Subscription
}

interface MobileCalendarProps {
  subscriptions: Subscription[]
}

// Map plan_type to accent bar + dot colors
const planTypeAccent: Record<Subscription["plan_type"], string> = {
  Weekly: "bg-secondary-foreground",
  Monthly: "bg-primary",
  Annual: "bg-muted-foreground",
}

// ── Responsive formats (mobile-only — single letter weekday headers) ─────────

const mobileFormats: Formats = {
  monthHeaderFormat: "MMMM YYYY",
  weekdayFormat: (date: Date, culture?: string, loc?: { format: (d: Date, f: string, c?: string) => string }) => {
    return (loc?.format(date, "dd", culture) ?? moment(date).format("dd")).charAt(0).toUpperCase()
  },
}

// ── Toolbar ────────────────────────────────────────────────────────────────────

function MobileCalendarToolbar({
  date,
  onNavigate,
}: ToolbarProps<SubscriptionEvent>) {
  const isToday = useMemo(() => {
    const today = new Date()
    return (
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }, [date])

  const year = date.getFullYear()
  const monthName = moment(date).format("MMMM")

  return (
    <div className="rbc-toolbar border-b border-border bg-background px-4 py-3">
      {/* Left: year overline + month heading */}
      <div className="flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-wide leading-none text-muted-foreground">
          {year}
        </span>
        <h1 className="rbc-toolbar-label text-xl font-semibold leading-tight text-foreground md:text-2xl">
          {monthName}
        </h1>
      </div>

      {/* Right: today + prev/next nav */}
      <div className="rbc-btn-group inline-flex items-center gap-1 border border-border bg-muted p-1">
        <button
          type="button"
          onClick={() => onNavigate("TODAY")}
          className={cn(
            "h-7 px-2.5 text-xs font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            isToday
              ? "bg-foreground text-background font-semibold"
              : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
          )}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => onNavigate("PREV")}
          aria-label="Previous month"
          className="flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <ChevronLeft className="size-4" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={() => onNavigate("NEXT")}
          aria-label="Next month"
          className="flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <ChevronRight className="size-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

/** Compare two dates by year-month-day only */
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Build a lookup: "YYYY-MM-DD" → unique plan_types present on that day */
function buildDotMap(events: SubscriptionEvent[]): Map<string, Set<Subscription["plan_type"]>> {
  const map = new Map<string, Set<Subscription["plan_type"]>>()
  for (const ev of events) {
    const key = `${ev.start.getFullYear()}-${String(ev.start.getMonth() + 1).padStart(2, "0")}-${String(ev.start.getDate()).padStart(2, "0")}`
    if (!map.has(key)) map.set(key, new Set())
    map.get(key)!.add(ev.subscription.plan_type)
  }
  return map
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function MobileCalendar({ subscriptions }: MobileCalendarProps) {
  const [date, setDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Edit form state
  const [editSubscription, setEditSubscription] = useState<Subscription | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  // Add form state
  const [addOpen, setAddOpen] = useState(false)
  const [addDefaultDate, setAddDefaultDate] = useState<Date | undefined>(undefined)

  // Derive events
  const events = useMemo(() => {
    return subscriptions.map((sub) => {
      const dueDate = new Date(sub.next_due_date)
      dueDate.setHours(0, 0, 0, 0)
      return {
        title: `${sub.service_name} — ₱${sub.cost.toLocaleString()}`,
        start: dueDate,
        end: dueDate,
        allDay: true,
        subscription: sub,
      }
    })
  }, [subscriptions])

  // Build dot map for indicators
  const dotMap = useMemo(() => buildDotMap(events), [events])

  // Events for the selected date
  const selectedDayEvents = useMemo(() => {
    return events.filter((ev) => isSameDay(ev.start, selectedDate))
  }, [events, selectedDate])

  // Navigation handler — also select the first day of the new month (or today if navigating to current month)
  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate)
    const today = new Date()
    if (newDate.getMonth() === today.getMonth() && newDate.getFullYear() === today.getFullYear()) {
      setSelectedDate(today)
    } else {
      // Select 1st of new month
      setSelectedDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1))
    }
  }, [])

  // Cell click → select that date
  const handleSelectSlot = useCallback((slotInfo: { start: Date }) => {
    const d = new Date(slotInfo.start)
    d.setHours(0, 0, 0, 0)
    setSelectedDate(d)
  }, [])

  // Event list item click → open edit form
  const handleEventClick = useCallback((sub: Subscription) => {
    setEditSubscription(sub)
    setEditOpen(true)
  }, [])

  // Add button for empty state
  const handleAddOnDate = useCallback(() => {
    const nextStart = new Date(selectedDate)
    nextStart.setHours(0, 0, 0, 0)
    setAddDefaultDate(nextStart)
    setAddOpen(true)
  }, [selectedDate])

  // Form close handlers
  const handleEditOpenChange = useCallback((open: boolean) => {
    setEditOpen(open)
    if (!open) setEditSubscription(null)
  }, [])

  const handleAddOpenChange = useCallback((open: boolean) => {
    setAddOpen(open)
    if (!open) setAddDefaultDate(undefined)
  }, [])

  // Custom DateCellWrapper — renders dots + selection highlight
  const DateCellWrapper = useCallback(
    ({ children, value }: DateCellWrapperProps) => {
      const isSelected = isSameDay(value, selectedDate)
      const isCurrentDay = isSameDay(value, new Date())
      const key = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`
      const dots = dotMap.get(key)

      // Check if this date is in the displayed month
      const isOffRange = value.getMonth() !== date.getMonth()

      return (
        <div
          className={cn(
            "mobile-date-cell",
            isOffRange && "mobile-date-cell--off-range"
          )}
          onClick={() => {
            const d = new Date(value)
            d.setHours(0, 0, 0, 0)
            setSelectedDate(d)
          }}
          role="button"
          tabIndex={0}
          aria-label={`Select ${moment(value).format("MMMM D, YYYY")}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              const d = new Date(value)
              d.setHours(0, 0, 0, 0)
              setSelectedDate(d)
            }
          }}
        >
          {/* Background from react-big-calendar (today stripe, etc.) */}
          {children}

          {/* Date number + dots overlay */}
          <div className="mobile-date-cell__content">
            <span
              className={cn(
                "mobile-date-cell__number",
                isSelected && "mobile-date-cell__number--selected",
                isCurrentDay && !isSelected && "mobile-date-cell__number--today"
              )}
            >
              {value.getDate()}
            </span>

            {/* Dot indicators */}
            {dots && dots.size > 0 && (
              <div className="mobile-date-cell__dots">
                {Array.from(dots).map((planType) => (
                  <span
                    key={planType}
                    className={cn("mobile-date-cell__dot", planTypeAccent[planType])}
                    aria-hidden="true"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )
    },
    [selectedDate, dotMap, date]
  )

  return (
    <div className="mobile-calendar flex h-full flex-col">
      {/* Month grid — compact, fills top portion */}
      <div className="mobile-calendar__grid shrink-0">
        <ShadcnBigCalendar
          localizer={localizer}
          events={events}
          selectable
          date={date}
          onNavigate={handleNavigate}
          view={Views.MONTH}
          views={[Views.MONTH]}
          onSelectSlot={handleSelectSlot}
          formats={mobileFormats}
          components={{
            toolbar: MobileCalendarToolbar as React.ComponentType<ToolbarProps<SubscriptionEvent>>,
            dateCellWrapper: DateCellWrapper,
          }}
        />
      </div>

      {/* Selected day events — scrollable list below */}
      <div className="mobile-calendar__events min-h-0 flex-1 overflow-y-auto border-t border-border">
        {/* Day header */}
        <div className="sticky top-0 z-10 border-b border-border bg-background px-4 py-2">
          <h2 className="text-sm font-medium leading-relaxed text-foreground md:text-base">
            {moment(selectedDate).format("dddd, MMMM D")}
          </h2>
        </div>

        {selectedDayEvents.length === 0 ? (
          <button
            type="button"
            onClick={handleAddOnDate}
            className="flex w-full flex-col items-center justify-center gap-2 px-4 py-8 text-center transition-colors hover:bg-muted/50"
          >
            <p className="text-xs font-normal leading-normal text-muted-foreground md:text-xs lg:text-sm">
              No subscriptions due
            </p>
            <span className="text-xs font-medium leading-none text-primary md:text-xs lg:text-sm">
              + Add subscription
            </span>
          </button>
        ) : (
          <ul className="divide-y divide-border">
            {selectedDayEvents.map((ev) => {
              const sub = ev.subscription
              const accent = planTypeAccent[sub.plan_type]
              return (
                <li key={sub.id}>
                  <button
                    type="button"
                    onClick={() => handleEventClick(sub)}
                    className="flex w-full items-stretch text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {/* Color accent bar */}
                    <div
                      className={cn("w-1 shrink-0", accent)}
                      aria-hidden="true"
                    />

                    {/* Event details */}
                    <div className="flex flex-1 items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium leading-relaxed text-foreground md:text-base">
                          {sub.service_name}
                        </span>
                        <span className="text-xs font-normal leading-normal text-muted-foreground">
                          {sub.plan_type} · {sub.payment_mode}
                        </span>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground md:text-base">
                        ₱{sub.cost.toLocaleString()}
                      </span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Add form */}
      <AddSubscriptionForm
        defaultDate={addDefaultDate}
        externalOpen={addOpen}
        onExternalOpenChange={handleAddOpenChange}
      />

      {/* Edit form */}
      {editSubscription && (
        <EditSubscriptionForm
          subscription={editSubscription}
          open={editOpen}
          onOpenChange={handleEditOpenChange}
        />
      )}
    </div>
  )
}
