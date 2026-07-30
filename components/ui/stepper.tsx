"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface StepItem {
  id: number
  title: string
  description?: string
}

interface StepperProps {
  steps: StepItem[]
  currentStep: number
  onStepClick?: (step: number) => void
  className?: string
}

export function Stepper({ steps, currentStep, onStepClick, className }: StepperProps) {
  return (
    <nav aria-label="Progress" className={cn("w-full py-2", className)}>
      <ol role="list" className="flex items-center justify-between w-full gap-1 sm:gap-2">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep
          const isCurrent = step.id === currentStep
          const isClickable = onStepClick && step.id < currentStep

          return (
            <li key={step.id} className="relative flex-1 flex flex-col items-center group">
              {/* Connector line between steps */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute top-4 left-[calc(50%+16px)] right-[calc(-50%+16px)] h-[1px] -translate-y-1/2 transition-colors duration-200",
                    isCompleted ? "bg-foreground" : "bg-border"
                  )}
                  aria-hidden="true"
                />
              )}

              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(step.id)}
                className={cn(
                  "relative z-10 flex items-center justify-center size-8 border transition-all text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-none",
                  isCompleted
                    ? "bg-foreground text-background border-foreground cursor-pointer hover:bg-foreground/90"
                    : isCurrent
                    ? "bg-background text-foreground border-foreground ring-1 ring-foreground"
                    : "bg-muted/30 text-muted-foreground border-border cursor-not-allowed"
                )}
              >
                {isCompleted ? (
                  <Check className="size-4 stroke-[2.5]" />
                ) : (
                  <span>{step.id}</span>
                )}
              </button>

              <div className="mt-1.5 text-center flex flex-col items-center">
                <span
                  className={cn(
                    "text-[10px] sm:text-xs font-medium leading-none tracking-tight transition-colors line-clamp-1",
                    isCurrent || isCompleted ? "text-foreground font-semibold" : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
                {step.description && (
                  <span className="hidden md:block text-[9px] text-muted-foreground mt-0.5 leading-none">
                    {step.description}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
