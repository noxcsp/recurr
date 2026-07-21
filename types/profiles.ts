export interface Profile {
  id: string
  updated_at: string
  fcm_token: string | null
  timezone: string
  last_swipeoff_date: string | null
}
