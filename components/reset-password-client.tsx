'use client'

import { useState, useTransition } from 'react'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { updatePassword } from '@/app/auth/actions'
import { updatePasswordSchema, type UpdatePasswordFormValues } from '@/lib/validations/auth'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export function ResetPasswordClient() {
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const form = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const passwordValue = useWatch({ control: form.control, name: 'password' }) || ''
  const confirmPasswordValue = useWatch({ control: form.control, name: 'confirmPassword' }) || ''

  const isPasswordValid =
    passwordValue.length >= 8 &&
    /[a-z]/.test(passwordValue) &&
    /[A-Z]/.test(passwordValue) &&
    /[0-9]/.test(passwordValue) &&
    /[^a-zA-Z0-9]/.test(passwordValue) &&
    !form.formState.errors.password

  const isConfirmPasswordValid =
    confirmPasswordValue.length > 0 &&
    confirmPasswordValue === passwordValue &&
    !form.formState.errors.confirmPassword

  const passwordRequirements = [
    {
      id: 'length',
      label: 'At least 8 characters',
      met: passwordValue.length >= 8,
    },
    {
      id: 'case',
      label: 'At least one uppercase and one lowercase letter',
      met: /[a-z]/.test(passwordValue) && /[A-Z]/.test(passwordValue),
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

  const onSubmit = (values: UpdatePasswordFormValues) => {
    setError(null)
    startTransition(async () => {
      const result = await updatePassword(values)
      if (result?.error) {
        setError(result.error)
        form.setError('password', { type: 'manual', message: result.error })
      } else if (result?.success) {
        router.push('/success?type=reset-password')
      }
    })
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <Card className="w-full rounded-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg md:text-xl lg:text-2xl font-heading font-semibold leading-snug tracking-tight text-foreground">
            Set new password
          </CardTitle>
          <CardDescription className="text-xs md:text-xs lg:text-sm font-normal leading-normal text-muted-foreground">
            Enter your new password below to update your credentials.
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
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm md:text-sm lg:text-base font-medium leading-none text-foreground">
                        New Password
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
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
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm md:text-sm lg:text-base font-medium leading-none text-foreground">
                        Confirm New Password
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className={cn(
                              'pr-10 rounded-none text-xs md:text-xs lg:text-sm',
                              isConfirmPasswordValid && 'border-emerald-600 focus-visible:ring-emerald-600 dark:border-emerald-500 dark:focus-visible:ring-emerald-500'
                            )}
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent rounded-none"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                        >
                          {showConfirmPassword ? (
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
                  {isPending ? 'Updating password...' : 'Update password'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
  )
}
