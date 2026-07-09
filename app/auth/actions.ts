'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginSchema, signupSchema, resetPasswordSchema, type LoginFormValues, type SignupFormValues, type ResetPasswordFormValues } from '@/lib/validations/auth'

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
        timezone: 'Asia/Manila',
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  // Commented out email confirmation for the meantime
  // return { success: true, message: 'Check your email to confirm your account.' }
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
  await supabase.auth.signOut()
  redirect('/')
}
