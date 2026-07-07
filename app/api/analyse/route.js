import { NextResponse } from 'next/server'

// Parse CSV — auto-detects comma or semicolon delimiter, handles BOM and spaced numbers
function parseCSV(csv) {
  if (!csv || !csv.trim()) return []
  const clean = csv.replace(/^\uFEFF/, '').trim()
  const lines = clean.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const delim = lines[0].includes(';') ? ';' : ','
  const splitLine = (line) => {
    const vals = []
    let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === delim && !inQ) { vals.push(cur.trim()); cur = '' }
      else cur += ch
    }
    vals.push(cur.trim())
    return vals.map(v => v.replace(/^"|"$/g, '').trim())
  }
  const headers = splitLine(lines[0])
  return lines.slice(1).map(line => {
    const vals = splitLine(line)
    const row = {}
    headers.forEach((h, i) => { row[h] = vals[i] !== undefined ? vals[i] : '' })
    return row
  })
}

// Convert to number — handles spaces as thousand separators e.g. "3 125.16"
function toNum(v) {
  if (v === undefined || v === null || v === '') return null
  const n = Number(String(v).replace(/[£,%]/g, '').replace(/\s/g, '').trim())
  return isNaN(n) ? null : n
}

export async function POST(request) {
  try {
    const { looker, sellerboard, manual } = await request.json()

    if (!looker && !sellerboard) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 })
    }

    const lsRows = parseCSV(looker)
    const sbRows = parseCSV(sellerboard)
    console.log(`Parsed: ${lsRows.length} Looker rows, ${sbRows.length} Sellerboard rows`)
    if (sbRows.length > 0) console.log('SB sample keys:', Object.keys(sbRows[0]).slice(0, 8).join(', '))

    // Index Sellerboard by ASIN
    const sbByAsin = {}
    sbRows.forEach(r => { if (r.ASIN) sbByAsin[r.ASIN.trim()] = r })

    // Merge on ASIN
    const merged = lsRows.map(ls => {
      const asin = (ls.ASIN || '').trim()
      const sb = sbByAsin[asin] || {}
      return {
        sku:           ls['SKU'] || '',
        asin,
        product_line:  ls['Product Line'] || '',
        total_sales:   toNum(ls['Total Sales']),
        gm_pct:        toNum(ls['GM %']),
        tacos:         toNum(ls['TACOS']),
        dos:           toNum(ls['DOS']),
        current_stock: toNum(ls['Current Stock']),
        net_profit:    toNum(sb['Net profit']),
        margin:        toNum(sb['Margin']),
        bsr:           toNum(sb['BSR']),
        real_acos:     toNum(sb['Real ACOS']),
        sessions:      toNum(sb['Sessions']),
        avg_price:     toNum(sb['Average Sales Price']),
        units:         toNum(sb['Units']),
      }
    }).filter(r => (r.total_sales || 0) > 0 || (r.current_stock || 0) > 0)

    const top40 = merged.sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0)).slice(0, 40)
    console.log(`Sending ${top40.length} SKUs to Claude`)

    const skuList = top40.map(r =>
      `${r.sku}|${r.product_line}|${r.asin}|sales:${r.total_sales?.toFixed(0)}|gm:${r.gm_pct?.toFixed(3)}|tacos:${r.tacos?.toFixed(3)}|dos:${r.dos?.toFixed(0)}|stock:${r.current_stock}|np:${r.net_profit?.toFixed(0)}|margin:${r.margin?.toFixed(1)}|bsr:${r.bsr}|acos:${r.real_acos?.toFixed(1)}|sessions:${r.sessions}|price:${r.avg_price?.toFixed(2)}`
    ).join('\n')

    const prompt = `You are a pricing analyst for First Point Distribution (FPD), Amazon UK seller.

Score each SKU using these rules (priority order):
1. ALERT  — dos < 15 (stock emergency)
2. RAISE  — net_profit > 0 AND margin > 22 AND acos < 9 AND dos >= 25
3. DROP   — net_profit < 0 OR (margin < 8 AND dos >= 45)
4. DEAL   — (acos > 14 AND sessions > 500) OR (dos >= 60 AND margin < 18)
5. HOLD   — everything else

gm is decimal (0.35=35%). tacos is decimal (0.07=7%). margin and acos are already in %.
${manual ? `Extra context: ${manual}` : ''}

sku|product_line|asin|sales|gm|tacos|dos|stock|net_profit|margin|bsr|real_acos|sessions|avg_price
${skuList}

Respond ONLY with a JSON array. No markdown, no backticks, no explanation.
Schema: [{"sku":"","asin":"","product_line":"","action":"RAISE|DROP|DEAL|HOLD|ALERT","bsr":null,"margin_pct":null,"real_acos_pct":null,"dos":null,"net_profit":null,"avg_price":null,"units":null,"current_stock":null,"reasoning":"max 8 words"}]`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.APEX_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    console.log('Anthropic status:', data.type, '| stop_reason:', data.stop_reason)
    const raw = data.content?.find(b => b.type === 'text')?.text || '[]'
    console.log('Raw (first 300):', raw.substring(0, 300))

    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    const jsonStr = jsonMatch ? jsonMatch[0] : raw.replace(/```json|```/g, '').trim()

    let results = []
    try {
      results = JSON.parse(jsonStr)
    } catch(e) {
      console.error('Parse error:', e.message)
      return NextResponse.json({ error: 'Parse failed', raw: raw.substring(0, 300) }, { status: 500 })
    }

    return NextResponse.json({ results })
  } catch (err) {
    console.error('Route error:', err.message)
    return NextResponse.json({ error: 'Analysis failed: ' + err.message }, { status: 500 })
  }
}
