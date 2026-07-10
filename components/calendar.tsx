"use client"

import { ComponentType, useCallback, useMemo, useOptimistic, useState, useTransition } from "react"
import moment from "moment"
import { type CalendarProps, momentLocalizer, type SlotInfo, Views, type ToolbarProps } from "react-big-calendar"
import type { EventInteractionArgs } from "react-big-calendar/lib/addons/dragAndDrop"
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop"
import ShadcnBigCalendar from "@/components/shadcn-big-calendar/shadcn-big-calendar"
import { Subscription } from "@/types/subscriptions"
import { AddSubscriptionForm } from "@/components/add-subscription-form"
import { EditSubscriptionForm } from "@/components/edit-subscription-form"
import { updateSubscription } from "@/app/home/actions"
import { toast } from "sonner"

const DnDCalendar = withDragAndDrop<SubscriptionEvent>(
  ShadcnBigCalendar as ComponentType<CalendarProps<SubscriptionEvent>>
)

const localizer = momentLocalizer(moment)

// Types
type SubscriptionEvent = {
  title: string
  start: Date
  end: Date
  allDay: boolean
  subscription: Subscription
}

interface SubscriptionCalendarProps {
  subscriptions: Subscription[]
}

// Map plan_type to calendar event CSS class variants
const planTypeVariant: Record<Subscription["plan_type"], string> = {
  Weekly: "event-variant-secondary",
  Monthly: "event-variant-primary",
  Annual: "event-variant-outline",
}

// Custom Toolbar component that only shows month/year and navigation controls,
// with a highlighted 'Today' toggle when calendar is set to the current date.
function CustomToolbar({ date, label, onNavigate }: ToolbarProps<SubscriptionEvent>) {
  const isToday = useMemo(() => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }, [date])

  return (
    <div className="rbc-toolbar">
      <span className="rbc-btn-group">
        <button
          type="button"
          onClick={() => onNavigate("TODAY")}
          className={isToday ? "rbc-active" : ""}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => onNavigate("PREV")}
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => onNavigate("NEXT")}
        >
          Next
        </button>
      </span>

      <span className="rbc-toolbar-label">{label}</span>
    </div>
  )
}

export function SubscriptionCalendar({
  subscriptions,
}: SubscriptionCalendarProps) {
  // Controlled date state (mirrors app/calendar/page.tsx)
  const [date, setDate] = useState(new Date())

  // Add form state — controlled by calendar slot click
  const [addOpen, setAddOpen] = useState(false)
  const [addDefaultDate, setAddDefaultDate] = useState<Date | undefined>(undefined)

  // Edit form state — controlled by calendar event click
  const [editSubscription, setEditSubscription] = useState<Subscription | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const [, startTransition] = useTransition()

  // Derive calendar events from subscriptions prop
  const baseEvents = useMemo(() => {
    return subscriptions.map((sub) => {
      const dueDate = new Date(sub.next_due_date)
      dueDate.setHours(0, 0, 0, 0)
      return {
        title: `${sub.service_name} — ₱${sub.cost.toLocaleString()}`,
        start: dueDate,
        end: dueDate, // Always start = end to prevent date range spanning
        allDay: true,
        subscription: sub,
      }
    })
  }, [subscriptions])

  // Manage optimistic updates during event dragging
  const [optimisticEvents, setOptimisticEvent] = useOptimistic(
    baseEvents,
    (state, update: { id: string; nextStart: Date }) =>
      state.map((e) =>
        e.subscription.id === update.id
          ? { ...e, start: update.nextStart, end: update.nextStart }
          : e
      )
  )

  // Navigation handler (mirrors app/calendar/page.tsx)
  const handleNavigate = (newDate: Date) => setDate(newDate)

  // Slot click → open Add form with date pre-filled
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    const nextStart = new Date(slotInfo.start)
    nextStart.setHours(0, 0, 0, 0)

    // Convert local date to UTC midnight to prevent timezone shift when serialized on the server
    const utcDate = new Date(
      Date.UTC(nextStart.getFullYear(), nextStart.getMonth(), nextStart.getDate())
    )

    setAddDefaultDate(utcDate)
    setAddOpen(true)
  }, [])

  // Event click → open Edit form
  const handleSelectEvent = useCallback((event: SubscriptionEvent) => {
    setEditSubscription(event.subscription)
    setEditOpen(true)
  }, [])

  // Color events by plan_type
  const eventPropGetter: CalendarProps<SubscriptionEvent>["eventPropGetter"] =
    useCallback((event: SubscriptionEvent) => {
      return {
        className: planTypeVariant[event.subscription.plan_type],
      }
    }, [])

  // DnD: drop → reschedule subscription
  const handleEventDrop = useCallback(
    ({ event, start }: EventInteractionArgs<SubscriptionEvent>) => {
      const nextStart = new Date(start)
      nextStart.setHours(0, 0, 0, 0)

      const sub = event.subscription

      // Convert local date to UTC midnight to prevent timezone shift when serialized on the server
      const utcDate = new Date(
        Date.UTC(nextStart.getFullYear(), nextStart.getMonth(), nextStart.getDate())
      )

      startTransition(async () => {
        // Optimistically update local state to move event to exactly 1 date
        setOptimisticEvent({ id: sub.id, nextStart })

        const result = await updateSubscription(sub.id, {
          service_name: sub.service_name,
          cost: sub.cost,
          plan_type: sub.plan_type,
          payment_mode: sub.payment_mode,
          next_due_date: utcDate,
          is_trial: sub.is_trial,
          trial_end_date: sub.trial_end_date
            ? new Date(sub.trial_end_date)
            : undefined,
          subscription_status: sub.subscription_status,
        })
        if (result?.error) {
          toast.error("Failed to reschedule", {
            position: "top-right",
            description: result.error,
          })
        } else {
          toast.success(`${sub.service_name} rescheduled`, {
            position: "top-right",
            description: `Due date moved to ${nextStart.toLocaleDateString()}`,
          })
        }
      })
    },
    [setOptimisticEvent]
  )

  // Form close handlers
  const handleEditOpenChange = useCallback((open: boolean) => {
    setEditOpen(open)
    if (!open) setEditSubscription(null)
  }, [])

  const handleAddOpenChange = useCallback((open: boolean) => {
    setAddOpen(open)
    if (!open) setAddDefaultDate(undefined)
  }, [])

  return (
    <div className="flex h-full flex-col">
      <DnDCalendar
        localizer={localizer}
        events={optimisticEvents}
        style={{ flex: 1, minHeight: 0 }}
        selectable
        resizable={false} // Disable resizing entirely
        draggableAccessor={() => true}
        resizableAccessor={() => false} // Disable resizing entirely
        date={date}
        onNavigate={handleNavigate}
        view={Views.MONTH}
        views={[Views.MONTH]}
        eventPropGetter={eventPropGetter}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        onEventDrop={handleEventDrop}
        components={{
          toolbar: CustomToolbar,
        }}
      />

      {/* Add form — controlled by calendar slot click */}
      <AddSubscriptionForm
        defaultDate={addDefaultDate}
        externalOpen={addOpen}
        onExternalOpenChange={handleAddOpenChange}
      />

      {/* Edit form — controlled by calendar event click */}
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
