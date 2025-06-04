'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Client-side dynamic import for messaging system
const MessagingSystem = dynamic(() => import('@/components/messaging-system').then(mod => ({ default: mod.MessagingSystem })), {
  loading: () => null,
  ssr: false
})

export function ClientMessagingSystem() {
  return (
    <Suspense fallback={null}>
      <MessagingSystem />
    </Suspense>
  )
}