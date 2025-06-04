import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: Request) {
  try {
    const { setupKey } = await request.json()
    const supabase = createClient()
    
    // Simple setup key for initial admin creation
    // In production, this should be removed after initial setup
    if (setupKey !== 'SETUP_ADMIN_2024') {
      return NextResponse.json(
        { success: false, error: 'Invalid setup key' },
        { status: 401 }
      )
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Make user admin
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ 
        is_admin: true, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Admin privileges granted successfully',
      data
    })

  } catch (error: any) {
    console.error('Admin setup error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to setup admin'
      },
      { status: 500 }
    )
  }
}