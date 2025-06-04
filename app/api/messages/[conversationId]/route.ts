import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

// GET /api/messages/[conversationId] - Get messages for a specific conversation
export async function GET(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const { conversationId } = await params
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is part of this conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, user1_id, user2_id')
      .eq('id', conversationId)
      .single()

    if (!conversation || (conversation.user1_id !== user.id && conversation.user2_id !== user.id)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Get messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        message_type,
        created_at,
        is_read,
        sender_id,
        sender:user_profiles!sender_id(full_name, email),
        receiver:user_profiles!receiver_id(full_name, email)
      `)
      .or(`and(sender_id.eq.${conversation.user1_id},receiver_id.eq.${conversation.user2_id}),and(sender_id.eq.${conversation.user2_id},receiver_id.eq.${conversation.user1_id})`)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Mark messages as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', user.id)
      .neq('sender_id', user.id)

    return NextResponse.json({
      success: true,
      messages: messages || []
    })

  } catch (error: any) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch messages'
    }, { status: 500 })
  }
}