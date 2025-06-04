'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { safelyLoadConversations } from '@/lib/conversation-helpers'
import { MessageSquare, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

/**
 * This component safely loads and displays user conversations
 * It uses the safelyLoadConversations helper to prevent unauthorized errors
 */
export default function ConversationsList() {
  const [conversations, setConversations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // This function replaces the problematic loadConversations function
  // that was causing the Unauthorized error
  const loadConversations = async () => {
    try {
      setIsLoading(true)
      const { conversations, error } = await safelyLoadConversations()
      
      if (error) {
        console.error('Error loading conversations:', error)
        setError(error)
        // Don't show error toast if it's an auth error - this is handled gracefully
        if (!error.includes('Unauthorized')) {
          toast.error('Could not load conversations')
        }
      } else {
        setConversations(conversations)
        setError(null)
      }
    } catch (err) {
      console.error('Failed to load conversations:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadConversations()
    
    // Set up polling to refresh conversations
    const intervalId = setInterval(loadConversations, 30000) // Every 30 seconds
    
    return () => clearInterval(intervalId)
  }, [])

  const handleConversationClick = (conversationId: string) => {
    router.push(`/messages/${conversationId}`)
  }

  const renderConversationTime = (timestamp: string | Date | null) => {
    if (!timestamp) return 'No messages'
    
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch (e) {
      return 'Unknown time'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Messages
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          // Skeleton loaders while loading
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              {error === 'Unauthorized' 
                ? 'Please sign in to view your messages' 
                : 'Could not load conversations'}
            </p>
            {error === 'Unauthorized' && (
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => router.push('/signin')}
              >
                Sign In
              </Button>
            )}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No conversations yet</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => router.push('/listings')}
            >
              Browse Listings
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map(convo => (
              <div 
                key={convo.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                onClick={() => handleConversationClick(convo.id)}
              >
                <Avatar>
                  <AvatarImage src={convo.otherUser.avatar || '/placeholder-user.jpg'} />
                  <AvatarFallback>{convo.otherUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{convo.otherUser.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{convo.lastMessage || 'No messages'}</p>
                </div>
                <div className="text-xs text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {renderConversationTime(convo.lastMessageTime || convo.lastMessageAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}