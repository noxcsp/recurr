"use client"

import { useEffect, useState } from "react"

/**
 * Returns the active breakpoint based on Tailwind v4 defaults:
 * - "mobile": < 768px
 * - "tablet": 768px – 1023px
 * - "desktop": ≥ 1024px
 */
export type Breakpoint = "mobile" | "tablet" | "desktop"

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("mobile")

  useEffect(() => {
    const md = window.matchMedia("(min-width: 768px)")
    const lg = window.matchMedia("(min-width: 1024px)")

    function update() {
      if (lg.matches) setBreakpoint("desktop")
      else if (md.matches) setBreakpoint("tablet")
      else setBreakpoint("mobile")
    }

    update()
    md.addEventListener("change", update)
    lg.addEventListener("change", update)

    return () => {
      md.removeEventListener("change", update)
      lg.removeEventListener("change", update)
    }
  }, [])

  return breakpoint
}
