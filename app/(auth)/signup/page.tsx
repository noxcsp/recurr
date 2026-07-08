'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { signup } from '@/app/auth/actions'
import { cn } from '@/lib/utils'

interface ActionState {
  error: string;
  success: boolean;
  message: string;
}

const initialState: ActionState = {
  error: '',
  success: false,
  message: '',
}

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(
    async (prevState: ActionState, formData: FormData) => {
      const result = await signup(formData)
      if (result?.error) {
        return { error: result.error, success: false, message: '' }
      }
      if (result?.success) {
        return { error: '', success: true, message: result.message }
      }
      return prevState
    },
    initialState
  )

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
        <CardDescription>
          Enter your email below to create your account.
        </CardDescription>
      </CardHeader>
      {state?.success ? (
        <CardContent className="space-y-4">
          <div className="text-primary text-sm p-4 text-center">
            {state.message}
          </div>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: 'default' }), 'w-full text-center')}
          >
            Return to Login
          </Link>
        </CardContent>
      ) : (
        <form action={formAction}>
          <CardContent className="space-y-4">
            {state?.error && (
              <div className="text-destructive text-sm p-3">
                {state.error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit" disabled={pending}>
              {pending ? 'Creating account...' : 'Create account'}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <Link
                href="/"
                className="text-primary hover:underline underline-offset-4"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}
