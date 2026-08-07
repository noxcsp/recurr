"use client"

import { useTheme } from "next-themes"
import { Monitor, Moon, Sun } from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

export function ThemeSettings() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xs font-heading font-semibold uppercase tracking-wide leading-none text-muted-foreground">
          Appearance
        </h2>
        <p className="text-xs font-normal leading-normal text-muted-foreground">
          Select a theme preference. System will follow your device settings.
        </p>
      </div>

      <div role="radiogroup" aria-label="Theme preference" className="relative flex w-full border border-border bg-card p-1">
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
          const isActive = theme === value
          return (
            <motion.button
              key={value}
              type="button"
              role="radio"
              aria-checked={isActive}
              whileTap={{ scale: 0.96 }}
              onClick={() => setTheme(value)}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-1.5 py-1.5 text-xs font-medium transition-colors z-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                isActive ? "text-background font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="theme-active-pill"
                  className="absolute inset-0 bg-foreground"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon className="size-3.5" aria-hidden="true" />
                {label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
