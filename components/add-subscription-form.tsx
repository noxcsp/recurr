"use client"

import { useState, useEffect, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"

import { addSubscription } from "@/app/home/actions"
import { subscriptionSchema, type SubscriptionFormValues } from "@/lib/validations/subscription"

interface AddSubscriptionFormProps {
  defaultDate?: Date
  externalOpen?: boolean
  onExternalOpenChange?: (open: boolean) => void
}

export function AddSubscriptionForm({
  defaultDate,
  externalOpen,
  onExternalOpenChange,
}: AddSubscriptionFormProps = {}) {
  const isControlled = externalOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isControlled ? externalOpen : internalOpen
  const setOpen = isControlled
    ? (v: boolean) => onExternalOpenChange?.(v)
    : setInternalOpen
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      service_name: "",
      cost: 0,
      plan_type: "Monthly",
      payment_mode: "",
      next_due_date: defaultDate,
      is_trial: false,
      trial_end_date: undefined,
      subscription_status: "unpaid",
    },
  })

  useEffect(() => {
    if (defaultDate) {
      form.setValue("next_due_date", defaultDate)
    }
  }, [defaultDate, form])

  const onSubmit = (values: SubscriptionFormValues) => {
    setError(null)
    startTransition(async () => {
      const result = await addSubscription(values)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        form.reset()
        setOpen(false)
        toast.success("Subscription added", {
          position: "top-right",
          description: `${values.service_name} has been added to your subscriptions.`,
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger
          render={
            <Button variant="outline" size="icon">
              <Plus className="size-4" />
              <span className="sr-only">Add subscription</span>
            </Button>
          }
        />
      )}
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100%-2rem)] sm:w-full sm:max-w-md bg-transparent p-0 shadow-none ring-0"
      >
        <Card className="w-full max-h-[calc(100dvh-2rem)] flex flex-col">
          <CardHeader className="relative space-y-1 shrink-0">
            <CardTitle className="text-xl font-semibold leading-tight tracking-tight md:text-2xl lg:text-3xl">
              Add Subscription
            </CardTitle>
            <CardDescription className="text-xs font-normal leading-normal text-muted-foreground md:text-xs lg:text-sm">
              Enter the details of your new subscription.
            </CardDescription>
            <DialogClose
              render={
                <Button
                  variant="ghost"
                  className="absolute top-0 right-4 rounded-none"
                  size="icon-sm"
                />
              }
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </CardHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex min-h-0 flex-1 flex-col justify-between"
            >
              <CardContent className="py-3 space-y-4 overflow-y-auto min-h-0 flex-1">
                {error && (
                  <div className="border border-destructive p-3 text-xs font-medium leading-normal text-destructive md:text-xs lg:text-sm">
                    {error}
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="service_name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium leading-none md:text-sm lg:text-base">
                        Service Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Netflix, Spotify" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs font-normal leading-normal text-destructive md:text-xs lg:text-sm" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium leading-none md:text-sm lg:text-base">
                        Cost (₱)
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute top-1/2 left-2.5 -translate-y-1/2 text-xs font-normal leading-normal text-muted-foreground md:text-xs lg:text-sm">
                            ₱
                          </span>
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            placeholder="0.00"
                            className="pl-7"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber || 0)
                            }
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs font-normal leading-normal text-destructive md:text-xs lg:text-sm" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="plan_type"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium leading-none md:text-sm lg:text-base">
                        Plan Type
                      </FormLabel>
                      <FormControl>
                        <Tabs
                          value={field.value ?? "Monthly"}
                          onValueChange={(value) => field.onChange(value)}
                        >
                          <TabsList variant="line" className="w-full">
                            <TabsTrigger value="Weekly">Weekly</TabsTrigger>
                            <TabsTrigger value="Monthly">Monthly</TabsTrigger>
                            <TabsTrigger value="Annual">Annual</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </FormControl>
                      <FormMessage className="text-xs font-normal leading-normal text-destructive md:text-xs lg:text-sm" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subscription_status"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium leading-none md:text-sm lg:text-base">
                        Status
                      </FormLabel>
                      <FormControl>
                        <Tabs
                          value={field.value ?? "unpaid"}
                          onValueChange={(value) => field.onChange(value)}
                        >
                          <TabsList variant="line" className="w-full">
                            <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
                            <TabsTrigger value="paid">Paid</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </FormControl>
                      <FormMessage className="text-xs font-normal leading-normal text-destructive md:text-xs lg:text-sm" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="payment_mode"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium leading-none md:text-sm lg:text-base">
                        Payment Mode
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. GCash, Credit Card"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs font-normal leading-normal text-destructive md:text-xs lg:text-sm" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="next_due_date"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium leading-none md:text-sm lg:text-base">
                        Next Due Date
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage className="text-xs font-normal leading-normal text-destructive md:text-xs lg:text-sm" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_trial"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked)
                            if (!checked) {
                              form.setValue("trial_end_date", undefined)
                            }
                          }}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal leading-none md:text-sm lg:text-base">
                        This is a free trial
                      </FormLabel>
                      <FormMessage className="text-xs font-normal leading-normal text-destructive md:text-xs lg:text-sm" />
                    </FormItem>
                  )}
                />
                {form.watch("is_trial") && (
                  <FormField
                    control={form.control}
                    name="trial_end_date"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium leading-none md:text-sm lg:text-base">
                          Trial End Date
                        </FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value ?? undefined}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage className="text-xs font-normal leading-normal text-destructive md:text-xs lg:text-sm" />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
              <CardFooter className="shrink-0 flex flex-col space-y-4">
                <Button
                  className="w-full text-sm font-medium leading-none md:text-sm lg:text-base"
                  type="submit"
                  disabled={isPending}
                >
                  {isPending ? "Adding..." : "Add Subscription"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
