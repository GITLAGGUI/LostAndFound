import OpenAI from 'openai'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface AIResponse {
  success: boolean
  message: string
  error?: string
}

export class AIAssistant {
  private getOpenAI(): OpenAI {
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  async chat(messages: ChatMessage[]): Promise<AIResponse> {
    try {
      const openai = this.getOpenAI()
      
      const systemMessage: ChatMessage = {
        role: 'system',
        content: `You are a helpful AI assistant for a lost and found web application called "FindIt". You help users with:
        - How to sign up and sign in
        - How to report lost items, people, or pets
        - How to search for found items
        - How to use the image recognition feature
        - General platform guidance
        - Safety tips for meeting people to exchange items
        
        Be concise, helpful, and friendly. Always prioritize user safety.`
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [systemMessage, ...messages],
        max_tokens: 500,
        temperature: 0.7,
      })

      const response = completion.choices[0]?.message?.content || 'Sorry, I couldn\'t process your request.'
      
      return {
        success: true,
        message: response
      }
    } catch (error) {
      console.error('AI Assistant error:', error)
      return {
        success: false,
        message: 'Sorry, I\'m having trouble connecting right now. Please try again later.',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async analyzeImage(imageUrl: string, description: string): Promise<string> {
    try {
      const openai = this.getOpenAI()
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this lost/found item image and extract key identifying features for matching purposes. 
Current description: "${description}"

Please provide a detailed analysis including:
- Precise color(s) and patterns
- Size estimation and proportions
- Brand markings or logos visible
- Material appearance (leather, fabric, metal, plastic, etc.)
- Shape and distinctive design features
- Any text, numbers, or engravings visible
- Condition and any damage or wear
- Unique characteristics that would help in identification

Format as a structured description for matching against other items.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 500,
      })

      return response.choices[0]?.message?.content || description
    } catch (error) {
      console.error('Image analysis error:', error)
      return description
    }
  }

  calculateSimilarity(item1Description: string, item2Description: string): number {
    // Enhanced similarity calculation using keyword weighting
    const item1Words = this.extractKeywords(item1Description)
    const item2Words = this.extractKeywords(item2Description)
    
    // Weight different types of keywords differently
    const colorWeight = 3
    const brandWeight = 4
    const sizeWeight = 2
    const materialWeight = 2
    const generalWeight = 1
    
    let totalScore = 0
    let maxScore = 0
    
    const colorWords = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'silver', 'gold', 'brown', 'pink', 'purple', 'gray', 'orange']
    const materialWords = ['leather', 'fabric', 'metal', 'plastic', 'wood', 'glass', 'rubber', 'synthetic']
    const sizeWords = ['small', 'medium', 'large', 'tiny', 'huge', 'compact', 'oversized']
    
    // Compare keywords with weights
    item1Words.forEach(word => {
      let weight = generalWeight
      if (colorWords.includes(word.toLowerCase())) weight = colorWeight
      else if (materialWords.includes(word.toLowerCase())) weight = materialWeight
      else if (sizeWords.includes(word.toLowerCase())) weight = sizeWeight
      else if (word.length > 5) weight = brandWeight // Assume longer words are brands/specific features
      
      maxScore += weight
      if (item2Words.includes(word)) {
        totalScore += weight
      }
    })
    
    return maxScore > 0 ? Math.min((totalScore / maxScore) * 100, 100) : 0
  }

  private extractKeywords(text: string): string[] {
    // Remove common stop words and extract meaningful keywords
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were', 'have', 'has', 'had']
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .filter((word, index, array) => array.indexOf(word) === index) // Remove duplicates
  }

  async findPotentialMatches(lostItem: any, foundItems: any[]): Promise<any[]> {
    const matches = []
    
    for (const foundItem of foundItems) {
      // Calculate basic similarity
      const descriptionSimilarity = this.calculateSimilarity(
        lostItem.description + ' ' + lostItem.distinctive_features,
        foundItem.description + ' ' + foundItem.distinctive_features
      )
      
      // Additional matching criteria
      let bonusScore = 0
      
      // Category and subcategory match
      if (lostItem.category === foundItem.category) bonusScore += 20
      if (lostItem.subcategory === foundItem.subcategory) bonusScore += 15
      
      // Color match
      if (lostItem.color && foundItem.color && 
          lostItem.color.toLowerCase().includes(foundItem.color.toLowerCase())) {
        bonusScore += 10
      }
      
      // Brand match
      if (lostItem.brand && foundItem.brand && 
          lostItem.brand.toLowerCase() === foundItem.brand.toLowerCase()) {
        bonusScore += 15
      }
      
      // Location proximity (basic check)
      if (lostItem.location_lost && foundItem.location_found) {
        const locationSimilarity = this.calculateSimilarity(lostItem.location_lost, foundItem.location_found)
        if (locationSimilarity > 30) bonusScore += 10
      }
      
      const totalScore = Math.min(descriptionSimilarity + bonusScore, 100)
      
      if (totalScore > 40) { // Threshold for potential matches
        matches.push({
          ...foundItem,
          matchScore: totalScore,
          matchReasons: this.generateMatchReasons(lostItem, foundItem, totalScore)
        })
      }
    }
    
    // Sort by match score descending
    return matches.sort((a, b) => b.matchScore - a.matchScore)
  }

  private generateMatchReasons(lostItem: any, foundItem: any, score: number): string[] {
    const reasons = []
    
    if (lostItem.category === foundItem.category) {
      reasons.push(`Same category: ${lostItem.category}`)
    }
    
    if (lostItem.subcategory === foundItem.subcategory) {
      reasons.push(`Same type: ${lostItem.subcategory}`)
    }
    
    if (lostItem.color && foundItem.color && 
        lostItem.color.toLowerCase().includes(foundItem.color.toLowerCase())) {
      reasons.push(`Similar color: ${foundItem.color}`)
    }
    
    if (lostItem.brand && foundItem.brand && 
        lostItem.brand.toLowerCase() === foundItem.brand.toLowerCase()) {
      reasons.push(`Same brand: ${foundItem.brand}`)
    }
    
    const descSimilarity = this.calculateSimilarity(lostItem.description, foundItem.description)
    if (descSimilarity > 50) {
      reasons.push('Similar description')
    }
    
    return reasons
  }
}