export interface MoodEntry {
  id: string
  user_id: string
  score: number
  comment: string | null
  entry_time: string
  created_at: string
}

export interface JournalEntry {
  id: string
  user_id: string
  title: string | null
  content: string
  entry_date: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  display_name: string | null
  is_admin: boolean
  created_at: string
}

export interface DayStats {
  date: string
  avg: number
  moods: MoodEntry[]
  journal?: JournalEntry
}
