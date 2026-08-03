"use client"

import { useState, useCallback, useEffect } from "react"
import { Plus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { AddSubscriptionForm } from "@/components/add-subscription-form"

interface AddFABProps {
  bottomOffset?: number
}

export function AddFAB({ bottomOffset = 72 }: AddFABProps) {
  const [open, setOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  const handleOpenChange = useCallback((v: boolean) => setOpen(v), [])

  useEffect(() => {
    let lastScrollY = 0

    const handleScroll = (e: Event) => {
      const target = e.target
      let currentScrollY = 0

      if (target === document || target === window) {
        currentScrollY = window.scrollY
      } else if (target instanceof HTMLElement) {
        currentScrollY = target.scrollTop
      } else {
        currentScrollY = window.scrollY
      }

      const diff = currentScrollY - lastScrollY

      if (Math.abs(diff) < 5) return

      if (currentScrollY <= 10) {
        setIsVisible(true)
      } else if (diff > 0) {
        setIsVisible(false)
      } else if (diff < 0) {
        setIsVisible(true)
      }

      lastScrollY = Math.max(0, currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { capture: true, passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true })
    }
  }, [])

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            type="button"
            aria-label="Add subscription"
            onClick={() => setOpen(true)}
            style={{ bottom: `calc(${bottomOffset + 16}px + env(safe-area-inset-bottom, 0px))` }}
            className="fixed right-4 z-30 flex size-14 cursor-pointer items-center justify-center border border-foreground bg-background text-foreground shadow-[4px_4px_0px_0px] shadow-foreground transition-[box-shadow,background-color,color] duration-75 active:translate-x-1 active:translate-y-1 active:bg-foreground active:text-background active:shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <Plus strokeWidth={1.25} className="size-6" aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>

      <AddSubscriptionForm externalOpen={open} onExternalOpenChange={handleOpenChange} />
    </>
  )
}

