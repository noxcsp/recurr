import { z } from "zod"

export const subscriptionSchema = z
  .object({
    service_name: z.string().min(1, "Service name is required."),
    cost: z
      .union([z.number(), z.string()])
      .transform((val) => (val === "" ? undefined : Number(val)))
      .pipe(
        z
          .number({ message: "Cost must be a positive number." })
          .positive("Cost must be a positive number.")
      ),
    plan_type: z.enum(["Weekly", "Monthly", "Annual"]),
    payment_mode: z.string().min(1, "Payment mode is required."),
    next_due_date: z.date({ error: "Please select a due date." }),
    is_trial: z.boolean(),
    trial_end_date: z.date().optional().nullable(),
    subscription_status: z.enum(["unpaid", "paid", "overdue"]),
  })
  .refine(
    (data) => {
      if (data.is_trial && !data.trial_end_date) {
        return false
      }
      return true
    },
    {
      message: "Please select a trial end date.",
      path: ["trial_end_date"],
    }
  )

export type SubscriptionFormValues = z.input<typeof subscriptionSchema>


