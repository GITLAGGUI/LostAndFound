import { createClient } from '../supabase/client'
import { LostItem, FoundItem, UserProfile, Match } from '../types/database'

export class DatabaseService {
  private supabase = createClient()

  // User Profile Operations
  async createUserProfile(profile: Partial<UserProfile>) {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .insert([profile])
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
    return data
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Lost Items Operations
  async createLostItem(item: Partial<LostItem>) {
    const { data, error } = await this.supabase
      .from('lost_items')
      .insert([{
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getLostItems(filters?: { category?: string; status?: string }) {
    let query = this.supabase
      .from('lost_items')
      .select(`
        *,
        user_profiles (
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async getLostItemById(id: string): Promise<LostItem | null> {
    const { data, error } = await this.supabase
      .from('lost_items')
      .select(`
        *,
        user_profiles (
          full_name,
          avatar_url,
          phone
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching lost item:', error)
      return null
    }
    return data
  }

  // Found Items Operations
  async createFoundItem(item: Partial<FoundItem>) {
    const { data, error } = await this.supabase
      .from('found_items')
      .insert([{
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getFoundItems(filters?: { category?: string; status?: string }) {
    let query = this.supabase
      .from('found_items')
      .select(`
        *,
        user_profiles (
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async getFoundItemById(id: string): Promise<FoundItem | null> {
    const { data, error } = await this.supabase
      .from('found_items')
      .select(`
        *,
        user_profiles (
          full_name,
          avatar_url,
          phone
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching found item:', error)
      return null
    }
    return data
  }

  // Match Operations
  async createMatch(match: Partial<Match>) {
    const { data, error } = await this.supabase
      .from('matches')
      .insert([{
        ...match,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getMatches(userId?: string) {
    let query = this.supabase
      .from('matches')
      .select(`
        *,
        lost_items (*),
        found_items (*)
      `)
      .order('created_at', { ascending: false })

    if (userId) {
      // Fix the query syntax by using separate conditions
      query = query.or(`lost_item_id.in.(select id from lost_items where user_id.eq.${userId}),found_item_id.in.(select id from found_items where user_id.eq.${userId})`)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  // Search and AI Operations
  async findSimilarItems(
    description: string,
    category: string,
    type: 'lost' | 'found'
  ) {
    const tableName = type === 'lost' ? 'lost_items' : 'found_items'
    
    const { data, error } = await this.supabase
      .from(tableName)
      .select('*')
      .eq('category', category)
      .eq('status', type === 'lost' ? 'active' : 'available')
      .textSearch('description', description)

    if (error) throw error
    return data || []
  }

  // Analytics for Admin Dashboard
  async getDashboardStats() {
    const [lostItems, foundItems, matches, users] = await Promise.all([
      this.supabase.from('lost_items').select('id, status, category, created_at').order('created_at'),
      this.supabase.from('found_items').select('id, status, category, created_at').order('created_at'),
      this.supabase.from('matches').select('id, status, created_at').order('created_at'),
      this.supabase.from('user_profiles').select('id, created_at').order('created_at')
    ])

    return {
      lostItems: lostItems.data || [],
      foundItems: foundItems.data || [],
      matches: matches.data || [],
      users: users.data || []
    }
  }

  // File upload helper
  async uploadImage(file: File, bucket: string = 'item-images'): Promise<string | null> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(fileName, file)

    if (error) {
      console.error('Error uploading file:', error)
      return null
    }

    const { data: { publicUrl } } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return publicUrl
  }
}