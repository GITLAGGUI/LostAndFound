'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, Send, X, Users, Plus, Search, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  sender: {
    full_name: string
    email: string
  }
  receiver: {
    full_name: string
    email: string
  }
}

interface Conversation {
  id: string
  otherUser: {
    id: string
    full_name: string
    email: string
  }
  lastMessage: string
  lastMessageAt: string
  reportId?: string
  foundReportId?: string
}

interface MessagingSystemProps {
  className?: string
}

export function MessagingSystem({ className }: MessagingSystemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [view, setView] = useState<'conversations' | 'chat'>('conversations')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      loadConversations()
    }
  }, [isOpen])

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id)
    }
  }, [activeConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/messages')
      const data = await response.json()
      
      if (data.success) {
        setConversations(data.conversations)
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Error loading conversations:', error)
      toast.error('Failed to load conversations')
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/messages/${conversationId}`)
      const data = await response.json()
      
      if (data.success) {
        setMessages(data.messages)
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Error loading messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: getOtherUserId(),
          content: newMessage,
          reportId: activeConversation.reportId,
          foundReportId: activeConversation.foundReportId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessages(prev => [...prev, data.message])
        setNewMessage('')
        loadConversations() // Refresh conversations list
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    }
  }

  const getOtherUserId = () => {
    if (!activeConversation) return ''
    return activeConversation.otherUser.id
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getUserInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50",
          "bg-blue-600 hover:bg-blue-700 text-white",
          className
        )}
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <Card className={cn(
      "fixed bottom-6 right-6 w-96 h-[500px] shadow-xl z-50 flex flex-col",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between py-3 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          {view === 'chat' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setView('conversations')
                setActiveConversation(null)
              }}
              className="text-white hover:bg-blue-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <MessageCircle className="h-5 w-5" />
          <CardTitle className="text-lg">
            {view === 'conversations' ? 'Messages' : activeConversation?.otherUser.full_name || 'Chat'}
          </CardTitle>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-blue-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {view === 'conversations' ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-10"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <p>No conversations yet</p>
                  <p className="text-xs">Contact item owners to start chatting</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg cursor-pointer"
                      onClick={() => {
                        setActiveConversation(conv)
                        setView('chat')
                      }}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getUserInitials(conv.otherUser.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {conv.otherUser.full_name || conv.otherUser.email}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.lastMessage}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2",
                      message.sender_id === user?.id ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-start gap-2 max-w-[80%]",
                        message.sender_id === user?.id ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={cn(
                          message.sender_id === user?.id ? "bg-blue-600 text-white" : "bg-gray-200"
                        )}>
                          {getUserInitials(message.sender.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm",
                          message.sender_id === user?.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        )}
                      >
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        <div className={cn(
                          "text-xs mt-1",
                          message.sender_id === user?.id ? "text-blue-100" : "text-gray-500"
                        )}>
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gray-200">
                        {getUserInitials(activeConversation?.otherUser.full_name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg px-3 py-2 text-sm bg-gray-100">
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 bg-gray-500 rounded-full animate-pulse"></div>
                        <div className="h-2 w-2 bg-gray-500 rounded-full animate-pulse delay-100"></div>
                        <div className="h-2 w-2 bg-gray-500 rounded-full animate-pulse delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !newMessage.trim()}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}