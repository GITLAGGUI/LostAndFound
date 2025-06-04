import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

// GET /api/messages - Get all conversations for a user
export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        id,
        user1_id,
        user2_id,
        report_id,
        found_report_id,
        last_message_at,
        created_at,
        user1:user_profiles!user1_id(id, full_name, email),
        user2:user_profiles!user2_id(id, full_name, email),
        last_message:messages(content, created_at)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false })

    if (error) throw error

    // Format conversations for the client
    const formattedConversations = conversations?.map(conv => {
      const otherUser = conv.user1_id === user.id ? conv.user2 : conv.user1
      return {
        id: conv.id,
        otherUser,
        reportId: conv.report_id,
        foundReportId: conv.found_report_id,
        lastMessageAt: conv.last_message_at,
        lastMessage: conv.last_message?.[0]?.content || '',
        createdAt: conv.created_at
      }
    })

    return NextResponse.json({
      success: true,
      conversations: formattedConversations || []
    })

  } catch (error: any) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch conversations'
    }, { status: 500 })
  }
}

// POST /api/messages - Create a new conversation or send a message
export async function POST(request: Request) {
  try {
    const { receiverId, reportId, foundReportId, content, messageType = 'text' } = await request.json()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Create or get existing conversation
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${receiverId}),and(user1_id.eq.${receiverId},user2_id.eq.${user.id})`)
      .single()

    let conversationId = existingConv?.id

    if (!conversationId) {
      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          user1_id: user.id,
          user2_id: receiverId,
          report_id: reportId,
          found_report_id: foundReportId
        })
        .select('id')
        .single()

      if (convError) throw convError
      conversationId = newConv.id
    }

    // Insert message
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        report_id: reportId,
        found_report_id: foundReportId,
        content,
        message_type: messageType
      })
      .select(`
        id,
        content,
        message_type,
        created_at,
        sender:user_profiles!sender_id(full_name, email)
      `)
      .single()

    if (msgError) throw msgError

    return NextResponse.json({
      success: true,
      message,
      conversationId
    })

  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to send message'
    }, { status: 500 })
  }
}