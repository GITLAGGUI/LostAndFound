'use client'

import ConversationsList from '@/components/conversations-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MessageSquare } from 'lucide-react'

export default function MessagesPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="md:col-span-1">
          <ConversationsList />
        </div>
        
        {/* Welcome/Empty State */}
        <div className="md:col-span-2">
          <Card className="h-[600px] flex flex-col items-center justify-center">
            <CardContent className="text-center pt-6">
              <div className="mb-4 p-4 bg-primary/10 rounded-full inline-flex">
                <MessageSquare className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Your Messages</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Select a conversation from the list to view your messages. Your conversations are securely stored and only visible to you and the recipient.
              </p>
              <Separator className="my-6" />
              <div className="text-sm text-muted-foreground">
                <h3 className="font-medium mb-2">Messaging Guidelines:</h3>
                <ul className="list-disc pl-5 text-left space-y-1">
                  <li>Keep communications respectful and on-topic</li>
                  <li>Arrange meetups in public places for safety</li>
                  <li>Never share sensitive personal or financial information</li>
                  <li>Report any suspicious activity immediately</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}