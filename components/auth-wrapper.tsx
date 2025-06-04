'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface AuthWrapperProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
}

export function AuthWrapper({ children, requireAuth = true, requireAdmin = false }: AuthWrapperProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // Public routes that don't require authentication
  const publicRoutes = ['/auth']

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setIsAuthenticated(false)
          setIsAdmin(false)
          setIsLoading(false)
          
          // Redirect to auth if required and not on a public route
          if (requireAuth && !publicRoutes.includes(pathname)) {
            router.push('/auth')
          }
          return
        }

        setIsAuthenticated(true)

        // Check admin status if required
        if (requireAdmin || pathname.startsWith('/admin')) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single()

          const userIsAdmin = profile?.is_admin || false
          setIsAdmin(userIsAdmin)

          // Redirect if admin access required but user is not admin
          if (requireAdmin && !userIsAdmin) {
            router.push('/dashboard')
            return
          }
        }

        setIsLoading(false)

      } catch (error) {
        console.error('Auth check error:', error)
        setIsAuthenticated(false)
        setIsAdmin(false)
        setIsLoading(false)
        
        if (requireAuth && !publicRoutes.includes(pathname)) {
          router.push('/auth')
        }
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setIsAuthenticated(true)
        // Recheck admin status when user signs in
        if (requireAdmin || pathname.startsWith('/admin')) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single()
          
          setIsAdmin(profile?.is_admin || false)
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false)
        setIsAdmin(false)
        if (requireAuth && !publicRoutes.includes(pathname)) {
          router.push('/auth')
        }
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase, router, pathname, requireAuth, requireAdmin])

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Allow access to public routes without authentication
  if (!requireAuth || publicRoutes.includes(pathname)) {
    return <>{children}</>
  }

  // Require authentication for protected routes
  if (requireAuth && !isAuthenticated) {
    return null // Will redirect to /auth
  }

  // Require admin access for admin routes
  if (requireAdmin && !isAdmin) {
    return null // Will redirect to /dashboard
  }

  return <>{children}</>
}