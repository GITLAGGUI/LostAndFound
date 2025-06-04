import { createClient } from '@/lib/supabase/client'

export interface UserData {
  id: string
  full_name: string
  avatar_url?: string
  phone?: string
  is_admin?: boolean
}

class UserService {
  private supabase = createClient()

  // Create or update user profile in Supabase
  async createUserProfile(userData: UserData) {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .upsert({
          id: userData.id,
          full_name: userData.full_name,
          avatar_url: userData.avatar_url,
          phone: userData.phone,
          is_admin: userData.is_admin || false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (error) {
        console.error('Supabase error creating profile:', error)
        return { success: false, error: error.message }
      }
      console.log('✅ User profile created/updated successfully')
      return { success: true, data }
    } catch (error) {
      console.error('Error creating user profile:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create profile' }
    }
  }

  // Google Sign In with Supabase
  async signInWithGoogle() {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Google sign in error:', error)
      throw new Error(error.message || 'Google sign in failed')
    }
  }

  // Email/Password Sign Up with Supabase
  async signUpWithEmail(email: string, password: string, fullName: string, phone?: string) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone
          }
        }
      })

      if (error) throw error

      // Profile is automatically created by database trigger
      console.log('✅ User created successfully - profile created automatically')

      return { success: true }
    } catch (error: any) {
      console.error('Email sign up error:', error)
      
      if (error.message === 'User already registered') {
        throw new Error('An account with this email already exists. Please try signing in instead.')
      }
      
      throw new Error(error.message || 'Sign up failed')
    }
  }

  // Email/Password Sign In with Supabase
  async signInWithEmail(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Email sign in error:', error)
      
      if (error.message === 'Invalid login credentials') {
        throw new Error('Invalid email or password.')
      }
      
      throw new Error(error.message || 'Sign in failed')
    }
  }

  // Get user profile from Supabase
  async getUserProfile(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, data: null, error: 'No profile found' }
        }
        throw error
      }
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return { success: false, data: null, error: error instanceof Error ? error.message : 'Failed to fetch profile' }
    }
  }

  // Sign out with Supabase
  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut()
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Sign out error:', error)
      throw error instanceof Error ? error : new Error('Sign out failed')
    }
  }

  // Make user admin (for initial setup)
  async makeUserAdmin(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .update({ is_admin: true, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error making user admin:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to make user admin' }
    }
  }
}

export const userService = new UserService()
export default userService