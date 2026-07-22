export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  is_read: boolean
  subscription_id: string | null
  created_at: string
}
