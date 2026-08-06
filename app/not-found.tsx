import Link from 'next/link'
import { Home, FileQuestion } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-border bg-card p-6 md:p-8 rounded-none space-y-6 text-center shadow-none">
        <div className="inline-flex items-center justify-center size-12 border border-border text-foreground rounded-none mx-auto">
          <FileQuestion className="size-6 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <div className="inline-block border border-border px-2 py-0.5 font-mono text-xs md:text-xs lg:text-xs text-muted-foreground uppercase tracking-wider rounded-none mb-1">
            404 Error
          </div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-heading font-semibold text-foreground leading-tight">
            Page Not Found
          </h1>
          <p className="text-xs md:text-sm lg:text-base font-sans text-muted-foreground leading-relaxed">
            The page you are looking for doesn&apos;t exist, was removed, or has been relocated.
          </p>
        </div>

        <div className="flex items-center justify-center pt-2">
          <Link
            href="/home"
            className={cn(
              buttonVariants({ variant: 'default' }),
              'w-full sm:w-auto text-xs md:text-sm lg:text-base font-medium rounded-none inline-flex items-center justify-center gap-2 px-6 py-2'
            )}
          >
            <Home className="size-4" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
