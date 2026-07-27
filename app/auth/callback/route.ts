import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/home'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') 
      const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        const host = request.headers.get('host') || 'localhost:3000'
        return NextResponse.redirect(`https://${host}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`${forwardedProto}://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  const host = request.headers.get('host') || 'localhost:3000'
  const errorOrigin = process.env.NODE_ENV === 'development' 
    ? `https://${host}` 
    : origin

  // Redirect to login page with an error state (could handle more gracefully if needed)
  return NextResponse.redirect(`${errorOrigin}/?error=auth-code-error`)
}
