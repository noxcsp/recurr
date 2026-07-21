'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { resetPassword } from '@/app/auth/actions'
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/lib/validations/auth'
import { cn } from '@/lib/utils'

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = (values: ResetPasswordFormValues) => {
    setError(null)
    setSuccessMessage(null)
    startTransition(async () => {
      const result = await resetPassword(values)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        setSuccessMessage(result.message)
      }
    })
  }

  return (
    <Card className="w-full rounded-none">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg md:text-xl lg:text-2xl font-semibold leading-snug tracking-tight text-foreground">
          Reset password
        </CardTitle>
        <CardDescription className="text-xs md:text-xs lg:text-sm font-normal leading-normal text-muted-foreground">
          Enter your email address and we will send you a verification code.
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
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button className="w-full text-sm md:text-sm lg:text-base font-medium leading-none rounded-none" type="submit" disabled={isPending}>
                {isPending ? 'Sending reset link...' : 'Send reset link'}
              </Button>
              <div className="text-xs md:text-xs lg:text-sm text-center text-muted-foreground">
                Remember your password?{' '}
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
