import { type SubscriptionFormValues } from "@/lib/validations/subscription"

export interface ServicePlan {
  id: string
  name: string
  cost: number
  plan_type: "Weekly" | "Monthly" | "Annual"
  description?: string
}

export interface SubscriptionTemplate {
  id: string
  service_name: string
  category: string
  iconName?: string
  color?: string
  plans: ServicePlan[]
  defaultPaymentMode?: string
}

export const PREDEFINED_SUBSCRIPTIONS: SubscriptionTemplate[] = [
  {
    id: "netflix",
    service_name: "Netflix",
    category: "Entertainment",
    plans: [
      { id: "mobile", name: "Mobile", cost: 149, plan_type: "Monthly", description: "Standard definition, 1 mobile screen" },
      { id: "basic", name: "Basic", cost: 249, plan_type: "Monthly", description: "720p, 1 screen" },
      { id: "standard", name: "Standard", cost: 399, plan_type: "Monthly", description: "1080p, 2 screens" },
      { id: "premium", name: "Premium", cost: 549, plan_type: "Monthly", description: "4K + HDR, 4 screens" },
    ],
  },
  {
    id: "spotify",
    service_name: "Spotify",
    category: "Music",
    plans: [
      { id: "individual", name: "Individual", cost: 149, plan_type: "Monthly", description: "1 account, ad-free music" },
      { id: "duo", name: "Duo", cost: 199, plan_type: "Monthly", description: "2 accounts under one roof" },
      { id: "family", name: "Family", cost: 239, plan_type: "Monthly", description: "Up to 6 accounts" },
      { id: "student", name: "Student", cost: 75, plan_type: "Monthly", description: "Discount for eligible university students" },
    ],
  },
  {
    id: "icloud",
    service_name: "iCloud+",
    category: "Cloud Storage",
    plans: [
      { id: "50gb", name: "50 GB", cost: 49, plan_type: "Monthly", description: "Basic cloud storage" },
      { id: "200gb", name: "200 GB", cost: 149, plan_type: "Monthly", description: "Great for family sharing" },
      { id: "2tb", name: "2 TB", cost: 499, plan_type: "Monthly", description: "High volume storage" },
      { id: "6tb", name: "6 TB", cost: 1490, plan_type: "Monthly", description: "Pro tier storage" },
    ],
  },
  {
    id: "youtube-premium",
    service_name: "YouTube Premium",
    category: "Entertainment",
    plans: [
      { id: "individual", name: "Individual", cost: 159, plan_type: "Monthly", description: "Ad-free videos & Music" },
      { id: "family", name: "Family", cost: 239, plan_type: "Monthly", description: "Up to 5 family members" },
      { id: "student", name: "Student", cost: 95, plan_type: "Monthly", description: "For university students" },
      { id: "annual", name: "Individual (Annual)", cost: 1590, plan_type: "Annual", description: "Save with annual prepay" },
    ],
  },
  {
    id: "disney-plus",
    service_name: "Disney+",
    category: "Entertainment",
    plans: [
      { id: "basic", name: "Basic", cost: 249, plan_type: "Monthly", description: "Full HD, 2 screens" },
      { id: "premium-monthly", name: "Premium (Monthly)", cost: 369, plan_type: "Monthly", description: "4K UHD, 4 screens" },
      { id: "premium-annual", name: "Premium (Annual)", cost: 2990, plan_type: "Annual", description: "4K UHD annual plan" },
    ],
  },
  {
    id: "chatgpt",
    service_name: "ChatGPT Plus",
    category: "Productivity",
    plans: [
      { id: "plus", name: "Plus", cost: 1150, plan_type: "Monthly", description: "Access to GPT-4o, DALL-E, advanced voice" },
      { id: "team", name: "Team", cost: 1450, plan_type: "Monthly", description: "Collab workspace with higher limits" },
    ],
  },
  {
    id: "xbox-game-pass",
    service_name: "Xbox Game Pass",
    category: "Gaming",
    plans: [
      { id: "pc", name: "PC Game Pass", cost: 175, plan_type: "Monthly", description: "100+ PC games & EA Play" },
      { id: "core", name: "Game Pass Core", cost: 260, plan_type: "Monthly", description: "Online multiplayer & select library" },
      { id: "ultimate", name: "Game Pass Ultimate", cost: 490, plan_type: "Monthly", description: "Console, PC, and Cloud gaming" },
    ],
  },
]

export interface PaymentMethodOption {
  id: string
  label: string
  category: "card" | "paypal" | "ewallet" | "bank" | "other"
  description?: string
}

export const PREDEFINED_PAYMENT_METHODS: PaymentMethodOption[] = [
  { id: "card-debit-credit", label: "Debit / Credit Card", category: "card", description: "Visa, Mastercard, AMEX" },
  { id: "paypal", label: "PayPal", category: "paypal", description: "Digital PayPal balance or linked account" },
  { id: "gcash", label: "GCash", category: "ewallet", description: "Philippine e-wallet" },
  { id: "maya", label: "Maya", category: "ewallet", description: "Digital wallet & savings card" },
  { id: "apple-pay", label: "Apple Pay", category: "ewallet", description: "Apple ecosystem checkout" },
  { id: "google-pay", label: "Google Pay", category: "ewallet", description: "Google checkout" },
  { id: "bank-transfer", label: "Bank Transfer", category: "bank", description: "Direct online bank transfer" },
  { id: "other", label: "Cash / Other", category: "other", description: "Custom payment method" },
]

export interface FreeTrialOption {
  id: string
  label: string
  days: number
  description: string
}

export const PREDEFINED_TRIAL_DURATIONS: FreeTrialOption[] = [
  { id: "none", label: "No Trial", days: 0, description: "Start regular billing immediately" },
  { id: "3days", label: "3 Days", days: 3, description: "3-day introductory trial" },
  { id: "7days", label: "7 Days", days: 7, description: "1-week free trial" },
  { id: "14days", label: "14 Days", days: 14, description: "2-week free trial" },
  { id: "1month", label: "1 Month", days: 30, description: "30-day full month trial" },
  { id: "3months", label: "3 Months", days: 90, description: "90-day extended trial" },
  { id: "6months", label: "6 Months", days: 180, description: "Half-year free trial" },
  { id: "1year", label: "1 Year", days: 365, description: "Full annual free trial" },
]

export function calculateTrialEndDate(startDate: Date | undefined, days: number): Date | undefined {
  if (days <= 0) return undefined
  const baseDate = startDate ? new Date(startDate) : new Date()
  const result = new Date(baseDate)
  result.setDate(result.getDate() + days)
  return result
}
