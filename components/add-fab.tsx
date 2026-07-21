"use client"

import { useState, useCallback } from "react"
import { Plus } from "lucide-react"
import { AddSubscriptionForm } from "@/components/add-subscription-form"

interface AddFABProps {
  /** Extra bottom offset in px, e.g. the height of the bottom nav */
  bottomOffset?: number
}

/**
 * Floating Action Button — sits above the bottom nav (bottom-right).
 * Manages the AddSubscriptionForm dialog via controlled open state.
 * Renders a borderline-brutalist square button with a hard-offset press effect.
 */
export function AddFAB({ bottomOffset = 72 }: AddFABProps) {
  const [open, setOpen] = useState(false)

  const handleOpenChange = useCallback((v: boolean) => setOpen(v), [])

  return (
    <>
      <button
        type="button"
        aria-label="Add subscription"
        onClick={() => setOpen(true)}
        style={{ bottom: `calc(${bottomOffset + 16}px + env(safe-area-inset-bottom, 0px))` }}
        className={[
          // Position
          "fixed right-4 z-30",
          // Sizing & shape — rounded-none per design system
          "flex size-14 cursor-pointer items-center justify-center",
          // Monoline aesthetic: white bg + 1px border + hard offset shadow
          "border border-foreground bg-background text-foreground",
          // Hard geometric shadow (brutalist, no blur) — using box-shadow via arbitrary Tailwind
          "shadow-[4px_4px_0px_0px] shadow-foreground",
          // Press effect — shift + invert on active
          "transition-[transform,box-shadow,background-color,color] duration-75",
          "active:translate-x-1 active:translate-y-1 active:bg-foreground active:text-background active:shadow-none",
          // Focus ring
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        ].join(" ")}
      >
        <Plus strokeWidth={1.25} className="size-6" aria-hidden="true" />
      </button>

      <AddSubscriptionForm externalOpen={open} onExternalOpenChange={handleOpenChange} />
    </>
  )
}
