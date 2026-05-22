import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  username: string
  display_name: string
  bio?: string
  city?: string
  country?: string
  gender?: string
  looking_for?: string[]
  instruments?: string[]
  music_genres?: string[]
  avatar_url?: string
  is_online?: boolean
  social_soundcloud?: string
  social_instagram?: string
  social_youtube?: string
  social_linkedin?: string
  social_facebook?: string
  social_twitter?: string
  social_tiktok?: string
  social_email_public?: string
  show_socials?: boolean
  show_location?: boolean
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'emoji' | 'wizz' | 'gif' | 'system'
  is_read: boolean
  created_at: string
}

export type SalonMessage = {
  id: string
  salon_id: string
  sender_id: string
  content: string
  message_type: string
  ia_score: number
  created_at: string
  profiles?: Profile
}
