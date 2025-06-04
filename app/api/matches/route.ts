import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/services/database'
import { AIAssistant } from '@/lib/ai/assistant'

const db = new DatabaseService()
const aiAssistant = new AIAssistant()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lostItemId, foundItemId, type = 'user_reported' } = body

    if (!lostItemId || !foundItemId) {
      return NextResponse.json(
        { error: 'Missing required item IDs' },
        { status: 400 }
      )
    }

    // Get both items
    const [lostItem, foundItem] = await Promise.all([
      db.getLostItemById(lostItemId),
      db.getFoundItemById(foundItemId)
    ])

    if (!lostItem || !foundItem) {
      return NextResponse.json(
        { error: 'Items not found' },
        { status: 404 }
      )
    }

    // Calculate similarity score
    const similarityScore = aiAssistant.calculateSimilarity(
      lostItem.description + ' ' + (lostItem.ai_description || ''),
      foundItem.description + ' ' + (foundItem.ai_description || '')
    )

    // Create match
    const match = await db.createMatch({
      lost_item_id: lostItemId,
      found_item_id: foundItemId,
      similarity_score: similarityScore,
      match_type: type,
      status: 'pending'
    })

    return NextResponse.json({
      success: true,
      match,
      similarityScore
    })
  } catch (error) {
    console.error('Match creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const matches = await db.getMatches(userId || undefined)

    return NextResponse.json({
      success: true,
      matches
    })
  } catch (error) {
    console.error('Matches fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}