"use client"

import { useTheme } from "next-themes"
import { Monitor, Moon, Sun } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
        <h2 className="text-xs font-heading font-semibold uppercase tracking-wide leading-none text-muted-foreground md:text-xs lg:text-sm">
          Appearance
        </h2>
        <p className="text-xs font-normal leading-normal text-muted-foreground md:text-xs lg:text-sm">
          Select a theme preference. System will follow your device settings.
        </p>
      </div>

      <Tabs
        value={theme}
        onValueChange={(value) => setTheme(value as string)}
      >
        <TabsList className="w-full rounded-none border border-border bg-transparent p-0">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex-1 gap-1.5 rounded-none border-0 py-2 text-xs font-medium md:text-xs lg:text-sm data-active:bg-foreground data-active:text-background"
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
