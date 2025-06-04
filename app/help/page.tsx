'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Bot, User, Send, HelpCircle, Brain, MessageSquare, Search, Upload, Shield, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const quickQuestions = [
  {
    icon: Users,
    title: "How to sign up?",
    question: "How do I create an account on FindIt?"
  },
  {
    icon: Upload,
    title: "How to report?",
    question: "How do I report a lost item on FindIt?"
  },
  {
    icon: Search,
    title: "How to search?",
    question: "How do I search for lost items on FindIt?"
  },
  {
    icon: MessageSquare,
    title: "How to contact?",
    question: "How do I contact someone about a found item?",
    tooltip: "Learn how to safely contact item reporters"
  },
  {
    icon: Brain,
    title: "AI matching?",
    question: "How does the AI matching system work?"
  },
  {
    icon: Shield,
    title: "Safety tips?",
    question: "What safety precautions should I take when meeting someone?"
  }
]

export default function HelpPage() {
  // Use a static timestamp for initial state to avoid hydration mismatch
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant for FindIt. I can help you with anything related to using our lost and found platform. Ask me about signing up, reporting items, searching, messaging, or any other features!',
      timestamp: new Date('2025-06-04T00:00:00Z')
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async (content: string) => {
    if (!content.trim()) return

    // Generate id and timestamp only on the client
    const now = new Date()
    const userMessage: Message = {
      id: now.getTime().toString(),
      role: 'user',
      content,
      timestamp: now
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/unified-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          preferredProvider: 'openrouter' // You can also use 'github' to prefer GitHub AI
        }),
      })

      const data = await response.json()

      if (data.success) {
        const now2 = new Date()
        const assistantMessage: Message = {
          id: (now2.getTime() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: now2
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Sorry, I couldn\'t process your request. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuestionClick = (question: string) => {
    sendMessage(question)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputMessage)
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Brain className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">AI Help Center</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Get instant answers to your questions about FindIt
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Questions */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Quick Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickQuestions.map((item, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start h-auto p-3 text-left overflow-hidden"
                        onClick={() => handleQuestionClick(item.question)}
                      >
                        <item.icon className="h-4 w-4 mr-2 shrink-0" />
                        <div className="w-full overflow-hidden">
                          <div className="font-medium text-sm">{item.title}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-full">
                            {item.question}
                          </div>
                        </div>
                      </Button>
                    </TooltipTrigger>
                    {item.tooltip && (
                      <TooltipContent side="right">
                        <p>{item.tooltip}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                AI Assistant
                <Badge variant="secondary" className="ml-auto">
                  Online
                </Badge>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-start gap-2 max-w-[80%]",
                          message.role === 'user' ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            message.role === 'user' 
                              ? "bg-blue-600 text-white" 
                              : "bg-gray-100"
                          )}
                        >
                          {message.role === 'user' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>
                        <div
                          className={cn(
                            "rounded-lg px-4 py-2 text-sm",
                            message.role === 'user'
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          )}
                        >
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          <div className={cn(
                            "text-xs mt-1 opacity-70",
                            message.role === 'user' ? "text-blue-100" : "text-gray-500"
                          )}>
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex items-start gap-2 max-w-[80%]">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="rounded-lg px-4 py-2 text-sm bg-gray-100">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-100"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-200"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <Separator />
              
              <form onSubmit={handleSubmit} className="p-4">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask me anything about FindIt..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isLoading || !inputMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}