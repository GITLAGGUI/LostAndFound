import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    const systemMessage = {
      role: 'system',
      content: `You are a helpful AI assistant for a lost and found web application called "FindIt". You help users with:

- How to sign up and sign in to the platform
- How to report lost items, people, or pets effectively
- How to search for and identify found items
- How to use the messaging system to contact item owners
- Best practices for creating detailed reports with good photos
- Safety tips for meeting people to exchange items
- General platform navigation and features

Key features of FindIt:
- Users can report lost items, pets, or people with photos and detailed descriptions
- AI-powered matching system helps find potential matches
- Built-in messaging system for secure communication
- Image recognition for better item identification
- Separate categories for items, pets, and people
- Reward system for lost items

IMPORTANT FORMATTING RULES:
- ALWAYS use HTML formatting in your responses, NOT Markdown
- Use <b>text</b> for bold text instead of **text**
- Use <i>text</i> for italics instead of *text*
- Use <p></p> for paragraphs
- Use <ol><li></li></ol> for numbered lists
- Use <ul><li></li></ul> for bullet lists
- Use <br> for line breaks

EXAMPLE RESPONSE FORMAT:
<p><b>Great!</b> Here's how to report a lost item:</p>
<ol>
<li><b>Sign In:</b> Log into your <b>FindIt account</b></li>
<li><b>Click "Report Lost Item":</b> Find this button on your dashboard</li>
<li><b>Fill Details:</b> Add description, location, and photos</li>
</ol>
<p><b>Safety Tip:</b> Always meet in <i>public places</i> when collecting items!</p>

Always be concise, helpful, and prioritize user safety. Provide step-by-step guidance when explaining processes. Remember to use HTML formatting consistently for proper display.`
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://findit.app", 
        "X-Title": "FindIt App",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "deepseek/deepseek-r1-0528-qwen3-8b:free",
        "messages": [systemMessage, ...messages]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter API error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to get AI response');
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || 'Sorry, I couldn\'t process your request.';

    return NextResponse.json({
      success: true,
      message: aiMessage
    });
  } catch (error) {
    console.error('Chat API error:', error);
    let errorMessage = 'Failed to get AI response';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}