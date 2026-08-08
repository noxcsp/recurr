import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ResetPasswordClient } from '@/components/reset-password-client'

export default async function ResetPasswordPage() {
  const supabase = await createClient()

  const { data: userData, error } = await supabase.auth.getUser()

  if (error || !userData?.user) {
    redirect('/')
  }

  return <ResetPasswordClient />
}
