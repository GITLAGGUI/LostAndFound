'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { ReportForm } from '@/components/report-form'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ReportPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const supabase = createClient()

  const type = searchParams.get('type') as 'lost' | 'found' || 'lost'

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
      
      if (!user) {
        router.push('/auth')
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session?.user)
        if (!session?.user) {
          router.push('/auth')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, supabase])

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <ReportForm type={type} />
}