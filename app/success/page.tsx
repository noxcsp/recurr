import { SuccessScreen } from '@/components/success-screen'

interface SuccessPageProps {
  searchParams: Promise<{
    title?: string
    description?: string
    redirectTo?: string
    redirectDelaySeconds?: string
    type?: string
  }>
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams

  let title = params.title
  let description = params.description
  const redirectTo = params.redirectTo || '/'
  const redirectDelaySeconds = params.redirectDelaySeconds
    ? parseInt(params.redirectDelaySeconds, 10)
    : 3

  if (!title || !description) {
    if (params.type === 'reset-password') {
      title = title || 'Password Reset Successful'
      description =
        description ||
        'Your password has been updated successfully. You will be redirected to the login page.'
    } else {
      title = title || 'Account Deleted Successfully'
      description =
        description ||
        'Your account has been deleted successfully. You will be redirected to the login page.'
    }
  }

  return (
    <SuccessScreen
      title={title}
      description={description}
      redirectTo={redirectTo}
      redirectDelaySeconds={redirectDelaySeconds}
    />
  )
}