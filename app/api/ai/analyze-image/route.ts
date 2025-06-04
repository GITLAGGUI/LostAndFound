import { NextRequest, NextResponse } from 'next/server'
import { AIAssistant } from '@/lib/ai/assistant'

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, description } = await request.json()

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    const aiAssistant = new AIAssistant()
    const enhancedDescription = await aiAssistant.analyzeImage(imageUrl, description || '')

    return NextResponse.json({
      success: true,
      enhancedDescription,
      originalDescription: description
    })
  } catch (error) {
    console.error('Image analysis API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to analyze image' },
      { status: 500 }
    )
  }
}