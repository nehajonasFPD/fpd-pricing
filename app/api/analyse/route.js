import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { looker, sellerboard, stockEta, manual } = await request.json()

    if (!looker && !sellerboard) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 })
    }

    const prompt = `You are a pricing analyst for First Point Distribution (FPD), an Amazon UK e-commerce seller.

Analyse the data below and produce repricing recommendations. Merge the two sources by SKU and ASIN where available.

=== LOOKER STUDIO CSV ===
Columns: SKU, ASIN, Current Stock, Due Stock, Total Sales, GP, GM %, TACOS, DOS
${looker ? looker.split('\n').slice(0, 120).join('\n') : '(not provided)'}

=== SELLERBOARD EXPORT ===
Columns: SKU, ASIN, Units, Sales, Gross profit, Net profit, Margin, BSR, Real ACOS, Sessions, Unit Session Percentage, Average Sales Price
Note: Margin is net margin %. Real ACOS is ad spend as % of revenue. BSR — lower number = better rank.
${sellerboard ? sellerboard.split('\n').slice(0, 120).join('\n') : '(not provided)'}

${manual ? `=== MANUAL NOTES ===\n${manual}` : ''}

REPRICING RULES (apply in priority order):
1. ALERT  — DOS < 15 (stock emergency, flag regardless of everything else)
2. RAISE  — Net profit > 0 AND Margin > 22% AND Real ACOS < 9% AND DOS >= 25 AND BSR < 80000 (if known)
3. DROP   — Net profit < 0 OR (Margin < 8% AND DOS >= 45)
4. DEAL   — Real ACOS > 14% AND Sessions > 800 OR (DOS >= 60 AND Margin < 18%)
5. HOLD   — Healthy but no strong signal either way

Focus on the top 50 SKUs by Sales. Skip SKUs with no sales and no stock.

Respond ONLY with a valid JSON array. No markdown, no backticks, no preamble. Schema:
[{"sku":"","asin":"","product_line":"","action":"RAISE|DROP|DEAL|HOLD|ALERT","bsr":null,"margin_pct":null,"real_acos_pct":null,"dos":null,"net_profit":null,"avg_price":null,"units":null,"current_stock":null,"reasoning":"max 12 words"}]`

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
    const results = JSON.parse(raw.replace(/```json|```/g, '').trim())

    return NextResponse.json({ results })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Analysis failed: ' + err.message }, { status: 500 })
  }
}
