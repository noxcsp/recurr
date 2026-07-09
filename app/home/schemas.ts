import { z } from "zod"

export const subscriptionSchema = z.object({
  service_name: z.string().min(1, "Service name is required."),
  cost: z.number().positive("Cost must be a positive number."),
  plan_type: z.enum(["Weekly", "Monthly", "Annual"]),
  payment_mode: z.string().min(1, "Payment mode is required."),
  next_due_date: z.date({ error: "Please select a due date." }),
  is_trial: z.boolean(),
})

export type SubscriptionInput = z.infer<typeof subscriptionSchema>
