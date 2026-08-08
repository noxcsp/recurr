'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Home, RefreshCw, WifiOff, Wifi } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function OfflinePage() {
  // Default to false when rendered on the /offline page until verified
  const [isOnline, setIsOnline] = useState<boolean>(false)
  const [isChecking, setIsChecking] = useState<boolean>(false)

  const checkConnectivity = useCallback(async () => {
    setIsChecking(true)

    // First check navigator.onLine API
    if (typeof window !== 'undefined' && !navigator.onLine) {
      setIsOnline(false)
      setIsChecking(false)
      return false
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      // Ping external internet endpoint (Supabase API or public CDN) with no-cors to verify real internet connectivity
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://www.google.com'
      await fetch(`${supabaseUrl}?_=${Date.now()}`, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      setIsOnline(true)
      setIsChecking(false)
      return true
    } catch {
      setIsOnline(false)
      setIsChecking(false)
      return false
    }
  }, [])

  useEffect(() => {
    // Initial verification on mount via timer to prevent set-state-in-effect
    const timer = setTimeout(() => {
      checkConnectivity()
    }, 0)

    const handleOnline = () => {
      checkConnectivity()
    }
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkConnectivity])

  const handleRefresh = async () => {
    const online = await checkConnectivity()
    if (online) {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-border bg-card p-6 md:p-8 rounded-none space-y-6 text-center shadow-none">
        <div className="inline-flex items-center justify-center size-12 border border-border text-foreground rounded-none mx-auto">
          {isOnline ? (
            <Wifi className="size-6 text-foreground" />
          ) : (
            <WifiOff className="size-6 text-muted-foreground" />
          )}
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 border border-border px-2 py-0.5 font-mono text-xs md:text-xs lg:text-xs text-muted-foreground uppercase tracking-wider rounded-none mb-1">
            <span className={cn("size-2 rounded-none inline-block", isOnline ? "bg-foreground" : "bg-muted-foreground")} />
            <span>{isChecking ? 'Checking status...' : isOnline ? 'Connection Restored' : 'Offline'}</span>
          </div>

          <h1 className="text-xl md:text-2xl lg:text-3xl font-heading font-semibold text-foreground leading-tight">
            No Internet Connection
          </h1>

          <p className="text-xs md:text-sm lg:text-base font-sans text-muted-foreground leading-relaxed">
            {isOnline
              ? 'Your internet connection has been restored. Click below to continue using Phase.'
              : 'You are currently offline. Please check your network connection and try again.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/home"
            className={cn(
              buttonVariants({ variant: 'default' }),
              'w-full sm:w-auto text-xs md:text-sm lg:text-base font-medium rounded-none inline-flex items-center justify-center gap-2 px-4 py-2'
            )}
          >
            <Home className="size-4" />
            <span>Return Home</span>
          </Link>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isChecking}
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'w-full sm:w-auto text-xs md:text-sm lg:text-base font-medium rounded-none inline-flex items-center justify-center gap-2 px-4 py-2'
            )}
          >
            <RefreshCw className={cn("size-4", isChecking && "animate-spin")} />
            <span>{isChecking ? 'Checking...' : 'Try Again'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
