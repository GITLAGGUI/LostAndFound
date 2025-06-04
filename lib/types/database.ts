export interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  phone?: string
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface LostItem {
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
  reward?: number
  status: 'active' | 'found' | 'cancelled'
  ai_description?: string
  color?: string
  size?: string
  brand?: string
  distinctive_features?: string
  created_at: string
  updated_at: string
}

export interface FoundItem {
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
  ai_description?: string
  color?: string
  size?: string
  brand?: string
  distinctive_features?: string
  created_at: string
  updated_at: string
}

export interface Match {
  id: string
  lost_item_id: string
  found_item_id: string
  similarity_score: number
  match_type: 'ai_visual' | 'ai_description' | 'user_reported'
  status: 'pending' | 'confirmed' | 'rejected'
  created_at: string
}

export interface Conversation {
  id: string
  match_id: string
  participants: string[]
  messages: Message[]
  status: 'active' | 'resolved' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  type: 'text' | 'image' | 'system'
  timestamp: string
}