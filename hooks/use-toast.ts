"use client"

import * as React from "react"
import { toast as toastManager, useToastManager } from "@/components/ui/toast"
import type { ToastManagerAddOptions } from "@base-ui/react/toast"

export interface ToastOptions extends Omit<ToastManagerAddOptions<object>, "type"> {
  description?: React.ReactNode
  timeout?: number
  position?: string
}

type ToastManagerLike = {
  add: (options: ToastManagerAddOptions<object>) => string
  close: (id?: string) => void
}

function createToastHelpers(manager: ToastManagerLike) {
  const show = (options: ToastManagerAddOptions<object>) => manager.add(options)

  return Object.assign(show, {
    add: (options: ToastManagerAddOptions<object>) => manager.add(options),
    success: (title: React.ReactNode, options?: ToastOptions) =>
      manager.add({ title, type: "success", ...options }),
    error: (title: React.ReactNode, options?: ToastOptions) =>
      manager.add({ title, type: "error", ...options }),
    info: (title: React.ReactNode, options?: ToastOptions) =>
      manager.add({ title, type: "info", ...options }),
    warning: (title: React.ReactNode, options?: ToastOptions) =>
      manager.add({ title, type: "warning", ...options }),
    dismiss: (id?: string) => manager.close(id),
    close: (id?: string) => manager.close(id),
  })
}

export const toast = createToastHelpers(toastManager)

export function useToast() {
  const manager = useToastManager()

  const helpers = React.useMemo(() => {
    return createToastHelpers(manager)
  }, [manager])

  return {
    toast: helpers,
    toasts: manager.toasts,
    dismiss: manager.close,
  }
}
