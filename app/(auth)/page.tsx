'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { login, signinWithOAuth } from '@/app/auth/actions'
import { loginSchema, type LoginFormValues } from '@/lib/validations/auth'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = (values: LoginFormValues) => {
    setError(null)
    startTransition(async () => {
      const result = await login(values)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  const handleGoogleSignIn = () => {
    setError(null)
    startTransition(async () => {
      const result = await signinWithOAuth('google')
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <Card className="w-full rounded-none">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg md:text-xl lg:text-2xl font-heading font-semibold leading-snug tracking-tight text-foreground">
          Login
        </CardTitle>
        <CardDescription className="text-xs md:text-xs lg:text-sm font-normal leading-normal text-muted-foreground">
          Enter your email and password to sign in to your account.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <CardContent className="space-y-4">
            {error && (
              <div className="border border-destructive text-destructive text-xs md:text-xs lg:text-sm font-medium p-3 rounded-none">
                {error}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full text-xs md:text-xs lg:text-sm font-medium rounded-none flex items-center justify-center gap-2"
              onClick={handleGoogleSignIn}
              disabled={isPending}
            >
              <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              <span>Sign in with Google</span>
            </Button>
            <div className="relative flex items-center justify-center my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs md:text-xs lg:text-xs uppercase bg-card px-2 text-muted-foreground font-medium">
                Or continue with
              </div>
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm md:text-sm lg:text-base font-medium leading-none text-foreground">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="m@example.com"
                      className="rounded-none text-xs md:text-xs lg:text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs md:text-xs lg:text-sm font-medium text-destructive" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm md:text-sm lg:text-base font-medium leading-none text-foreground">
                      Password
                    </FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-xs md:text-xs lg:text-sm font-medium text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        className="pr-10 rounded-none text-xs md:text-xs lg:text-sm"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent rounded-none"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4 text-muted-foreground" />
                      ) : (
                        <Eye className="size-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <FormMessage className="text-xs md:text-xs lg:text-sm font-medium text-destructive" />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full text-sm md:text-sm lg:text-base font-medium leading-none rounded-none" type="submit" disabled={isPending}>
              {isPending ? 'Signing in...' : 'Sign in'}
            </Button>
            <div className="text-xs md:text-xs lg:text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-primary hover:underline underline-offset-4 font-medium"
              >
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
