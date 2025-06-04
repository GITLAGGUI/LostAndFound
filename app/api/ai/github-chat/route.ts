import { NextRequest, NextResponse } from 'next/server'

const GITHUB_ENDPOINT = "https://models.github.ai/inference";
const GITHUB_MODEL = "openai/gpt-4.1";
const GITHUB_TOKEN = process.env.GITHUB_AI_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
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


Always be concise, helpful, and prioritize user safety. Provide step-by-step guidance when explaining processes.`
    };

    // Convert messages to GitHub AI format
    const formattedMessages = [
      { role: "system", content: systemMessage.content },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Call GitHub AI endpoint
    const response = await fetch(GITHUB_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GITHUB_TOKEN}`
      },
      body: JSON.stringify({
        model: GITHUB_MODEL,
        messages: formattedMessages,
        temperature: 0.7,
        top_p: 1.0
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('GitHub AI API error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to get AI response from GitHub');
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || 'Sorry, I couldn\'t process your request.';

    return NextResponse.json({
      success: true,
      message: aiMessage,
      source: 'github'
    });
  } catch (error: any) {
    console.error('GitHub AI Chat API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get AI response from GitHub' },
      { status: 500 }
    );
  }
}