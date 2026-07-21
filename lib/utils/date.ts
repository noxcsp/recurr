/**
 * Utility functions for handling UTC calendar dates across forms and components.
 * Subscriptions in Recurr store dates as UTC midnight (YYYY-MM-DDT00:00:00.000Z).
 */

/**
 * Converts a UTC string, ISO string, UTC Date object, or local Date object
 * into a local Date at 00:00:00 for the corresponding calendar day.
 * This ensures form inputs (like DatePicker) display the intended calendar date
 * regardless of the browser's local timezone offset.
 */
export function parseUtcToLocalDate(
  dateInput: Date | string | undefined | null
): Date | undefined {
  if (!dateInput) return undefined

  if (typeof dateInput === "string") {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return undefined
    // For string dates (e.g. "2026-07-25" or "2026-07-25T00:00:00.000Z"), extract UTC components
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  }

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return undefined
    // If constructed via Date.UTC (UTC midnight), extract UTC date parts
    if (
      dateInput.getUTCHours() === 0 &&
      dateInput.getUTCMinutes() === 0 &&
      dateInput.getUTCSeconds() === 0 &&
      dateInput.getUTCMilliseconds() === 0
    ) {
      return new Date(
        dateInput.getUTCFullYear(),
        dateInput.getUTCMonth(),
        dateInput.getUTCDate()
      )
    }
    // Otherwise it's a local date, extract local date parts
    return new Date(
      dateInput.getFullYear(),
      dateInput.getMonth(),
      dateInput.getDate()
    )
  }

  return undefined
}

/**
 * Converts a local Date object into a UTC Date object set to 00:00:00 UTC.
 * When .toISOString() is called on the resulting Date, it outputs "YYYY-MM-DDT00:00:00.000Z".
 */
export function toUtcDate(date: Date | undefined | null): Date | undefined {
  if (!date || isNaN(date.getTime())) return undefined

  // If already at UTC midnight, return as-is
  if (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  ) {
    return date
  }

  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  )
}
