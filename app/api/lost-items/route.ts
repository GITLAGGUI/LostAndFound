import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/services/database'
import { LostItem } from '@/lib/types/database'

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

    if (!body.location && !body.location_lost) {
      return NextResponse.json(
        { error: 'Location is required', success: false },
        { status: 400 }
      )
    }

    if (!body.date && !body.date_lost) {
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

    // Create the lost item data with proper field mapping
    const lostItemData: Partial<LostItem> = {
      user_id: body.user_id,
      title: body.title.trim(),
      description: body.description.trim(),
      category: body.category || 'item',
      subcategory: body.subcategory || 'Others',
      location_lost: body.location_lost || body.location,
      date_lost: body.date_lost || body.date,
      images: Array.isArray(body.images) ? body.images : [],
      contact_info: body.contact_info || body.contactInfo,
      reward: body.reward ? parseFloat(body.reward) : undefined,
      color: body.color || null,
      size: body.size || null,
      brand: body.brand || null,
      distinctive_features: body.distinctive_features || body.distinctiveFeatures || null,
      status: 'active' as const
    }

    console.log('Creating lost item with data:', lostItemData)

    const lostItem = await db.createLostItem(lostItemData)

    return NextResponse.json({
      success: true,
      item: lostItem,
      message: 'Lost item reported successfully!'
    })
  } catch (error) {
    console.error('Lost item creation error:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to create lost item report',
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

    const items = await db.getLostItems(filters)

    return NextResponse.json({
      success: true,
      items
    })
  } catch (error) {
    console.error('Lost items fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lost items', success: false },
      { status: 500 }
    )
  }
}