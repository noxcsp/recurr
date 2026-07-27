import type { Database } from "@/types/supabase"

export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"]

