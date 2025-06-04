'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Key } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { AuthWrapper } from '@/components/auth-wrapper'

export default function AdminSetupPage() {
  const [setupKey, setSetupKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSetupAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ setupKey }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Admin privileges granted! Please refresh the page.')
        router.push('/admin')
      } else {
        toast.error(data.error || 'Failed to setup admin')
      }
    } catch (error) {
      console.error('Admin setup error:', error)
      toast.error('Failed to setup admin')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthWrapper requireAuth={true}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950 p-4">
        <Card className="w-full max-w-md shadow-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl">
          <CardHeader className="space-y-1 text-center">
            <Shield className="h-12 w-12 mx-auto text-primary" />
            <CardTitle className="text-2xl font-bold">Admin Setup</CardTitle>
            <CardDescription>
              Enter the setup key to gain admin privileges for this account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetupAdmin} className="space-y-4">
              <Alert className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
                <Key className="h-4 w-4" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <strong>Setup Key:</strong> SETUP_ADMIN_2024
                  <br />
                  <small>Note: This is for initial setup only. Remove this endpoint after creating your admin account.</small>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="setupKey" className="text-sm font-medium">
                  Setup Key
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="setupKey"
                    type="text"
                    value={setupKey}
                    onChange={(e) => setSetupKey(e.target.value)}
                    placeholder="Enter setup key"
                    required
                    disabled={isLoading}
                    className="pl-10 h-11 border-2 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                disabled={isLoading || !setupKey.trim()}
              >
                {isLoading ? 'Setting up...' : 'Setup Admin Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/dashboard')}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Continue as regular user
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  )
}