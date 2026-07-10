"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

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
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
import { Trash2 } from "lucide-react"

import { updateSubscription, deleteSubscription } from "@/app/home/actions"
import { subscriptionSchema, type SubscriptionFormValues } from "@/lib/validations/subscription"
import { Subscription } from "@/types/subscriptions"

interface EditSubscriptionFormProps {
  subscription: Subscription
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditSubscriptionForm({
  subscription,
  open,
  onOpenChange,
}: EditSubscriptionFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [deletePopoverOpen, setDeletePopoverOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      service_name: subscription.service_name,
      cost: subscription.cost,
      plan_type: subscription.plan_type,
      payment_mode: subscription.payment_mode,
      next_due_date: new Date(subscription.next_due_date),
      is_trial: subscription.is_trial,
      trial_end_date: subscription.trial_end_date
        ? new Date(subscription.trial_end_date)
        : undefined,
      subscription_status: subscription.subscription_status,
    },
  })

  const onSubmit = (values: SubscriptionFormValues) => {
    setError(null)
    startTransition(async () => {
      const result = await updateSubscription(subscription.id, values)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        onOpenChange(false)
        toast.success("Subscription updated", {
          position: "top-right",
          description: `${values.service_name} has been saved.`,
        })
      }
    })
  }

  const onDelete = () => {
    setError(null)
    startDeleteTransition(async () => {
      const result = await deleteSubscription(subscription.id)
      if (result?.error) {
        setError(result.error)
        setDeletePopoverOpen(false)
      } else if (result?.success) {
        setDeletePopoverOpen(false)
        onOpenChange(false)
        toast.success("Subscription deleted", {
          position: "top-right",
          description: `${subscription.service_name} has been removed.`,
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md bg-transparent p-0 shadow-none ring-0"
      >
        <Card className="w-full">
          <CardHeader className="relative space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Edit Subscription
            </CardTitle>
            <CardDescription>
              Update the details for{" "}
              <span className="font-medium text-foreground">
                {subscription.service_name}
              </span>
              .
            </CardDescription>

            {/* Delete button with popover confirmation */}
            <Popover open={deletePopoverOpen} onOpenChange={setDeletePopoverOpen}>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute top-0 right-4 rounded-none text-destructive hover:bg-destructive/10 hover:text-destructive"
                    size="icon-sm"
                    disabled={isDeleting || isPending}
                  />
                }
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Delete subscription</span>
              </PopoverTrigger>
              <PopoverContent side="bottom" align="end" className="w-64 p-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Delete subscription?</p>
                    <p className="text-xs text-muted-foreground">
                      This will permanently remove{" "}
                      <span className="font-medium text-foreground">
                        {subscription.service_name}
                      </span>
                      . This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-none"
                      onClick={() => setDeletePopoverOpen(false)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="flex-1 rounded-none"
                      onClick={onDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </CardHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <CardContent className="space-y-4">
                {error && (
                  <div className="border border-destructive p-3 text-xs font-medium text-destructive">
                    {error}
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="service_name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Service Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Netflix, Spotify" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Cost (₱)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-muted-foreground">
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="plan_type"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Plan Type</FormLabel>
                      <FormControl>
                        <Tabs
                          value={field.value}
                          onValueChange={(value) => field.onChange(value)}
                        >
                          <TabsList variant="line" className="w-full">
                            <TabsTrigger value="Weekly">Weekly</TabsTrigger>
                            <TabsTrigger value="Monthly">Monthly</TabsTrigger>
                            <TabsTrigger value="Annual">Annual</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subscription_status"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Tabs
                          value={field.value}
                          onValueChange={(value) => field.onChange(value)}
                        >
                          <TabsList variant="line" className="w-full">
                            <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
                            <TabsTrigger value="paid">Paid</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="payment_mode"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Payment Mode</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. GCash, Credit Card"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="next_due_date"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Next Due Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
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
                      <FormLabel className="font-normal">
                        This is a free trial
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch("is_trial") && (
                  <FormField
                    control={form.control}
                    name="trial_end_date"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Trial End Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value ?? undefined}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-none"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending || isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  type="submit"
                  disabled={isPending || isDeleting}
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
