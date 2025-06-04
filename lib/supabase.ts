import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for our database tables
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          full_name: string
          avatar_url: string | null
          phone: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          avatar_url?: string | null
          phone?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          avatar_url?: string | null
          phone?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      lost_items: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          category: 'item' | 'person' | 'pet'
          subcategory: string
          location_lost: string
          date_lost: string
          images: string[]
          contact_info: string
          reward: number | null
          status: 'active' | 'found' | 'cancelled'
          ai_description: string | null
          color: string | null
          size: string | null
          brand: string | null
          distinctive_features: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          category: 'item' | 'person' | 'pet'
          subcategory: string
          location_lost: string
          date_lost: string
          images?: string[]
          contact_info: string
          reward?: number | null
          status?: 'active' | 'found' | 'cancelled'
          ai_description?: string | null
          color?: string | null
          size?: string | null
          brand?: string | null
          distinctive_features?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          category?: 'item' | 'person' | 'pet'
          subcategory?: string
          location_lost?: string
          date_lost?: string
          images?: string[]
          contact_info?: string
          reward?: number | null
          status?: 'active' | 'found' | 'cancelled'
          ai_description?: string | null
          color?: string | null
          size?: string | null
          brand?: string | null
          distinctive_features?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      found_items: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          category: 'item' | 'person' | 'pet'
          subcategory: string
          location_found: string
          date_found: string
          images: string[]
          contact_info: string
          status: 'available' | 'claimed' | 'returned'
          ai_description: string | null
          color: string | null
          size: string | null
          brand: string | null
          distinctive_features: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          category: 'item' | 'person' | 'pet'
          subcategory: string
          location_found: string
          date_found: string
          images?: string[]
          contact_info: string
          status?: 'available' | 'claimed' | 'returned'
          ai_description?: string | null
          color?: string | null
          size?: string | null
          brand?: string | null
          distinctive_features?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          category?: 'item' | 'person' | 'pet'
          subcategory?: string
          location_found?: string
          date_found?: string
          images?: string[]
          contact_info?: string
          status?: 'available' | 'claimed' | 'returned'
          ai_description?: string | null
          color?: string | null
          size?: string | null
          brand?: string | null
          distinctive_features?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}