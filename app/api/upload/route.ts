import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/services/database'

const db = new DatabaseService()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided', success: false },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed', success: false },
        { status: 400 }
      )
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB', success: false },
        { status: 400 }
      )
    }

    console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type)

    // Upload to Supabase Storage
    const imageUrl = await db.uploadImage(file)
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Failed to upload image', success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      url: imageUrl,
      message: 'Image uploaded successfully'
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    )
  }
}