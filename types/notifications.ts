import type { Database } from "@/types/supabase"

export type Notification = Database["public"]["Tables"]["notifications"]["Row"]

