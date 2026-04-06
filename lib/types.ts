export interface MoodEntry {
  id: string
  user_id: string
  score: number
  comment: string | null
  created_at: string
}

export interface Profile {
  id: string
  email: string
  display_name: string | null
  is_admin: boolean
  created_at: string
}
