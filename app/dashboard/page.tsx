'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2Icon, Edit3Icon, Trash2Icon, EyeIcon, MessageSquareIcon, TrendingUp, MapPin, Clock, Star, LogOut, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DatabaseService } from '@/lib/services/database'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function UserDashboardPage() {
  const { user, userProfile, loading, signOut } = useAuth()
  const [lostItems, setLostItems] = useState<any[]>([])
  const [foundItems, setFoundItems] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const db = new DatabaseService()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    } else if (user && !loading) {
      loadDashboardData()
    }
  }, [user, loading, router])

  const loadDashboardData = async () => {
    if (!user) return
    
    try {
      // Load user's reports and matches
      const [userLostItems, userFoundItems, userMatches] = await Promise.all([
        loadUserItems('lost', user.id),
        loadUserItems('found', user.id),
        loadUserMatches(user.id)
      ])

      setLostItems(userLostItems)
      setFoundItems(userFoundItems)
      setMatches(userMatches)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserItems = async (type: 'lost' | 'found', userId: string) => {
    try {
      const endpoint = type === 'lost' ? '/api/lost-items' : '/api/found-items'
      const response = await fetch(`${endpoint}?userId=${userId}`)
      const data = await response.json()
      return data.success ? data.items.filter((item: any) => item.user_id === userId) : []
    } catch (error) {
      console.error(`Error loading ${type} items:`, error)
      return []
    }
  }

  const loadUserMatches = async (userId: string) => {
    try {
      const response = await fetch(`/api/matches?userId=${userId}`)
      const data = await response.json()
      return data.success ? data.matches : []
    } catch (error) {
      console.error('Error loading matches:', error)
      return []
    }
  }

  const handleMarkAsResolved = async (itemId: string, type: 'lost' | 'found') => {
    try {
      const newStatus = type === 'lost' ? 'found' : 'returned'
      const endpoint = type === 'lost' ? '/api/lost-items' : '/api/found-items'
      
      const response = await fetch(`${endpoint}/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        await loadDashboardData() // Reload data
        toast.success(`Item marked as ${newStatus}`)
      } else {
        throw new Error('Failed to update item status')
      }
    } catch (error) {
      console.error('Error updating item status:', error)
      toast.error('Failed to update item status')
    }
  }

  const handleDeleteReport = async (itemId: string, type: 'lost' | 'found') => {
    try {
      const endpoint = type === 'lost' ? '/api/lost-items' : '/api/found-items'
      
      const response = await fetch(`${endpoint}/${itemId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadDashboardData() // Reload data
        toast.success('Report deleted successfully')
      } else {
        throw new Error('Failed to delete report')
      }
    } catch (error) {
      console.error('Error deleting report:', error)
      toast.error('Failed to delete report')
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const getActiveItems = () => {
    const activeLost = lostItems.filter(item => item.status === 'active')
    const activeFound = foundItems.filter(item => item.status === 'available')
    return [...activeLost, ...activeFound]
  }

  const getResolvedItems = () => {
    const resolvedLost = lostItems.filter(item => item.status === 'found')
    const resolvedFound = foundItems.filter(item => item.status === 'returned' || item.status === 'claimed')
    return [...resolvedLost, ...resolvedFound]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800'
      case 'available': return 'bg-green-100 text-green-800'
      case 'found': case 'returned': case 'claimed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMatchConfidenceColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getMatchConfidenceText = (score: number) => {
    if (score >= 80) return 'High'
    if (score >= 60) return 'Medium'
    return 'Low'
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const activeItems = getActiveItems()
  const resolvedItems = getResolvedItems()
  const pendingMatches = matches.filter(match => match.status === 'pending')

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Welcome back!</h1>
          <p className="text-muted-foreground mt-2">Here's what's happening with your reports and matches.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                {userProfile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{userProfile?.full_name || 'No name set'}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Reports</p>
                <p className="text-3xl font-bold">{activeItems.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved Items</p>
                <p className="text-3xl font-bold">{resolvedItems.length}</p>
              </div>
              <CheckCircle2Icon className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Matches</p>
                <p className="text-3xl font-bold">{pendingMatches.length}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reports</p>
                <p className="text-3xl font-bold">{lostItems.length + foundItems.length}</p>
              </div>
              <MessageSquareIcon className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active-reports" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active-reports">
            Active Reports ({activeItems.length})
          </TabsTrigger>
          <TabsTrigger value="matches">
            Matches ({pendingMatches.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({resolvedItems.length})
          </TabsTrigger>
          <TabsTrigger value="all-reports">
            All Reports ({lostItems.length + foundItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active-reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Reports</CardTitle>
              <CardDescription>
                Items you've reported that are still lost or available for claim.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeItems.length > 0 ? (
                activeItems.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      {item.images && item.images.length > 0 && (
                        <div className="flex-shrink-0">
                          <Image
                            src={item.images[0]}
                            alt={item.title}
                            width={120}
                            height={80}
                            className="rounded-lg object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex-grow space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-lg">{item.title}</h3>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {item.location_lost || item.location_found}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDate(item.date_lost || item.date_found)}
                          </div>
                          <Badge variant="outline">{item.category}</Badge>
                          <Badge variant="outline">{item.subcategory}</Badge>
                        </div>

                        {item.reward && (
                          <div className="text-sm font-semibold text-green-600">
                            Reward: ${item.reward}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 min-w-[120px]">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleMarkAsResolved(item.id, item.location_lost ? 'lost' : 'found')}
                        >
                          Mark Resolved
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteReport(item.id, item.location_lost ? 'lost' : 'found')}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No active reports found.</p>
                  <Button asChild className="mt-4">
                    <Link href="/report">Create Your First Report</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Potential Matches</CardTitle>
              <CardDescription>
                Our AI has found these items that might match your reports.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingMatches.length > 0 ? (
                pendingMatches.map((match) => (
                  <Card key={match.id} className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-grow space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">
                            Match for: {match.lost_items?.title || match.found_items?.title}
                          </h3>
                          <Badge className={getMatchConfidenceColor(match.similarity_score)}>
                            {getMatchConfidenceText(match.similarity_score)} ({match.similarity_score}%)
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          Match Type: {match.match_type.replace('_', ' ')}
                        </p>
                        
                        <div className="text-sm">
                          <strong>Original item:</strong> {match.lost_items?.description || match.found_items?.description}
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          Matched on: {formatDate(match.created_at)}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button asChild size="sm">
                          <Link href={`/listings/${match.lost_items?.id || match.found_items?.id}`}>
                            View Match
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm">
                          Contact Finder
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No pending matches found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resolved Items</CardTitle>
              <CardDescription>Items that have been found or returned.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {resolvedItems.length > 0 ? (
                resolvedItems.map((item) => (
                  <Card key={item.id} className="p-4 border-green-200">
                    <div className="flex flex-col md:flex-row gap-4">
                      {item.images && item.images.length > 0 && (
                        <div className="flex-shrink-0">
                          <Image
                            src={item.images[0]}
                            alt={item.title}
                            width={120}
                            height={80}
                            className="rounded-lg object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex-grow space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-lg">{item.title}</h3>
                          <Badge className="bg-green-100 text-green-800">
                            {item.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Resolved: {formatDate(item.updated_at)}
                          </div>
                          <Badge variant="outline">{item.category}</Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No resolved items yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Your Reports</CardTitle>
              <CardDescription>Complete history of your lost and found reports.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[...lostItems, ...foundItems].length > 0 ? (
                [...lostItems, ...foundItems]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        {item.images && item.images.length > 0 && (
                          <div className="flex-shrink-0">
                            <Image
                              src={item.images[0]}
                              alt={item.title}
                              width={120}
                              height={80}
                              className="rounded-lg object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="flex-grow space-y-2">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-lg">{item.title}</h3>
                            <div className="flex gap-2">
                              <Badge variant="outline">
                                {item.location_lost ? 'Lost' : 'Found'}
                              </Badge>
                              <Badge className={getStatusColor(item.status)}>
                                {item.status}
                              </Badge>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {item.location_lost || item.location_found}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDate(item.created_at)}
                            </div>
                            <Badge variant="outline">{item.category}</Badge>
                            <Badge variant="outline">{item.subcategory}</Badge>
                          </div>

                          {item.reward && (
                            <div className="text-sm font-semibold text-green-600">
                              Reward: ${item.reward}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2 min-w-[120px]">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/listings/${item.id}`}>
                              View Details
                            </Link>
                          </Button>
                          {(item.status === 'active' || item.status === 'available') && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleMarkAsResolved(item.id, item.location_lost ? 'lost' : 'found')}
                              >
                                Mark Resolved
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDeleteReport(item.id, item.location_lost ? 'lost' : 'found')}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No reports found.</p>
                  <Button asChild className="mt-4">
                    <Link href="/report">Create Your First Report</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link href="/report?type=lost">Report Lost Item</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/report?type=found">Report Found Item</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/listings">Browse All Listings</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}