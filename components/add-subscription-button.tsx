"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddSubscriptionForm } from "@/components/add-subscription-form"
import { type VariantProps } from "class-variance-authority"
import { buttonVariants } from "@/components/ui/button"

interface AddSubscriptionButtonProps {
  /** Optional default date to pre-fill in the form (e.g. selected calendar date) */
  defaultDate?: Date
  /** Button visual style variant */
  variant?: VariantProps<typeof buttonVariants>["variant"]
  /** Button size variant */
  size?: VariantProps<typeof buttonVariants>["size"]
  /** Additional custom CSS classes */
  className?: string
  /** Custom button label or icon override */
  children?: React.ReactNode
}

/**
 * Reusable inline button component to open the AddSubscriptionForm dialog.
 */
export function AddSubscriptionButton({
  defaultDate,
  variant = "outline",
  size = "sm",
  className,
  children,
}: AddSubscriptionButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        {children ?? (
          <>
            <Plus className="size-3.5" aria-hidden="true" />
            <span>Add</span>
          </>
        )}
      </Button>
      <AddSubscriptionForm
        defaultDate={defaultDate}
        externalOpen={open}
        onExternalOpenChange={setOpen}
      />
    </>
  )
}
