'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { signup } from '@/app/auth/actions'
import { signupSchema, type SignupFormValues } from '@/lib/validations/auth'
import { cn } from '@/lib/utils'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = (values: SignupFormValues) => {
    setError(null)
    setSuccessMessage(null)
    startTransition(async () => {
      const result = await signup(values)
      if (result?.error) {
        setError(result.error)
        form.setError('password', { type: 'manual', message: result.error })
      } else if (result?.success) {
        setSuccessMessage(result.message ?? null)
      }
    })
  }

  return (
    <Card className="w-full rounded-none">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg md:text-xl lg:text-2xl font-heading font-semibold leading-snug tracking-tight text-foreground">
          Create an account
        </CardTitle>
        <CardDescription className="text-xs md:text-xs lg:text-sm font-normal leading-normal text-muted-foreground">
          Enter your email below to create your account.
        </CardDescription>
      </CardHeader>
      {successMessage ? (
        <CardContent className="space-y-4">
          <div className="border border-primary text-primary text-xs md:text-xs lg:text-sm p-4 text-center font-medium rounded-none">
            {successMessage}
          </div>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: 'default' }), 'w-full text-center text-sm md:text-sm lg:text-base font-medium leading-none rounded-none')}
          >
            Return to Login
          </Link>
        </CardContent>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <CardContent className="space-y-4">
              {error && (
                <div className="border border-destructive text-destructive text-xs md:text-xs lg:text-sm font-medium p-3 rounded-none">
                  {error}
                </div>
              )}
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
                    <FormLabel className="text-sm md:text-sm lg:text-base font-medium leading-none text-foreground">
                      Password
                    </FormLabel>
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
                {isPending ? 'Creating account...' : 'Create account'}
              </Button>
              <div className="text-xs md:text-xs lg:text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link
                  href="/"
                  className="text-primary hover:underline underline-offset-4 font-medium"
                >
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Form>
      )}
    </Card>
  )
}
