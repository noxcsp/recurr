import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash') || searchParams.get('token')
  const rawType = searchParams.get('type')
  const next = searchParams.get('next') ?? '/home'

  const supabase = await createClient()

  // 1. Handle PKCE authorization code exchange (if code query parameter exists)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 2. Handle token_hash verification via verifyOtp (if token_hash/token exists)
  if (token_hash) {
    const otpTypes: EmailOtpType[] = rawType
      ? [rawType as EmailOtpType]
      : ['signup', 'email']

    for (const otpType of otpTypes) {
      const { error } = await supabase.auth.verifyOtp({
        type: otpType,
        token_hash,
      })
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // 3. Fallback check: if user is already authenticated (e.g. verified directly by Supabase Auth server)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  // Redirect to login page with error query parameter if token verification failed
  return NextResponse.redirect(`${origin}/?error=auth-code-error`)
}

