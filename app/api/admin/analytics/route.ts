import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/services/database'

const db = new DatabaseService()

export async function GET() {
  try {
    const stats = await db.getDashboardStats()
    
    // Calculate metrics
    const totalLostItems = stats.lostItems.length
    const totalFoundItems = stats.foundItems.length
    const totalMatches = stats.matches.length
    const totalUsers = stats.users.length
    
    const activeLostItems = stats.lostItems.filter(item => item.status === 'active').length
    const availableFoundItems = stats.foundItems.filter(item => item.status === 'available').length
    const successfulMatches = stats.matches.filter(match => match.status === 'confirmed').length
    
    // Calculate success rate
    const successRate = totalLostItems > 0 ? (successfulMatches / totalLostItems) * 100 : 0
    
    // Monthly data for charts
    const monthlyData = []
    const currentDate = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthStart = date.toISOString().split('T')[0]
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0]
      
      const monthLost = stats.lostItems.filter(item => 
        item.created_at >= monthStart && item.created_at <= monthEnd
      ).length
      
      const monthFound = stats.foundItems.filter(item => 
        item.created_at >= monthStart && item.created_at <= monthEnd
      ).length
      
      const monthMatches = stats.matches.filter(match => 
        match.created_at >= monthStart && match.created_at <= monthEnd
      ).length
      
      monthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        lost: monthLost,
        found: monthFound,
        matches: monthMatches
      })
    }
    
    // Category breakdown
    const categoryStats = {
      item: {
        lost: stats.lostItems.filter(item => item.category === 'item').length,
        found: stats.foundItems.filter(item => item.category === 'item').length
      },
      person: {
        lost: stats.lostItems.filter(item => item.category === 'person').length,
        found: stats.foundItems.filter(item => item.category === 'person').length
      },
      pet: {
        lost: stats.lostItems.filter(item => item.category === 'pet').length,
        found: stats.foundItems.filter(item => item.category === 'pet').length
      }
    }
    
    return NextResponse.json({
      success: true,
      stats: {
        totals: {
          lostItems: totalLostItems,
          foundItems: totalFoundItems,
          matches: totalMatches,
          users: totalUsers,
          activeLostItems,
          availableFoundItems,
          successfulMatches,
          successRate: Math.round(successRate)
        },
        monthlyData,
        categoryStats
      }
    })
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}