import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/services/database'
import { FoundItem } from '@/lib/types/database'

const db = new DatabaseService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.user_id) {
      return NextResponse.json(
        { error: 'User authentication required', success: false },
        { status: 401 }
      )
    }

    if (!body.title || !body.description) {
      return NextResponse.json(
        { error: 'Title and description are required', success: false },
        { status: 400 }
      )
    }

    if (!body.location && !body.location_found) {
      return NextResponse.json(
        { error: 'Location is required', success: false },
        { status: 400 }
      )
    }

    if (!body.date && !body.date_found) {
      return NextResponse.json(
        { error: 'Date is required', success: false },
        { status: 400 }
      )
    }

    if (!body.contactInfo && !body.contact_info) {
      return NextResponse.json(
        { error: 'Contact information is required', success: false },
        { status: 400 }
      )
    }

    // Create the found item data with proper field mapping
    const foundItemData: Partial<FoundItem> = {
      user_id: body.user_id,
      title: body.title.trim(),
      description: body.description.trim(),
      category: body.category || 'item',
      subcategory: body.subcategory || 'Others',
      location_found: body.location_found || body.location,
      date_found: body.date_found || body.date,
      images: Array.isArray(body.images) ? body.images : [],
      contact_info: body.contact_info || body.contactInfo,
      color: body.color || null,
      size: body.size || null,
      brand: body.brand || null,
      distinctive_features: body.distinctive_features || body.distinctiveFeatures || null,
      status: 'available' as const
    }

    console.log('Creating found item with data:', foundItemData)

    const foundItem = await db.createFoundItem(foundItemData)

    // Try to find potential matches in lost items
    let potentialMatches = 0
    try {
      const similarItems = await db.findSimilarItems(
        foundItem.description,
        foundItem.category,
        'lost'
      )
      potentialMatches = similarItems.length
    } catch (matchError) {
      console.warn('Could not find potential matches:', matchError)
    }

    return NextResponse.json({
      success: true,
      item: foundItem,
      potentialMatches,
      message: 'Found item reported successfully!'
    })
  } catch (error) {
    console.error('Found item creation error:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to create found item report',
          details: error.message,
          success: false 
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        success: false 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const filters: any = {}
    if (category) filters.category = category
    if (status) filters.status = status

    const items = await db.getFoundItems(filters)

    return NextResponse.json({
      success: true,
      items
    })
  } catch (error) {
    console.error('Found items fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch found items', success: false },
      { status: 500 }
    )
  }
}