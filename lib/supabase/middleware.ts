import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Always allow offline page and test routes without auth redirect
  if (pathname === '/offline') {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null
  let authError: any = null

  try {
    const { data, error } = await supabase.auth.getUser()
    user = data.user
    authError = error
  } catch (err: any) {
    authError = err
  }

  // Check if auth failed due to network / offline condition
  const isNetworkError =
    authError &&
    (authError.name === 'AuthRetryableFetchError' ||
      authError.message?.toLowerCase().includes('fetch') ||
      authError.message?.toLowerCase().includes('network') ||
      authError.message?.toLowerCase().includes('unexpected') ||
      authError.message?.toLowerCase().includes('failed to fetch'))

  if (isNetworkError) {
    // When network is down, redirect to /offline instead of login page
    const url = request.nextUrl.clone()
    url.pathname = '/offline'
    return NextResponse.redirect(url)
  }

  const isAuthPage =
    pathname === '/' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/success' ||
    pathname.startsWith('/auth')

  if ((authError || !user) && !isAuthPage) {
    // no valid user, redirect to auth login page
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (
    user &&
    (pathname === '/' || pathname === '/signup' || pathname === '/forgot-password')
  ) {
    // User already authenticated, redirect to /home
    const url = request.nextUrl.clone()
    url.pathname = '/home'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
