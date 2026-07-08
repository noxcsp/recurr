import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { signout } from '@/app/auth/actions'

export default async function HomePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect('/')
  }

  const user = data.user

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Welcome!</CardTitle>
          <CardDescription>
            You have successfully logged in. Here are your account details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="font-semibold text-muted-foreground">User ID:</div>
            <div className="col-span-2 font-mono truncate" title={user.id}>{user.id}</div>
            
            <div className="font-semibold text-muted-foreground">Email:</div>
            <div className="col-span-2 truncate" title={user.email}>{user.email}</div>
            
            <div className="font-semibold text-muted-foreground">Last Sign In:</div>
            <div className="col-span-2">
              {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <form action={signout} className="w-full">
            <Button variant="outline" className="w-full" type="submit">
              Sign out
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
