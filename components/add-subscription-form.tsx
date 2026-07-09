"use client"

import { useState, useTransition } from "react"
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

import { addSubscription } from "@/app/home/actions"
import { subscriptionSchema, type SubscriptionInput } from "@/app/home/schemas"

export function AddSubscriptionForm() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<SubscriptionInput>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      service_name: "",
      cost: 0,
      plan_type: "Monthly",
      payment_mode: "",
      next_due_date: undefined,
      is_trial: false,
      trial_end_date: undefined,
    },
  })

  const onSubmit = (values: SubscriptionInput) => {
    setError(null)
    startTransition(async () => {
      const result = await addSubscription(values)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        form.reset()
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="icon">
            <Plus className="size-4" />
            <span className="sr-only">Add subscription</span>
          </Button>
        }
      />
      <DialogContent
        showCloseButton={false}
        className="max-w-md bg-transparent p-0 shadow-none ring-0"
      >
        <Card className="w-full">
          <CardHeader className="relative space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Add Subscription
            </CardTitle>
            <CardDescription>
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
              <CardFooter className="flex flex-col space-y-4">
                <Button className="w-full" type="submit" disabled={isPending}>
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
