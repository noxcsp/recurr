export interface Subscription {
  id: string
  user_id: string
  service_name: string
  cost: number
  plan_type: "Weekly" | "Monthly" | "Annual"
  payment_mode: string
  next_due_date: string
  is_trial: boolean
  trial_end_date?: string | null
  created_at: string
  updated_at: string
  subscription_status: "unpaid" | "paid" | "overdue"
}
