'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function OfflineDetector() {
  const pathname = usePathname()

  useEffect(() => {
    const redirectToOffline = () => {
      if (pathname !== '/offline') {
        window.location.href = '/offline'
      }
    }

    const handleOffline = () => {
      redirectToOffline()
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Catch network fetch failures when offline (e.g. fetchServerAction failures)
      const errorString = String(event.reason?.message || event.reason || '')
      const isNetworkError =
        !navigator.onLine ||
        errorString.includes('Failed to fetch') ||
        errorString.includes('unexpected response') ||
        errorString.includes('NetworkError') ||
        errorString.includes('fetchServerAction') ||
        errorString.includes('AuthRetryableFetchError')

      if (isNetworkError && pathname !== '/offline') {
        event.preventDefault() // Suppress dev overlay if caused by offline state
        redirectToOffline()
      }
    }

    // Check initial state on mount
    if (typeof window !== 'undefined' && !navigator.onLine && pathname !== '/offline') {
      redirectToOffline()
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [pathname])

  return null
}
