"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircleIcon, SearchIcon, UsersIcon, MountainIcon } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useAuth } from '@/contexts/AuthContext'

// Lazy load chart components to avoid SSR issues
const RechartsBarChart = dynamic(() => import("@/components/charts/bar-chart"), {
  loading: () => <div className="h-[350px] animate-pulse bg-muted rounded-lg flex items-center justify-center">Loading Chart...</div>,
  ssr: false
})

const RechartsPieChart = dynamic(() => import("@/components/charts/pie-chart"), {
  loading: () => <div className="h-[350px] animate-pulse bg-muted rounded-lg flex items-center justify-center">Loading Chart...</div>,
  ssr: false
})

interface Analytics {
  totals: {
    lostItems: number
    foundItems: number
    matches: number
    users: number
    successRate: number
  }
  monthlyData: Array<{
    month: string
    lost: number
    found: number
    matches: number
  }>
  categoryStats: {
    item: { lost: number; found: number }
    person: { lost: number; found: number }
    pet: { lost: number; found: number }
  }
}

export default function HomePage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics')
      const data = await response.json()
      if (data.success) {
        setAnalytics(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium animate-pulse bg-muted h-4 w-24 rounded"></CardTitle>
                <div className="h-4 w-4 animate-pulse bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse bg-muted h-8 w-16 rounded mb-1"></div>
                <div className="animate-pulse bg-muted h-3 w-32 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8">
        <div className="max-w-4xl mx-auto text-center">
          <MountainIcon className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">FindIt - Lost & Found Platform</h1>
          <p className="text-xl mb-6">AI-powered platform to report and find lost items, pets, and people with smart matching technology.</p>
          <div className="flex gap-4 justify-center">
            {user ? (
              // Show dashboard/report buttons if user is signed in
              <>
                <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  <Link href="/report">
                    <PlusCircleIcon className="mr-2 h-5 w-5" />
                    Report Lost Item
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                  <Link href="/dashboard">
                    <SearchIcon className="mr-2 h-5 w-5" />
                    Go to Dashboard
                  </Link>
                </Button>
              </>
            ) : (
              // Show auth button if user is not signed in
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <Link href="/auth">
                  Get Started
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lost Items</CardTitle>
              <SearchIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totals.lostItems}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.totals.lostItems > 0 
                  ? `${Math.round((analytics.totals.matches / analytics.totals.lostItems) * 100)}% match rate`
                  : 'No items yet'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Found Items</CardTitle>
              <PlusCircleIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totals.foundItems}</div>
              <p className="text-xs text-muted-foreground">
                Items waiting to be claimed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful Matches</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totals.matches}</div>
              <p className="text-xs text-muted-foreground">
                Items successfully reunited
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <MountainIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totals.successRate}%</div>
              <p className="text-xs text-muted-foreground">
                Overall platform success rate
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircleIcon className="h-5 w-5 text-red-600" />
                Report Lost Item
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Lost something? Report it here and let our AI help match it with found items.
              </p>
              <Button asChild className="w-full">
                <Link href="/report-lost">Report Lost</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SearchIcon className="h-5 w-5 text-green-600" />
                Report Found Item
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Found something? Help reunite it with its owner by reporting it here.
              </p>
              <Button asChild className="w-full">
                <Link href="/report-found">Report Found</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-blue-600" />
                Browse Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Browse through lost and found items to see if you can help or find your item.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/browse">Browse All</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Charts Section */}
      {analytics && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <RechartsBarChart data={analytics.monthlyData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categories Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <RechartsPieChart data={analytics.categoryStats} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Features Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Platform Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Matching</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Our advanced AI analyzes descriptions and images to automatically suggest potential matches between lost and found items.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Real-time Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get instant notifications when potential matches are found for your reported items.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Secure Communication</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Built-in messaging system allows secure communication between users without revealing personal information.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Photo Recognition</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Advanced image analysis helps identify items and their distinctive features automatically.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location Services</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Map-based location tracking helps users find items in their vicinity and track where items were lost or found.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Community Driven</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Join a community of users helping each other recover lost belongings and reunite families.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-muted rounded-lg p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Start Using FindIt Today</h2>
        <p className="text-muted-foreground mb-4">
          Join thousands of users who have successfully recovered their lost items through our platform.
        </p>
        <div className="flex gap-4 justify-center">
          {user ? (
            <>
              <Button asChild size="lg">
                <Link href="/report">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="lg">
                <Link href="/auth">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/listings">Browse Items</Link>
              </Button>
            </>
          )}
        </div>
      </section>
    </div>
  )
}