"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"

export interface SuccessScreenProps {
  title?: string
  description: string
  icon?: ReactNode
  redirectTo?: string
  redirectDelaySeconds?: number
}

export function SuccessScreen({
  title = "Success",
  description,
  icon,
  redirectTo = "/",
  redirectDelaySeconds = 3,
}: SuccessScreenProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(redirectDelaySeconds)

  useEffect(() => {
    if (!redirectTo || redirectDelaySeconds <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [redirectTo, redirectDelaySeconds])

  useEffect(() => {
    if (countdown <= 0 && redirectTo) {
      router.replace(redirectTo)
    }
  }, [countdown, redirectTo, router])

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-none border border-border bg-muted/30">
        {icon || (
          <CheckCircle2
            className="size-8 text-foreground"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        )}
      </div>

      <h2 className="text-xl font-heading font-semibold leading-tight text-foreground md:text-2xl lg:text-3xl">
        {title}
      </h2>

      <p className="mt-2 max-w-sm text-sm font-normal leading-relaxed text-muted-foreground md:text-base lg:text-base">
        {description}
      </p>

      {redirectTo && redirectDelaySeconds > 0 && (
        <div className="mt-6 border border-border bg-muted/20 px-4 py-2 text-xs font-medium leading-none text-muted-foreground md:text-xs lg:text-sm">
          Redirecting to login page in {countdown}{" "}
          {countdown === 1 ? "second" : "seconds"}...
        </div>
      )}
    </div>
  )
}
