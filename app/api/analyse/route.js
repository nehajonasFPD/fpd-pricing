import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { looker, sellerboard, stockEta, manual } = await request.json()

    if (!looker && !sellerboard) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 })
    }

    const prompt = `You are a pricing analyst for First Point Distribution (FPD), an Amazon UK e-commerce seller.

Analyse the data below and produce repricing recommendations. Merge by SKU and ASIN where available.

=== LOOKER STUDIO CSV ===
Exact column names: SKU, Product Line, ASIN, Current Stock, Due Stock, Total Sales, GP, GM %, TACOS, DOS
IMPORTANT: GM % is a decimal (0.35 = 35%). TACOS is a decimal (0.07 = 7%). DOS is days of stock remaining.
${looker ? looker.split('\n').slice(0, 100).join('\n') : '(not provided)'}

=== SELLERBOARD EXPORT ===
Exact column names: Product, ASIN, SKU, Units, Sales, Gross profit, Net profit, Margin, BSR, Real ACOS, Sessions, Unit Session Percentage, Average Sales Price
IMPORTANT: Margin is already in % (16.5 = 16.5%). Real ACOS is already in % (4.0 = 4.0%). BSR is a number — lower is better.
${sellerboard ? sellerboard.split('\n').slice(0, 100).join('\n') : '(not provided)'}

${manual ? `=== MANUAL NOTES ===\n${manual}` : ''}

REPRICING RULES (apply in priority order):
1. ALERT  — DOS < 15 (stock emergency — flag regardless of everything else)
2. RAISE  — Net profit > 0 AND Margin > 22 AND Real ACOS < 9 AND DOS >= 25
3. DROP   — Net profit < 0 OR (Margin < 8 AND DOS >= 45)
4. DEAL   — (Real ACOS > 14 AND Sessions > 500) OR (DOS >= 60 AND Margin < 18)
5. HOLD   — everything else with meaningful sales

Focus on top 40 SKUs by Sales or Units. Skip SKUs with zero sales AND zero stock.

Respond ONLY with a valid JSON array. No markdown, no backticks, no preamble, no explanation. Just the array.
Schema: [{"sku":"","asin":"","product_line":"","action":"RAISE|DROP|DEAL|HOLD|ALERT","bsr":null,"margin_pct":null,"real_acos_pct":null,"dos":null,"net_profit":null,"avg_price":null,"units":null,"current_stock":null,"reasoning":"max 10 words"}]`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.APEX_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const raw = data.content?.find(b => b.type === 'text')?.text || '[]'
    console.log('Claude raw (first 500):', raw.substring(0, 500))

    // Extract JSON array even if wrapped in extra text
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    const jsonStr = jsonMatch ? jsonMatch[0] : raw.replace(/```json|```/g, '').trim()

    let results = []
    try {
      results = JSON.parse(jsonStr)
    } catch(e) {
      console.error('Parse error:', e.message, '| String was:', jsonStr.substring(0, 300))
      return NextResponse.json({ error: 'Parse failed', raw: raw.substring(0, 500) }, { status: 500 })
    }

    return NextResponse.json({ results })
  } catch (err) {
    console.error('Route error:', err)
    return NextResponse.json({ error: 'Analysis failed: ' + err.message }, { status: 500 })
  }
}
