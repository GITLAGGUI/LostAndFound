import { createClient } from '@/lib/supabase/client';

/**
 * Helper function to safely load conversations with proper auth checking
 * This will prevent the "Unauthorized" console errors when user is not authenticated
 */
export async function safelyLoadConversations() {
  try {
    const supabase = createClient();
    
    // Check if user is authenticated first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('Auth check failed:', authError.message);
      return { conversations: [], error: null };
    }
    
    // If no user is logged in, return empty array without error
    if (!user) {
      return { conversations: [], error: null };
    }
    
    // User is authenticated, proceed to load conversations
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        id,
        user1_id,
        user2_id,
        created_at,
        last_message_at,
        user1:user_profiles!user1_id(id, full_name, avatar_url),
        user2:user_profiles!user2_id(id, full_name, avatar_url),
        last_message:messages(content, created_at)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching conversations:', error);
      return { conversations: [], error: error.message };
    }

    // Format conversations for the client
    const formattedConversations = conversations?.map(conv => {
      const otherUser = conv.user1_id === user.id ? conv.user2 : conv.user1;
      
      return {
        id: conv.id,
        otherUser: {
          id: otherUser.id,
          name: otherUser.full_name || 'Unknown User',
          avatar: otherUser.avatar_url
        },
        lastMessageAt: conv.last_message_at,
        lastMessage: conv.last_message?.[0]?.content || '',
        lastMessageTime: conv.last_message?.[0]?.created_at
      };
    });

    return { 
      conversations: formattedConversations || [],
      error: null
    };
  } catch (error) {
    console.error('Failed to load conversations:', error);
    return { 
      conversations: [], 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Function to get messages for a specific conversation with auth checking
 */
export async function safelyLoadConversationMessages(conversationId) {
  try {
    if (!conversationId) {
      return { messages: [], error: 'Conversation ID is required' };
    }
    
    const supabase = createClient();
    
    // Check authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('Auth check failed or no user found');
      return { messages: [], error: null };
    }
    
    // Verify user is part of this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, user1_id, user2_id')
      .eq('id', conversationId)
      .single();
    
    if (convError || !conversation) {
      console.error('Conversation not found:', convError);
      return { messages: [], error: 'Conversation not found' };
    }
    
    if (conversation.user1_id !== user.id && conversation.user2_id !== user.id) {
      return { messages: [], error: 'Not authorized to view this conversation' };
    }
    
    // Get messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id, 
        content, 
        created_at,
        message_type,
        sender_id,
        sender:user_profiles!sender_id(id, full_name, avatar_url)
      `)
      .or(`and(sender_id.eq.${conversation.user1_id},receiver_id.eq.${conversation.user2_id}),and(sender_id.eq.${conversation.user2_id},receiver_id.eq.${conversation.user1_id})`)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching messages:', error);
      return { messages: [], error: error.message };
    }
    
    // Mark messages as read
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('receiver_id', user.id)
      .eq('read', false);
    
    return { 
      messages: messages || [],
      error: null
    };
  } catch (error) {
    console.error('Failed to load conversation messages:', error);
    return { 
      messages: [], 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}