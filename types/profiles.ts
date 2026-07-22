import type { Database } from "@/types/supabase"

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]

