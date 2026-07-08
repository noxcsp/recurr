'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginSchema, signupSchema, resetPasswordSchema, type LoginInput, type SignupInput, type ResetPasswordInput } from '@/app/auth/schemas'

export async function login(data: LoginInput) {
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

export async function signup(data: SignupInput) {
  const supabase = await createClient()

  const validated = signupSchema.safeParse(data)
  if (!validated.success) {
    return { error: 'Invalid input fields' }
  }

  const { error } = await supabase.auth.signUp(validated.data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true, message: 'Check your email to confirm your account.' }
}

export async function resetPassword(data: ResetPasswordInput) {
  const supabase = await createClient()

  const validated = resetPasswordSchema.safeParse(data)
  if (!validated.success) {
    return { error: 'Invalid input fields' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(validated.data.email)

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Check your email for the reset link.' }
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
