'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Home, RefreshCw, AlertTriangle } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error('Unhandled app error:', error)
  }, [error])

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-border bg-card p-6 md:p-8 rounded-none space-y-6 text-center shadow-none">
        <div className="inline-flex items-center justify-center size-12 border border-destructive text-destructive rounded-none mx-auto">
          <AlertTriangle className="size-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-heading font-semibold text-foreground leading-tight">
            Something Went Wrong
          </h1>
          <p className="text-xs md:text-sm lg:text-base font-sans text-muted-foreground leading-relaxed">
            An unexpected error occurred while loading this page. Please try again or return to the main dashboard.
          </p>
        </div>

        {error.digest && (
          <div className="border border-border p-2 bg-background font-mono text-xs md:text-xs lg:text-xs text-muted-foreground rounded-none text-left overflow-x-auto">
            <span className="font-semibold text-foreground">Error Digest:</span> {error.digest}
          </div>
        )}

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
            onClick={() => reset()}
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'w-full sm:w-auto text-xs md:text-sm lg:text-base font-medium rounded-none inline-flex items-center justify-center gap-2 px-4 py-2'
            )}
          >
            <RefreshCw className="size-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    </div>
  )
}
