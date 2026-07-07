import { NextResponse } from 'next/server'

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
    console.log(`Parsed: ${lsRows.length} Looker, ${sbRows.length} Sellerboard rows`)

    const sbByAsin = {}
    sbRows.forEach(r => { if (r.ASIN) sbByAsin[r.ASIN.trim()] = r })

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

    const top25 = merged.sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0)).slice(0, 25)
    console.log(`Scoring ${top25.length} SKUs`)

    // Compact pipe-separated list — only what Claude needs to score
    const skuList = top25.map(r =>
      `${r.sku}|dos:${r.dos?.toFixed(0)??'null'}|np:${r.net_profit?.toFixed(0)??'null'}|margin:${r.margin?.toFixed(1)??'null'}|acos:${r.real_acos?.toFixed(1)??'null'}|sessions:${r.sessions??'null'}`
    ).join('\n')

    // Ask Claude ONLY for sku + action + reasoning — everything else comes from our data
    const prompt = `Score each SKU for Amazon UK pricing. Rules (priority order):
1. ALERT  — dos < 15
2. RAISE  — np > 0 AND margin > 22 AND acos < 9 AND dos >= 25
3. DROP   — np < 0 OR (margin < 8 AND dos >= 45)
4. DEAL   — (acos > 14 AND sessions > 500) OR (dos >= 60 AND margin < 18)
5. HOLD   — everything else
margin and acos are in %. np = net profit.
${manual ? `Note: ${manual}` : ''}

${skuList}

Reply ONLY with a JSON array, no markdown:
[{"sku":"exact sku name","action":"RAISE|DROP|DEAL|HOLD|ALERT","reasoning":"max 6 words"}]`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.APEX_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    console.log('stop_reason:', data.stop_reason, '| type:', data.type)
    const raw = data.content?.find(b => b.type === 'text')?.text || '[]'
    console.log('Raw (first 200):', raw.substring(0, 200))

    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    const jsonStr = jsonMatch ? jsonMatch[0] : raw.replace(/```json|```/g, '').trim()

    let scored = []
    try {
      scored = JSON.parse(jsonStr)
    } catch(e) {
      console.error('Parse error:', e.message, '| raw:', raw.substring(0, 200))
      return NextResponse.json({ error: 'Parse failed: ' + e.message, raw: raw.substring(0, 200) }, { status: 500 })
    }

    // Enrich Claude's minimal response with our full data
    const skuMap = {}
    top25.forEach(r => { skuMap[r.sku] = r })

    const results = scored.map(s => {
      const d = skuMap[s.sku] || {}
      return {
        sku:           s.sku,
        asin:          d.asin || '',
        product_line:  d.product_line || '',
        action:        s.action,
        reasoning:     s.reasoning,
        bsr:           d.bsr,
        margin_pct:    d.margin,
        real_acos_pct: d.real_acos,
        dos:           d.dos,
        net_profit:    d.net_profit,
        avg_price:     d.avg_price,
        units:         d.units,
        current_stock: d.current_stock,
      }
    })

    console.log(`Returning ${results.length} results`)
    return NextResponse.json({ results })
  } catch (err) {
    console.error('Route error:', err.message)
    return NextResponse.json({ error: 'Analysis failed: ' + err.message }, { status: 500 })
  }
}
