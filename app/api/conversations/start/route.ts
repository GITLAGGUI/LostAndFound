import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { receiverId, itemId, itemType, message } = await request.json()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Check if user is authenticated with helpful error message
    if (!user) {
      console.error('Authentication required: User is not logged in');
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Please login to access this feature' 
      }, { status: 401 })
    }

    if (!receiverId || !message) {
      return NextResponse.json({ 
        success: false, 
        error: 'Receiver ID and message are required' 
      }, { status: 400 })
    }

    // Check if conversation already exists
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${receiverId}),and(user1_id.eq.${receiverId},user2_id.eq.${user.id})`)
      .single()

    let conversationId = existingConv?.id

    // Create new conversation if it doesn't exist
    if (!conversationId) {
      const conversationData: any = {
        user1_id: user.id,
        user2_id: receiverId,
      }

      // Add item reference if provided
      if (itemId && itemType) {
        if (itemType === 'lost') {
          conversationData.report_id = itemId
        } else if (itemType === 'found') {
          conversationData.found_report_id = itemId
        }
      }

      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert(conversationData)
        .select('id')
        .single()

      if (convError) {
        console.error('Conversation creation error:', convError)
        throw convError
      }
      
      conversationId = newConv.id
    }

    // Insert the initial message
    const messageData: any = {
      sender_id: user.id,
      receiver_id: receiverId,
      content: message,
      message_type: 'text'
    }

    // Add item reference to message if provided
    if (itemId && itemType) {
      if (itemType === 'lost') {
        messageData.report_id = itemId
      } else if (itemType === 'found') {
        messageData.found_report_id = itemId
      }
    }

    const { data: newMessage, error: msgError } = await supabase
      .from('messages')
      .insert(messageData)
      .select(`
        id,
        content,
        message_type,
        created_at,
        sender:user_profiles!sender_id(id, full_name, email)
      `)
      .single()

    if (msgError) {
      console.error('Message creation error:', msgError)
      throw msgError
    }

    return NextResponse.json({
      success: true,
      conversationId,
      message: newMessage
    })

  } catch (error: any) {
    console.error('Start conversation error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to start conversation'
    }, { status: 500 })
  }
}