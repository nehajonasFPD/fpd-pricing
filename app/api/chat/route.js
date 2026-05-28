import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { messages, context } = await request.json()

    const system = `You are APEX, an AI pricing analyst for First Point Distribution (FPD), an Amazon UK e-commerce seller.

You have access to the current pricing brief data. Answer questions concisely and directly — this is an internal tool used by the pricing team and CEO.

CURRENT PRICING BRIEF CONTEXT:
${context || 'No analysis has been run yet. Ask the user to upload their data and run the analysis first.'}

Guidelines:
- Be direct and specific — use SKU names, numbers, percentages
- Flag urgency clearly when stock alerts or loss-makers are involved
- If asked about a specific SKU, pull the exact figures from the context
- If data isn't available, say so clearly
- Keep responses short — this is a chat window, not a report
- You can suggest next actions (e.g. "consider raising by 5-10%")
- Refer to yourself as APEX`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system,
        messages,
      }),
    })

    const data = await response.json()
    const text = data.content?.find(b => b.type === 'text')?.text || 'Sorry, I could not generate a response.'
    return NextResponse.json({ reply: text })
  } catch (err) {
    return NextResponse.json({ error: 'Chat failed: ' + err.message }, { status: 500 })
  }
}
