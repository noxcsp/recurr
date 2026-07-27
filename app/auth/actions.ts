'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { loginSchema, signupSchema, resetPasswordSchema, type LoginFormValues, type SignupFormValues, type ResetPasswordFormValues } from '@/lib/validations/auth'

export async function signinWithOAuth(provider: 'google') {
  const supabase = await createClient()
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = headersList.get('x-forwarded-proto') || (process.env.NODE_ENV === 'development' ? 'https' : 'https')
  const origin = `${protocol}://${host}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data?.url) {
    redirect(data.url)
  }
}

export async function login(data: LoginFormValues) {
  const supabase = await createClient()

  const validated = loginSchema.safeParse(data)
  if (!validated.success) {
    return { error: 'Invalid input fields' }
  }

  const { error } = await supabase.auth.signInWithPassword(validated.data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/home')
}

export async function signup(data: SignupFormValues): Promise<{ error?: string; success?: boolean; message?: string } | void> {
  const supabase = await createClient()

  const validated = signupSchema.safeParse(data)
  if (!validated.success) {
    return { error: 'Invalid input fields' }
  }

  const { error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      data: {
        display_name: validated.data.display_name,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function resetPassword(data: ResetPasswordFormValues) {
  const supabase = await createClient()

  const validated = resetPasswordSchema.safeParse(data)
  if (!validated.success) {
    return { error: 'Invalid input fields' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(validated.data.email)

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Check your email for the password reset link.' }
}

export async function signout() {
  const supabase = await createClient()
  try {
    await supabase.auth.signOut()
  } catch {
    // Ignore signout error if session/refresh token is already invalid/expired
  }
  redirect('/')
}

export async function deleteAccount(): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'User not authenticated' }
  }

  // Delete user from Supabase Auth via Admin API (ON DELETE CASCADE automatically wipes profiles, subscriptions, and notifications)
  const adminClient = createAdminClient()
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

  if (deleteError) {
    return { error: deleteError.message }
  }

  try {
    await supabase.auth.signOut()
  } catch {
    // Ignore signout error if session was invalidated upon account deletion
  }

  revalidatePath('/', 'layout')
  return { success: true }
}
