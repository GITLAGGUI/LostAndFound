'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  BarChart3,
  Users,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Search,
  Eye,
  Edit,
  Trash2,
  Shield,
  Settings,
  Activity,
  TrendingUp,
  Calendar
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AuthWrapper } from '@/components/auth-wrapper'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [allReports, setAllReports] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    try {
      // Load analytics data
      const statsResponse = await fetch('/api/admin/analytics')
      const statsData = await statsResponse.json()
      
      if (statsData.success) {
        setStats(statsData.stats)
      }

      // Load all reports
      const [lostResponse, foundResponse] = await Promise.all([
        fetch('/api/lost-items'),
        fetch('/api/found-items')
      ])

      const lostData = await lostResponse.json()
      const foundData = await foundResponse.json()

      const allReportsData = [
        ...(lostData.success ? lostData.items.map((item: any) => ({ ...item, type: 'lost' })) : []),
        ...(foundData.success ? foundData.items.map((item: any) => ({ ...item, type: 'found' })) : [])
      ]

      setAllReports(allReportsData)

      // Load all users
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAllUsers(users || [])
      
    } catch (error) {
      console.error('Error loading admin data:', error)
      toast.error('Failed to load admin data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'promote' | 'demote') => {
    try {
      let updates: any = {}
      
      switch (action) {
        case 'promote':
          updates = { is_admin: true }
          break
        case 'demote':
          updates = { is_admin: false }
          break
        default:
          toast.info('User status management coming soon')
          return
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)

      if (error) throw error

      toast.success(`User ${action} successful`)
      loadAdminData() // Reload data
    } catch (error) {
      console.error(`Error performing ${action}:`, error)
      toast.error(`Failed to ${action} user`)
    }
  }

  const handleReportAction = async (reportId: string, type: 'lost' | 'found', action: 'delete' | 'resolve') => {
    try {
      const endpoint = type === 'lost' ? '/api/lost-items' : '/api/found-items'
      
      if (action === 'delete') {
        const response = await fetch(`${endpoint}/${reportId}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) throw new Error('Failed to delete report')
        
        toast.success('Report deleted successfully')
        loadAdminData() // Reload data
      } else if (action === 'resolve') {
        const newStatus = type === 'lost' ? 'found' : 'returned'
        const response = await fetch(`${endpoint}/${reportId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        })
        
        if (!response.ok) throw new Error('Failed to resolve report')
        
        toast.success('Report resolved successfully')
        loadAdminData() // Reload data
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error)
      toast.error(`Failed to ${action} report`)
    }
  }

  const filteredReports = allReports.filter(report => 
    report.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredUsers = allUsers.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800'
      case 'available': return 'bg-green-100 text-green-800'
      case 'found': case 'returned': case 'claimed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <AuthWrapper requireAuth={true} requireAdmin={true}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </AuthWrapper>
    )
  }

  if (!stats) {
    return (
      <AuthWrapper requireAuth={true} requireAdmin={true}>
        <div className="container mx-auto py-8">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load admin data. Please try again.
            </AlertDescription>
          </Alert>
        </div>
      </AuthWrapper>
    )
  }

  return (
    <AuthWrapper requireAuth={true} requireAdmin={true}>
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Platform overview, analytics, and management tools
        </p>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">{stats.totals.users}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Platform users
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Reports</p>
                <p className="text-3xl font-bold">
                  {stats.totals.activeLostItems + stats.totals.availableFoundItems}
                </p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Lost: {stats.totals.activeLostItems} | Found: {stats.totals.availableFoundItems}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Matches</p>
                <p className="text-3xl font-bold">{stats.totals.matches}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Success Rate: {stats.totals.successRate}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reports</p>
                <p className="text-3xl font-bold">
                  {stats.totals.lostItems + stats.totals.foundItems}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Lost: {stats.totals.lostItems} | Found: {stats.totals.foundItems}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Manage Reports</TabsTrigger>
          <TabsTrigger value="users">Manage Users</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {/* Monthly Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Reports Trend</CardTitle>
              <CardDescription>Lost items, found items, and matches over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="lost" stroke="#ef4444" strokeWidth={2} name="Lost Items" />
                    <Line type="monotone" dataKey="found" stroke="#22c55e" strokeWidth={2} name="Found Items" />
                    <Line type="monotone" dataKey="matches" stroke="#3b82f6" strokeWidth={2} name="Matches" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Reports by Category</CardTitle>
                <CardDescription>Distribution of lost and found items by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { category: 'Items', lost: stats.categoryStats.item?.lost || 0, found: stats.categoryStats.item?.found || 0 },
                      { category: 'Pets', lost: stats.categoryStats.pet?.lost || 0, found: stats.categoryStats.pet?.found || 0 },
                      { category: 'People', lost: stats.categoryStats.person?.lost || 0, found: stats.categoryStats.person?.found || 0 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="lost" fill="#ef4444" name="Lost" />
                      <Bar dataKey="found" fill="#22c55e" name="Found" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Statistics</CardTitle>
                <CardDescription>Key metrics and performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Success Rate</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.totals.successRate}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-green-800">Successful Matches</p>
                    <p className="text-2xl font-bold text-green-900">{stats.totals.successfulMatches}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                
                <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-orange-800">Pending Items</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {stats.totals.activeLostItems + stats.totals.availableFoundItems}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Reports</CardTitle>
              <CardDescription>
                Manage all lost and found reports on the platform
              </CardDescription>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search reports..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.slice(0, 20).map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {report.type === 'lost' ? 'Lost' : 'Found'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{report.title}</TableCell>
                        <TableCell className="capitalize">{report.category}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(report.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => router.push(`/listings/${report.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleReportAction(report.id, report.type, 'resolve')}
                              disabled={report.status !== 'active' && report.status !== 'available'}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleReportAction(report.id, report.type, 'delete')}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage platform users
              </CardDescription>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search users..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.slice(0, 20).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.is_admin ? 'default' : 'outline'}>
                            {user.is_admin ? 'Admin' : 'User'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleUserAction(user.id, user.is_admin ? 'demote' : 'promote')}
                            >
                              {user.is_admin ? 'Demote' : 'Make Admin'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>
                Configure platform-wide settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="platform-name">Platform Name</Label>
                  <Input id="platform-name" defaultValue="FindIt - Lost & Found Platform" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="support-email">Support Email</Label>
                  <Input id="support-email" type="email" defaultValue="support@findit.com" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-images">Max Images per Report</Label>
                  <Select defaultValue="5">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 images</SelectItem>
                      <SelectItem value="5">5 images</SelectItem>
                      <SelectItem value="10">10 images</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ai-similarity-threshold">AI Similarity Threshold</Label>
                  <Select defaultValue="70">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">60% (More matches)</SelectItem>
                      <SelectItem value="70">70% (Balanced)</SelectItem>
                      <SelectItem value="80">80% (Fewer, higher quality matches)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="auto-archive-days">Auto-archive Reports After (days)</Label>
                  <Input id="auto-archive-days" type="number" defaultValue="90" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notification-frequency">Email Notification Frequency</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="daily">Daily digest</SelectItem>
                      <SelectItem value="weekly">Weekly digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </AuthWrapper>
  )
}