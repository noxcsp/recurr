'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
      display_name: '',
      email: '',
      password: '',
    },
  })

  const displayNameValue = form.watch('display_name') || ''
  const emailValue = form.watch('email') || ''
  const passwordValue = form.watch('password') || ''

  const isDisplayNameValid = displayNameValue.trim().length > 0 && !form.formState.errors.display_name
  const isEmailValid = z.string().email().safeParse(emailValue).success && !form.formState.errors.email
  const isPasswordValid =
    passwordValue.length >= 8 &&
    /[0-9]/.test(passwordValue) &&
    /[^a-zA-Z0-9]/.test(passwordValue) &&
    !form.formState.errors.password

  const passwordRequirements = [
    {
      id: 'length',
      label: 'At least 8 characters',
      met: passwordValue.length >= 8,
    },
    {
      id: 'number',
      label: 'At least one number (0-9)',
      met: /[0-9]/.test(passwordValue),
    },
    {
      id: 'special',
      label: 'At least one special character (!@#$%...)',
      met: /[^a-zA-Z0-9]/.test(passwordValue),
    },
  ]

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
          Enter your details below to create your account.
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
                name="display_name"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm md:text-sm lg:text-base font-medium leading-none text-foreground">
                      Display Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="John Doe"
                        className={cn(
                          'rounded-none text-xs md:text-xs lg:text-sm',
                          isDisplayNameValid && 'border-emerald-600 focus-visible:ring-emerald-600 dark:border-emerald-500 dark:focus-visible:ring-emerald-500'
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs md:text-xs lg:text-sm font-medium text-destructive" />
                  </FormItem>
                )}
              />
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
                        className={cn(
                          'rounded-none text-xs md:text-xs lg:text-sm',
                          isEmailValid && 'border-emerald-600 focus-visible:ring-emerald-600 dark:border-emerald-500 dark:focus-visible:ring-emerald-500'
                        )}
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
                          className={cn(
                            'pr-10 rounded-none text-xs md:text-xs lg:text-sm',
                            isPasswordValid && 'border-emerald-600 focus-visible:ring-emerald-600 dark:border-emerald-500 dark:focus-visible:ring-emerald-500'
                          )}
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
                    <div className="mt-2 space-y-1.5 text-xs md:text-xs lg:text-xs font-medium">
                      {passwordRequirements.map((req) => (
                        <div
                          key={req.id}
                          className={cn(
                            'flex items-center gap-2 transition-colors duration-150',
                            req.met ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
                          )}
                        >
                          {req.met ? (
                            <Check className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <X className="size-3.5 shrink-0 text-destructive" />
                          )}
                          <span>{req.label}</span>
                        </div>
                      ))}
                    </div>
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
