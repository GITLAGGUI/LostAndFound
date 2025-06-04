import { createClient } from '@/lib/supabase/client'

export async function checkSupabaseConnection() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Supabase auth error:', error)
      return { success: false, error: error.message }
    }
    
    // Try to make a simple query
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('count', { count: 'exact' })
      .limit(1)
    
    if (testError) {
      console.error('Supabase query error:', testError)
      return { success: false, error: testError.message }
    }
    
    return { success: true, message: 'Supabase connection working' }
  } catch (error) {
    console.error('Supabase connection test failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}