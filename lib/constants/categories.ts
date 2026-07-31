export const SUBSCRIPTION_CATEGORIES = [
  "Entertainment",
  "Music",
  "Cloud Storage",
  "Productivity",
  "Gaming",
  "Utilities",
  "Finance",
  "Software & SaaS",
  "Health & Fitness",
  "News & Media",
  "Other",
] as const

export type SubscriptionCategory = (typeof SUBSCRIPTION_CATEGORIES)[number]
