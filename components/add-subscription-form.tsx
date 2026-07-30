"use client"

import { useState, useEffect, useTransition, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePicker } from "@/components/ui/date-picker"
import { Stepper, type StepItem } from "@/components/ui/stepper"
import {
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  CreditCard,
  Wallet,
  Clock,
  Sparkles,
  Edit3,
  Tv,
  Music,
  Cloud,
  Gamepad2,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"

import { addSubscription } from "@/app/home/actions"
import {
  subscriptionSchema,
  type SubscriptionFormValues,
} from "@/lib/validations/subscription"
import { parseUtcToLocalDate, toUtcDate } from "@/lib/utils/date"
import {
  PREDEFINED_SUBSCRIPTIONS,
  PREDEFINED_PAYMENT_METHODS,
  PREDEFINED_TRIAL_DURATIONS,
  calculateTrialEndDate,
  type ServicePlan,
} from "@/lib/constants/subscription-templates"
import { useSubscriptionWizardStore } from "@/lib/store/use-subscription-wizard-store"

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

  // Zustand Store
  const {
    currentStep,
    draftData,
    setStep,
    nextStep,
    prevStep,
    updateDraft,
    resetWizard,
  } = useSubscriptionWizardStore()

  const isCalendarTriggered = !!defaultDate
  const totalSteps = isCalendarTriggered ? 4 : 5

  // Define Steps
  const wizardSteps: StepItem[] = [
    { id: 1, title: "Service", description: "Select template" },
    { id: 2, title: "Plan", description: "Tier & cost" },
    { id: 3, title: "Payment", description: "Method" },
    { id: 4, title: "Trial", description: "Free duration" },
    ...(!isCalendarTriggered
      ? [{ id: 5, title: "Due Date", description: "Billing cycle" }]
      : []),
  ]

  // Stable date reference created once on mount via lazy useState initializer
  const [fallbackDate] = useState(() => new Date())

  // Handler for opening/closing dialog (updates state in response to user events)
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      const parsedDate = defaultDate ? parseUtcToLocalDate(defaultDate) : new Date()
      resetWizard(
        {
          next_due_date: parsedDate,
          payment_mode: PREDEFINED_PAYMENT_METHODS[0].label,
        },
        isCalendarTriggered
      )
      setError(null)
    }
    setOpen(newOpen)
  }

  // Stable form values reference for React Hook Form
  const formValues = useMemo<SubscriptionFormValues>(
    () => ({
      service_name: draftData.service_name || "",
      cost: draftData.cost || 0,
      plan_type: (draftData.plan_type as "Weekly" | "Monthly" | "Annual") || "Monthly",
      payment_mode: draftData.payment_mode || "",
      next_due_date: draftData.next_due_date || fallbackDate,
      is_trial: draftData.is_trial || false,
      trial_end_date: draftData.trial_end_date || undefined,
      subscription_status: draftData.subscription_status || "unpaid",
    }),
    [
      draftData.service_name,
      draftData.cost,
      draftData.plan_type,
      draftData.payment_mode,
      draftData.next_due_date,
      draftData.is_trial,
      draftData.trial_end_date,
      draftData.subscription_status,
      fallbackDate,
    ]
  )

  // Custom Form handling for Custom Service mode or raw validation
  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    mode: "onChange",
    values: formValues,
  })

  const computeSubscriptionStatus = (
    dueDate: Date | undefined,
    isStartedToday?: boolean
  ): "unpaid" | "paid" | "overdue" => {
    if (isStartedToday) return "paid"
    if (!dueDate) return "unpaid"
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    return due.getTime() < today.getTime() ? "overdue" : "unpaid"
  }

  const formatStatusLabel = (status: string): string => {
    if (status === "unpaid") return "Upcoming"
    if (status === "paid") return "Paid"
    if (status === "overdue") return "Overdue"
    return status
  }

  // Handle final submission
  const handleFinalSubmit = () => {
    setError(null)

    const calculatedStatus = computeSubscriptionStatus(
      draftData.next_due_date,
      draftData.isStartedToday
    )

    // Form final validation check
    const finalValues: SubscriptionFormValues = {
      service_name: draftData.service_name || "",
      cost: Number(draftData.cost) || 0,
      plan_type: (draftData.plan_type as "Weekly" | "Monthly" | "Annual") || "Monthly",
      payment_mode: draftData.payment_mode || "Other",
      next_due_date: draftData.next_due_date ? toUtcDate(draftData.next_due_date)! : new Date(),
      is_trial: !!draftData.is_trial,
      trial_end_date: draftData.is_trial && draftData.trial_end_date
        ? toUtcDate(draftData.trial_end_date)
        : undefined,
      subscription_status: calculatedStatus,
    }

    if (!finalValues.service_name.trim()) {
      setError("Please specify a service name.")
      setStep(1)
      return
    }
    const costNum = Number(finalValues.cost) || 0
    if (costNum <= 0) {
      setError("Please specify a valid cost greater than 0.")
      setStep(2)
      return
    }

    startTransition(async () => {
      const result = await addSubscription(finalValues)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        resetWizard()
        setOpen(false)
        toast.success("Subscription added", {
          position: "top-right",
          description: `${finalValues.service_name} has been added to your subscriptions.`,
        })
      }
    })
  }

  // Handle step selection validation before moving next
  const handleNext = () => {
    setError(null)
    if (currentStep === 1) {
      if (!draftData.service_name?.trim()) {
        setError("Please select a service or enter a custom service name.")
        return
      }
    } else if (currentStep === 2) {
      if (!draftData.cost || Number(draftData.cost) <= 0) {
        setError("Please select a plan or enter a cost greater than 0.")
        return
      }
    } else if (currentStep === 3) {
      if (!draftData.payment_mode) {
        setError("Please select a payment method.")
        return
      }
    }

    if (currentStep < totalSteps) {
      nextStep()
    } else {
      handleFinalSubmit()
    }
  }

  // Service Icons helper
  const getServiceIcon = (id?: string) => {
    switch (id) {
      case "netflix":
      case "disney-plus":
      case "youtube-premium":
        return <Tv className="size-5 text-foreground" />
      case "spotify":
        return <Music className="size-5 text-foreground" />
      case "icloud":
        return <Cloud className="size-5 text-foreground" />
      case "chatgpt":
        return <Sparkles className="size-5 text-foreground" />
      case "xbox-game-pass":
        return <Gamepad2 className="size-5 text-foreground" />
      default:
        return <Edit3 className="size-5 text-foreground" />
    }
  }

  const selectedTemplate = PREDEFINED_SUBSCRIPTIONS.find(
    (s) => s.id === draftData.selectedServiceId
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
        className="w-[calc(100%-2rem)] sm:w-full sm:max-w-lg bg-transparent p-0 shadow-none ring-0 max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden"
      >
        <Card className="w-full max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden border-border bg-background rounded-none">
          {/* Header */}
          <CardHeader className="relative space-y-2 shrink-0 pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-heading font-semibold leading-tight tracking-tight md:text-xl lg:text-2xl">
                  Add Subscription
                </CardTitle>
                <CardDescription className="text-xs font-normal leading-normal text-muted-foreground md:text-xs lg:text-sm">
                  Step {currentStep} of {totalSteps}: {wizardSteps[currentStep - 1]?.title}
                </CardDescription>
              </div>
              <DialogClose
                render={
                  <Button
                    variant="ghost"
                    className="rounded-none hover:bg-muted"
                    size="icon-sm"
                  />
                }
              >
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>

            {/* Stepper Component */}
            <Stepper
              steps={wizardSteps}
              currentStep={currentStep}
              onStepClick={(step) => setStep(step)}
            />
          </CardHeader>

          {/* Wizard Content Body */}
          <CardContent className="py-4 space-y-4 overflow-y-auto min-h-0 flex-1 px-4 sm:px-6">
            {error && (
              <div className="border border-destructive p-3 text-xs font-medium leading-normal text-destructive rounded-none">
                {error}
              </div>
            )}

            {/* STEP 1: SELECT SERVICE */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold tracking-tight text-foreground md:text-base">
                    Select a Subscription Service
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Choose a popular pre-configured template or create a custom entry.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2">
                  {PREDEFINED_SUBSCRIPTIONS.map((template) => {
                    const isSelected = draftData.selectedServiceId === template.id
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => {
                          const firstPlan = template.plans[0]
                          updateDraft({
                            selectedServiceId: template.id,
                            service_name: template.service_name,
                            selectedPlanId: firstPlan?.id,
                            cost: firstPlan?.cost || 0,
                            plan_type: firstPlan?.plan_type || "Monthly",
                          })
                        }}
                        className={`group relative flex flex-col items-start justify-between p-3.5 border transition-all text-left rounded-none ${isSelected
                            ? "border-foreground bg-accent/40 ring-1 ring-foreground"
                            : "border-border hover:border-foreground/50 hover:bg-muted/30"
                          }`}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <div className="p-1.5 border border-border bg-background">
                            {getServiceIcon(template.id)}
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="size-4 text-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground md:text-sm">
                            {template.service_name}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {template.category} • {template.plans.length} plans
                          </div>
                        </div>
                      </button>
                    )
                  })}

                  {/* Custom Option */}
                  <button
                    type="button"
                    onClick={() => {
                      updateDraft({
                        selectedServiceId: "custom",
                        service_name: draftData.selectedServiceId === "custom" ? draftData.service_name : "",
                        selectedPlanId: undefined,
                      })
                    }}
                    className={`group relative flex flex-col items-start justify-between p-3.5 border transition-all text-left rounded-none ${draftData.selectedServiceId === "custom"
                        ? "border-foreground bg-accent/40 ring-1 ring-foreground"
                        : "border-dashed border-border hover:border-foreground/50 hover:bg-muted/30"
                      }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="p-1.5 border border-border bg-background">
                        <Edit3 className="size-5 text-foreground" />
                      </div>
                      {draftData.selectedServiceId === "custom" && (
                        <CheckCircle2 className="size-4 text-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground md:text-sm">
                        Custom Service
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Enter manually
                      </div>
                    </div>
                  </button>
                </div>

                {/* Custom Name Field if Custom is Selected */}
                {draftData.selectedServiceId === "custom" && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <Label className="text-xs font-medium text-foreground md:text-sm">
                      Custom Service Name
                    </Label>
                    <Input
                      placeholder="e.g. Adobe Creative Cloud, Gym Membership"
                      value={draftData.service_name || ""}
                      onChange={(e) => updateDraft({ service_name: e.target.value })}
                      className="rounded-none text-sm"
                    />
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: SELECT PLAN & COST */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold tracking-tight text-foreground md:text-base">
                    Select a Plan for {draftData.service_name || "Subscription"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Choose tier pricing or define your custom cost & billing period.
                  </p>
                </div>

                {selectedTemplate ? (
                  <div className="space-y-2">
                    {selectedTemplate.plans.map((plan: ServicePlan) => {
                      const isSelected = draftData.selectedPlanId === plan.id
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => {
                            updateDraft({
                              selectedPlanId: plan.id,
                              cost: plan.cost,
                              plan_type: plan.plan_type,
                            })
                          }}
                          className={`w-full flex items-center justify-between p-3.5 border transition-all text-left rounded-none ${isSelected
                              ? "border-foreground bg-accent/40 ring-1 ring-foreground"
                              : "border-border hover:border-foreground/50 hover:bg-muted/30"
                            }`}
                        >
                          <div className="space-y-0.5">
                            <div className="text-xs font-semibold text-foreground md:text-sm">
                              {plan.name}
                            </div>
                            {plan.description && (
                              <div className="text-[11px] text-muted-foreground">
                                {plan.description}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-foreground md:text-base">
                              ₱{plan.cost.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                              / {plan.plan_type.toLowerCase()}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  /* Custom Plan Entry Form */
                  <div className="space-y-4 pt-1">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-foreground md:text-sm">
                        Subscription Cost (₱)
                      </Label>
                      <div className="relative">
                        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs text-muted-foreground">
                          ₱
                        </span>
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0.00"
                          className="pl-7 rounded-none text-sm"
                          value={draftData.cost || ""}
                          onChange={(e) => {
                            const val = e.target.value
                            updateDraft({ cost: val === "" ? 0 : Number(val) })
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-foreground md:text-sm">
                        Billing Cycle
                      </Label>
                      <Tabs
                        value={draftData.plan_type || "Monthly"}
                        onValueChange={(val) =>
                          updateDraft({ plan_type: val as "Weekly" | "Monthly" | "Annual" })
                        }
                      >
                        <TabsList variant="line" className="w-full rounded-none">
                          <TabsTrigger value="Weekly" className="rounded-none">Weekly</TabsTrigger>
                          <TabsTrigger value="Monthly" className="rounded-none">Monthly</TabsTrigger>
                          <TabsTrigger value="Annual" className="rounded-none">Annual</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: PAYMENT METHOD */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold tracking-tight text-foreground md:text-base">
                    Payment Method
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Select how this subscription is billed or paid.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2">
                  {PREDEFINED_PAYMENT_METHODS.map((pm) => {
                    const isSelected = draftData.payment_mode === pm.label
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => updateDraft({ payment_mode: pm.label })}
                        className={`flex flex-col items-start justify-between p-3 border transition-all text-left rounded-none ${isSelected
                            ? "border-foreground bg-accent/40 ring-1 ring-foreground"
                            : "border-border hover:border-foreground/50 hover:bg-muted/30"
                          }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1.5">
                          <div className="p-1 border border-border bg-background">
                            {pm.category === "card" ? (
                              <CreditCard className="size-4 text-foreground" />
                            ) : (
                              <Wallet className="size-4 text-foreground" />
                            )}
                          </div>
                          {isSelected && <Check className="size-3.5 text-foreground stroke-[3]" />}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground">
                            {pm.label}
                          </div>
                          {pm.description && (
                            <div className="text-[10px] text-muted-foreground line-clamp-1">
                              {pm.description}
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: FREE TRIAL DURATION */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold tracking-tight text-foreground md:text-base">
                    Free Trial Duration
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Does this subscription include a free trial period?
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2">
                  {PREDEFINED_TRIAL_DURATIONS.map((trial) => {
                    const isSelected = (draftData.selectedTrialDurationId || "none") === trial.id
                    return (
                      <button
                        key={trial.id}
                        type="button"
                        onClick={() => {
                          const isTrial = trial.days > 0
                          const endDate = isTrial
                            ? calculateTrialEndDate(new Date(), trial.days)
                            : undefined
                          updateDraft({
                            selectedTrialDurationId: trial.id,
                            is_trial: isTrial,
                            trial_end_date: endDate,
                          })
                        }}
                        className={`flex flex-col items-start justify-between p-3 border transition-all text-left rounded-none ${isSelected
                            ? "border-foreground bg-accent/40 ring-1 ring-foreground"
                            : "border-border hover:border-foreground/50 hover:bg-muted/30"
                          }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <Clock className="size-4 text-foreground" />
                          {isSelected && <Check className="size-3.5 text-foreground stroke-[3]" />}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground">
                            {trial.label}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {trial.description}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Custom Trial End Date Selection */}
                <div className="space-y-2 pt-3 border-t border-border">
                  <Label className="text-xs font-medium text-foreground md:text-sm">
                    Custom Trial End Date
                  </Label>
                  <DatePicker
                    value={draftData.trial_end_date ?? undefined}
                    onChange={(date) => {
                      updateDraft({
                        is_trial: !!date,
                        trial_end_date: date,
                        selectedTrialDurationId: date ? "custom" : "none",
                      })
                    }}
                  />
                </div>

                {draftData.is_trial && draftData.trial_end_date && (
                  <div className="p-3 border border-border bg-muted/20 text-xs space-y-1 rounded-none">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <Clock className="size-3.5 text-foreground" />
                      Trial End Date
                    </div>
                    <div className="text-muted-foreground">
                      Ends on:{" "}
                      <span className="font-medium text-foreground">
                        {draftData.trial_end_date.toLocaleDateString(undefined, {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: NEXT DUE DATE (Only if not calendar triggered) */}
            {currentStep === 5 && !isCalendarTriggered && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold tracking-tight text-foreground md:text-base">
                    Next Due Date
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Set your upcoming billing due date or mark as started today.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-foreground md:text-sm">
                      Next Due Date
                    </Label>
                    <DatePicker
                      value={draftData.next_due_date}
                      onChange={(date) => {
                        updateDraft({
                          next_due_date: date,
                          isStartedToday: false,
                        })
                      }}
                    />
                  </div>

                  {/* Started Today Checkbox */}
                  <div className="flex items-center gap-2.5 space-y-0 pt-2 border-t border-border">
                    <Checkbox
                      id="started-today-checkbox"
                      checked={!!draftData.isStartedToday}
                      onCheckedChange={(checked) => {
                        const isChecked = !!checked
                        if (isChecked) {
                          const todayDate = new Date()
                          updateDraft({
                            isStartedToday: true,
                            next_due_date: todayDate,
                            subscription_status: "paid",
                          })
                        } else {
                          const resetDate = defaultDate ? parseUtcToLocalDate(defaultDate) : undefined
                          updateDraft({
                            isStartedToday: false,
                            next_due_date: resetDate,
                            subscription_status: computeSubscriptionStatus(resetDate, false),
                          })
                        }
                      }}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <Label
                        htmlFor="started-today-checkbox"
                        className="text-xs sm:text-sm font-medium cursor-pointer"
                      >
                        Started today
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        Marks current cycle as Paid (auto-calculates next cycle date via database).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUMMARY CARD ON LAST STEP */}
            {currentStep === totalSteps && (
              <div className="mt-4 p-3.5 border border-border bg-card space-y-2 rounded-none">
                <div className="text-xs font-semibold text-foreground uppercase tracking-wide border-b border-border pb-1.5 flex items-center justify-between">
                  <span>Summary</span>
                  <span className="text-[10px] text-muted-foreground font-normal lowercase">
                    {draftData.plan_type} billing
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Service:</span>
                    <div className="font-semibold text-foreground">
                      {draftData.service_name || "Not specified"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cost:</span>
                    <div className="font-bold text-foreground">
                      ₱{Number(draftData.cost || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment Mode:</span>
                    <div className="font-medium text-foreground">
                      {draftData.payment_mode || "Not specified"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <div className="font-semibold text-foreground capitalize">
                      {formatStatusLabel(computeSubscriptionStatus(draftData.next_due_date, draftData.isStartedToday))}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trial:</span>
                    <div className="font-medium text-foreground">
                      {draftData.is_trial && draftData.trial_end_date
                        ? `Ends ${draftData.trial_end_date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                        : "None"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          {/* Footer Controls */}
          <CardFooter className="shrink-0 flex items-center justify-between border-t border-border p-4 bg-muted/10 gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentStep === 1 || isPending}
              onClick={prevStep}
              className="rounded-none text-xs"
            >
              <ChevronLeft className="size-3.5 mr-1" />
              Back
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={handleNext}
              className="rounded-none text-xs font-medium ml-auto"
            >
              {currentStep < totalSteps ? (
                <>
                  Next
                  <ChevronRight className="size-3.5 ml-1" />
                </>
              ) : isPending ? (
                "Adding..."
              ) : (
                "Confirm & Add"
              )}
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
