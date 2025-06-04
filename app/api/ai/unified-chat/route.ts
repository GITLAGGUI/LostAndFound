import { NextRequest, NextResponse } from 'next/server'

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = "deepseek/deepseek-r1-0528-qwen3-8b:free";

// GitHub AI constants
const GITHUB_ENDPOINT = "https://models.github.ai/inference";
const GITHUB_MODEL = "openai/gpt-4.1";
const GITHUB_TOKEN = process.env.GITHUB_AI_TOKEN;

const systemPrompt = `You are a helpful AI assistant for a lost and found web application called "FindIt". You help users with:

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

Always be concise, helpful, and prioritize user safety. Provide step-by-step guidance when explaining processes. Remember to use HTML formatting consistently for proper display.`;

/**
 * Try to use OpenRouter API first, then fall back to GitHub AI if that fails
 */
export async function POST(request: NextRequest) {
  try {
    const { messages, preferredProvider } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    const systemMessage = {
      role: 'system',
      content: systemPrompt
    };

    // Determine which provider to try first based on preference or default to OpenRouter
    const providers = preferredProvider === 'github' 
      ? ['github', 'openrouter'] 
      : ['openrouter', 'github'];
    
    let response = null;
    let source = '';
    let error = null;

    // Try providers in sequence until one works
    for (const provider of providers) {
      try {
        if (provider === 'openrouter') {
          // Try OpenRouter first
          const openRouterResponse = await fetch(OPENROUTER_ENDPOINT, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${OPENROUTER_KEY}`,
              "HTTP-Referer": "https://findit.app", 
              "X-Title": "FindIt App",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              "model": OPENROUTER_MODEL,
              "messages": [systemMessage, ...messages]
            })
          });

          if (!openRouterResponse.ok) {
            const errorData = await openRouterResponse.json().catch(() => ({}));
            console.error('OpenRouter API error:', errorData);
            throw new Error(errorData.error?.message || 'Failed to get AI response from OpenRouter');
          }

          const data = await openRouterResponse.json();
          response = data.choices?.[0]?.message?.content || null;
          source = 'openrouter';
          
          if (response) break; // If successful, break the loop
        } else {
          // Try GitHub AI
          // Convert messages to GitHub AI format
          const formattedMessages = [
            { role: "system", content: systemMessage.content },
            ...messages.map((msg: any) => ({
              role: msg.role,
              content: msg.content
            }))
          ];

          const githubResponse = await fetch(GITHUB_ENDPOINT, {
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

          if (!githubResponse.ok) {
            const errorData = await githubResponse.json().catch(() => ({}));
            console.error('GitHub AI API error:', errorData);
            throw new Error(errorData.error?.message || 'Failed to get AI response from GitHub');
          }

          const data = await githubResponse.json();
          response = data.choices?.[0]?.message?.content || null;
          source = 'github';
          
          if (response) break; // If successful, break the loop
        }
      } catch (err: any) {
        console.error(`Error with ${provider} provider:`, err);
        error = err;
        // Continue to the next provider
      }
    }

    // If we got a response from any provider, return it
    if (response) {
      return NextResponse.json({
        success: true,
        message: response,
        source
      });
    } 
    
    // If all providers failed, throw the last error
    throw error || new Error('All AI providers failed');
  } catch (error: any) {
    console.error('AI Chat API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get AI response' },
      { status: 500 }
    );
  }
}