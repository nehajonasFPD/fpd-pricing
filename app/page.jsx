'use client'
import { useState } from 'react'
import * as XLSX from 'xlsx'

const TODAY = new Date().toLocaleDateString('en-GB', {
  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
})
const NEXT_REVIEW = (() => {
  const d = new Date(); d.setDate(d.getDate() + 3)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
})()

const ACTION_CFG = {
  RAISE: { label: 'Raise price', color: '#27500A', bg: '#EAF3DE', icon: '↑' },
  DROP:  { label: 'Drop price',  color: '#712B13', bg: '#FAECE7', icon: '↓' },
  DEAL:  { label: 'Run deal',    color: '#633806', bg: '#FAEEDA', icon: '%' },
  HOLD:  { label: 'Hold',        color: '#444441', bg: '#F1EFE8', icon: '—' },
  ALERT: { label: 'Stock alert', color: '#791F1F', bg: '#FCEBEB', icon: '⚠' },
}

function Badge({ action }) {
  const c = ACTION_CFG[action] || ACTION_CFG.HOLD
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11,
      fontWeight:500, padding:'3px 9px', borderRadius:20, background:c.bg, color:c.color }}>
      <span style={{ fontSize:10 }}>{c.icon}</span>{c.label}
    </span>
  )
}

function Coloured({ val, lo, hi, fmt }) {
  if (val == null || val === '' || isNaN(val)) return <span style={{ color:'#bbb' }}>—</span>
  const n = Number(val)
  const color = n < lo ? '#A32D2D' : n > hi ? '#27500A' : '#111'
  return <span style={{ color, fontWeight:(n < lo || n > hi) ? 500 : 400 }}>{fmt(n)}</span>
}

// Read any file (csv or xlsx) and return CSV string
async function fileToCSV(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (ext === 'csv') {
    return new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = e => res(e.target.result)
      r.onerror = rej
      r.readAsText(file)
    })
  }
  // xlsx / xls
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = e => {
      try {
        const wb = XLSX.read(e.target.result, { type:'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        res(XLSX.utils.sheet_to_csv(ws))
      } catch(err) { rej(err) }
    }
    r.onerror = rej
    r.readAsArrayBuffer(file)
  })
}

// For Product Bible: extract Stock ETA sheet specifically
async function productBibleToEtaCSV(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = e => {
      try {
        const wb = XLSX.read(e.target.result, { type:'array' })
        const sheetName = wb.SheetNames.find(n => n.toLowerCase().includes('stock eta')) || wb.SheetNames[0]
        const ws = wb.Sheets[sheetName]
        res(XLSX.utils.sheet_to_csv(ws))
      } catch(err) { rej(err) }
    }
    r.onerror = rej
    r.readAsArrayBuffer(file)
  })
}

function parseEtaCSV(csv) {
  if (!csv || !csv.trim()) return []
  const lines = csv.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const hdrs = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/"/g, ''))
    const row = {}
    hdrs.forEach((h, i) => { row[h] = vals[i] || '' })
    return row
  }).filter(r => r['W/C ETA'] && r['SKU'])
}

function UploadBox({ label, note, fileName, onFile, accept }) {
  const [dragging, setDragging] = useState(false)
  const id = label.replace(/\s+/g, '-')

  const handle = async (file) => {
    if (!file) return
    onFile(file)
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]) }}
      style={{
        background: dragging ? '#f0f7ff' : '#f9f9f8',
        border: `1.5px dashed ${dragging ? '#378ADD' : fileName ? '#3B6D11' : '#d0d0d0'}`,
        borderRadius: 10, padding: '16px 14px', cursor: 'pointer',
        transition: 'all .15s'
      }}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
        <span style={{ fontSize:11, fontWeight:500, color:'#555', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</span>
        {fileName && <span style={{ fontSize:10, background:'#EAF3DE', color:'#27500A', padding:'2px 7px', borderRadius:10 }}>✓ loaded</span>}
      </div>
      {note && <div style={{ fontSize:11, color:'#aaa', marginBottom:10 }}>{note}</div>}
      <label htmlFor={id} style={{ cursor:'pointer' }}>
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          padding:'10px', borderRadius:7, background: fileName ? '#EAF3DE' : '#fff',
          border:'1px solid', borderColor: fileName ? '#9FE1CB' : '#e0e0e0',
          fontSize:12, color: fileName ? '#27500A' : '#666',
        }}>
          <span style={{ fontSize:16 }}>{fileName ? '📄' : '⬆'}</span>
          <span>{fileName || 'Click to upload or drag & drop'}</span>
        </div>
        <input
          id={id} type="file" accept={accept || '.csv,.xlsx,.xls'}
          style={{ display:'none' }}
          onChange={e => handle(e.target.files[0])}
        />
      </label>
    </div>
  )
}

export default function Home() {
  const [tab, setTab]         = useState('data')
  const [files, setFiles]     = useState({ looker:null, sellerboard:null, bible:null })
  const [fileNames, setFN]    = useState({ looker:'', sellerboard:'', bible:'' })
  const [csvData, setCsvData] = useState({ looker:'', sellerboard:'', eta:'' })
  const [manual, setManual]   = useState('')
  const [results, setResults] = useState([])
  const [etaRows, setEtaRows] = useState([])
  const [filter, setFilter]   = useState('all')
  const [loading, setLoading] = useState(false)
  const [slackMsg, setSlackMsg] = useState('')
  const [error, setError]     = useState('')
  const [copied, setCopied]   = useState(false)

  const handleFile = async (key, file) => {
    setFN(prev => ({ ...prev, [key]: file.name }))
    try {
      if (key === 'bible') {
        const etaCsv = await productBibleToEtaCSV(file)
        setCsvData(prev => ({ ...prev, eta: etaCsv }))
      } else {
        const csv = await fileToCSV(file)
        setCsvData(prev => ({ ...prev, [key]: csv }))
      }
    } catch(e) {
      setError(`Could not read ${file.name} — try saving as CSV first.`)
    }
  }

  const runAnalysis = async () => {
    if (!csvData.looker && !csvData.sellerboard) {
      setError('Please upload at least the Looker CSV or Sellerboard file.'); return
    }
    setError(''); setLoading(true); setTab('results')
    const eta = parseEtaCSV(csvData.eta)
    setEtaRows(eta)
    try {
      const resp = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          looker: csvData.looker,
          sellerboard: csvData.sellerboard,
          stockEta: csvData.eta,
          manual,
        }),
      })
      const data = await resp.json()
      if (data.error) throw new Error(data.error)
      setResults(data.results)
      buildSlack(data.results, eta)
    } catch(e) {
      setError('Analysis failed — ' + e.message)
    }
    setLoading(false)
  }

  const buildSlack = (res, eta) => {
    const raise  = res.filter(r => r.action === 'RAISE')
    const drops  = res.filter(r => r.action === 'DROP')
    const deals  = res.filter(r => r.action === 'DEAL')
    const alerts = res.filter(r => r.action === 'ALERT')
    const holds  = res.filter(r => r.action === 'HOLD')

    let msg = `:bar_chart: *FPD Amazon Pricing Brief — ${TODAY}*\n`
    msg += `_${res.length} SKUs reviewed | Raise: ${raise.length} | Drop/Deal: ${drops.length + deals.length} | Alerts: ${alerts.length}_\n\n`

    if (alerts.length) {
      msg += `:rotating_light: *STOCK ALERTS — action needed today*\n`
      alerts.forEach(r => {
        msg += `• *${r.sku}* — ${r.dos ?? '?'}d DOS | Stock: ${r.current_stock != null ? Number(r.current_stock).toLocaleString() : '?'}\n`
      })
      msg += '\n'
    }
    if (raise.length) {
      msg += `:green_circle: *RAISE PRICE (${raise.length} SKUs)*\n`
      raise.forEach(r => {
        const parts = [r.reasoning]
        if (r.margin_pct != null) parts.push(`Margin ${r.margin_pct.toFixed(1)}%`)
        if (r.dos != null) parts.push(`${r.dos}d DOS`)
        if (r.avg_price != null) parts.push(`@£${Number(r.avg_price).toFixed(2)}`)
        msg += `• *${r.sku}* — ${parts.join(' | ')}\n`
      })
      msg += '\n'
    }
    if (drops.length) {
      msg += `:red_circle: *DROP PRICE (${drops.length} SKUs)*\n`
      drops.forEach(r => {
        const parts = [r.reasoning]
        if (r.net_profit != null) parts.push(`NP £${Number(r.net_profit).toFixed(0)}`)
        if (r.margin_pct != null) parts.push(`${r.margin_pct.toFixed(1)}% margin`)
        msg += `• *${r.sku}* — ${parts.join(' | ')}\n`
      })
      msg += '\n'
    }
    if (deals.length) {
      msg += `:yellow_circle: *RUN DEAL (${deals.length} SKUs)*\n`
      deals.forEach(r => {
        const parts = [r.reasoning]
        if (r.real_acos_pct != null) parts.push(`ACOS ${r.real_acos_pct.toFixed(1)}%`)
        if (r.dos != null) parts.push(`${r.dos}d DOS`)
        msg += `• *${r.sku}* — ${parts.join(' | ')}\n`
      })
      msg += '\n'
    }
    if (holds.length) {
      msg += `:white_circle: *HOLD (${holds.length} SKUs)*\n`
      holds.slice(0, 6).forEach(r => msg += `• ${r.sku}${r.product_line ? ` — ${r.product_line}` : ''}\n`)
      if (holds.length > 6) msg += `• _...and ${holds.length - 6} more_\n`
      msg += '\n'
    }
    if (eta.length > 0) {
      const today = new Date().toISOString().split('T')[0]
      const upcoming = eta.filter(r => r['W/C ETA'] >= today)
      if (upcoming.length > 0) {
        msg += `:package: *Incoming stock*\n`
        const byDate = {}
        upcoming.forEach(r => { const d = r['W/C ETA']; if (!byDate[d]) byDate[d] = []; byDate[d].push(r) })
        Object.keys(byDate).sort().slice(0, 3).forEach(date => {
          const label = new Date(date).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })
          msg += `*W/C ${label}:* `
          msg += byDate[date].slice(0, 5).map(r => {
            const bs = r['Back in Stock?'] === 'Back in Stock' ? ' ✅' : ''
            return `${r.SKU} (${Number(r.Qty || 0).toLocaleString()})${bs}`
          }).join(', ') + '\n'
        })
        msg += '\n'
      }
    }
    msg += `_Next review: ${NEXT_REVIEW}_`
    setSlackMsg(msg)
  }

  const filtered = filter === 'all'  ? results
    : filter === 'raise' ? results.filter(r => r.action === 'RAISE')
    : filter === 'drop'  ? results.filter(r => r.action === 'DROP' || r.action === 'DEAL')
    : filter === 'hold'  ? results.filter(r => r.action === 'HOLD')
    : results.filter(r => r.action === 'ALERT')

  const TabBtn = ({ k, label }) => (
    <button onClick={() => setTab(k)} style={{
      fontSize:13, padding:'7px 16px', border:'none',
      borderBottom: tab === k ? '2px solid #111' : '2px solid transparent',
      background:'transparent', cursor:'pointer',
      fontWeight: tab === k ? 500 : 400, color: tab === k ? '#111' : '#888',
    }}>{label}</button>
  )

  const FilterBtn = ({ f, label }) => (
    <button onClick={() => setFilter(f)} style={{
      fontSize:12, padding:'4px 12px', borderRadius:20, cursor:'pointer', border:'1px solid',
      borderColor: filter === f ? '#111' : '#ddd',
      background: filter === f ? '#111' : 'transparent',
      color: filter === f ? '#fff' : '#666',
    }}>{label}</button>
  )

  const readyCount = [csvData.looker, csvData.sellerboard].filter(Boolean).length

  return (
    <div style={{ maxWidth:980, margin:'0 auto', padding:'1.5rem 1rem', fontFamily:'system-ui,-apple-system,sans-serif' }}>
      <style>{`* { box-sizing:border-box } @keyframes spin { to { transform:rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' }}>
        <div>
          <div style={{ fontSize:11, fontWeight:500, color:'#aaa', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:3 }}>FPD Pricing Intelligence</div>
          <div style={{ fontSize:19, fontWeight:500, color:'#111' }}>Amazon UK Repricing Brief</div>
        </div>
        <div style={{ fontSize:12, color:'#888', background:'#f5f5f3', padding:'4px 10px', borderRadius:6, marginTop:4 }}>{TODAY}</div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid #e5e5e5', marginBottom:'1.5rem' }}>
        <TabBtn k="data" label="Data inputs" />
        <TabBtn k="results" label="Recommendations" />
        <TabBtn k="slack" label="Slack message" />
      </div>

      {/* DATA TAB */}
      {tab === 'data' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:12, marginBottom:16 }}>
            <UploadBox
              label="Looker Studio CSV ★"
              note="Export for your date range — provides DOS and live stock"
              fileName={fileNames.looker}
              onFile={f => handleFile('looker', f)}
              accept=".csv"
            />
            <UploadBox
              label="Sellerboard export ★"
              note="Dashboard → Products → Export. CSV or xlsx both work"
              fileName={fileNames.sellerboard}
              onFile={f => handleFile('sellerboard', f)}
              accept=".csv,.xlsx,.xls"
            />
            <UploadBox
              label="Product Bible (Stock ETA)"
              note="Upload the full xlsx — the Stock ETA sheet will be extracted automatically"
              fileName={fileNames.bible}
              onFile={f => handleFile('bible', f)}
              accept=".xlsx,.xls"
            />
            <div style={{ background:'#f9f9f8', border:'1.5px dashed #d0d0d0', borderRadius:10, padding:'16px 14px' }}>
              <div style={{ fontSize:11, fontWeight:500, color:'#555', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Manual notes (optional)</div>
              <div style={{ fontSize:11, color:'#aaa', marginBottom:8 }}>CEO targets, seasonal flags, anything to factor in</div>
              <textarea
                value={manual}
                onChange={e => setManual(e.target.value)}
                placeholder="e.g. Hold pricing on gas stoves until June restock. Push ironing board deal this week..."
                style={{ width:'100%', height:82, fontSize:12, resize:'vertical',
                  border:'1px solid #e0e0e0', borderRadius:6, background:'#fff',
                  color:'#111', padding:'7px 9px', lineHeight:1.5 }}
              />
            </div>
          </div>

          {error && <div style={{ fontSize:13, color:'#712B13', marginBottom:12 }}>{error}</div>}

          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={runAnalysis} disabled={readyCount === 0} style={{
              fontSize:13, fontWeight:500, padding:'9px 22px', borderRadius:7,
              border:'none', background:'#111', color:'#fff', cursor: readyCount > 0 ? 'pointer' : 'not-allowed',
              opacity: readyCount > 0 ? 1 : 0.4,
            }}>✦ Analyse &amp; recommend</button>
            {readyCount > 0 && (
              <span style={{ fontSize:12, color:'#27500A' }}>{readyCount} source{readyCount > 1 ? 's' : ''} ready</span>
            )}
          </div>
          <div style={{ fontSize:12, color:'#bbb', marginTop:10 }}>
            Looker + Sellerboard are required. Product Bible adds the incoming stock calendar to the Slack message.
          </div>
        </div>
      )}

      {/* RESULTS TAB */}
      {tab === 'results' && (
        <div>
          {loading ? (
            <div style={{ display:'flex', alignItems:'center', gap:10, color:'#888', padding:'2.5rem 0', fontSize:13 }}>
              <div style={{ width:16, height:16, border:'2px solid #e0e0e0', borderTopColor:'#111', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
              Merging your data and scoring each SKU…
            </div>
          ) : (
            <>
              <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
                {[
                  { label:'SKUs reviewed', val:results.length || '—', color:'#111' },
                  { label:'Raise price',   val:results.filter(r => r.action === 'RAISE').length || '—', color:'#27500A' },
                  { label:'Drop / deal',   val:results.filter(r => r.action === 'DROP' || r.action === 'DEAL').length || '—', color:'#712B13' },
                  { label:'Stock alerts',  val:results.filter(r => r.action === 'ALERT').length || '—', color:'#993C1D' },
                ].map(k => (
                  <div key={k.label} style={{ background:'#f5f5f3', borderRadius:8, padding:'12px 14px', flex:1, minWidth:100 }}>
                    <div style={{ fontSize:11, color:'#888', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{k.label}</div>
                    <div style={{ fontSize:22, fontWeight:500, color:k.color }}>{k.val}</div>
                  </div>
                ))}
              </div>

              {results.length > 0 && (
                <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
                  <FilterBtn f="all" label="All" />
                  <FilterBtn f="raise" label="Raise price" />
                  <FilterBtn f="drop" label="Drop / deal" />
                  <FilterBtn f="hold" label="Hold" />
                  <FilterBtn f="alert" label="Stock alerts" />
                </div>
              )}

              {results.length === 0 ? (
                <div style={{ textAlign:'center', padding:'3rem 1rem', color:'#bbb', fontSize:13 }}>
                  <div style={{ fontSize:26, marginBottom:8 }}>◫</div>Upload files and run analysis first
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign:'center', padding:'2rem', color:'#bbb', fontSize:13 }}>No SKUs match this filter</div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, tableLayout:'fixed' }}>
                    <colgroup>
                      <col style={{width:'19%'}}/><col style={{width:'12%'}}/><col style={{width:'8%'}}/>
                      <col style={{width:'7%'}}/><col style={{width:'7%'}}/><col style={{width:'7%'}}/>
                      <col style={{width:'8%'}}/><col style={{width:'7%'}}/><col style={{width:'7%'}}/>
                      <col style={{width:'18%'}}/>
                    </colgroup>
                    <thead>
                      <tr style={{ borderBottom:'1px solid #e8e8e8' }}>
                        {['SKU','Action','DOS','Margin','ACOS','BSR','Net P&L','Price','Stock','Reasoning'].map(h => (
                          <th key={h} style={{ fontSize:11, fontWeight:500, color:'#888', textAlign:'left', padding:'6px 8px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r, i) => (
                        <tr key={i} style={{ borderBottom:'1px solid #f0f0f0' }}>
                          <td style={{ padding:'9px 8px', fontFamily:'monospace', fontSize:11, color:'#555', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.sku || '—'}</td>
                          <td style={{ padding:'9px 8px' }}><Badge action={r.action} /></td>
                          <td style={{ padding:'9px 8px', fontWeight:r.dos!=null&&r.dos<15?600:400, color:r.dos!=null&&r.dos<15?'#A32D2D':'#111' }}>{r.dos != null ? r.dos+'d' : '—'}</td>
                          <td style={{ padding:'9px 8px' }}><Coloured val={r.margin_pct} lo={8} hi={25} fmt={v => v.toFixed(1)+'%'} /></td>
                          <td style={{ padding:'9px 8px' }}><Coloured val={r.real_acos_pct} lo={0} hi={9} fmt={v => v.toFixed(1)+'%'} /></td>
                          <td style={{ padding:'9px 8px', fontSize:11, color:'#888' }}>{r.bsr ? Number(r.bsr).toLocaleString() : '—'}</td>
                          <td style={{ padding:'9px 8px', color:r.net_profit!=null?(r.net_profit<0?'#A32D2D':'#27500A'):'#bbb', fontWeight:r.net_profit!=null&&Math.abs(r.net_profit)>500?500:400 }}>{r.net_profit != null ? '£'+Number(r.net_profit).toFixed(0) : '—'}</td>
                          <td style={{ padding:'9px 8px' }}>{r.avg_price != null ? '£'+Number(r.avg_price).toFixed(2) : '—'}</td>
                          <td style={{ padding:'9px 8px', fontSize:11 }}>{r.current_stock != null ? Number(r.current_stock).toLocaleString() : '—'}</td>
                          <td style={{ padding:'9px 8px', fontSize:11, color:'#666', lineHeight:1.4, whiteSpace:'normal' }}>{r.reasoning || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {results.length > 0 && (
                <div style={{ marginTop:14 }}>
                  <button onClick={() => { buildSlack(results, etaRows); setTab('slack') }} style={{
                    fontSize:13, padding:'8px 16px', borderRadius:7,
                    border:'1px solid #ddd', background:'transparent', color:'#444', cursor:'pointer'
                  }}># Generate Slack message</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* SLACK TAB */}
      {tab === 'slack' && (
        <div>
          <div style={{ fontSize:13, color:'#888', marginBottom:12 }}>Ready to paste into <strong>#ppc</strong>.</div>
          <div style={{ background:'#f9f9f8', border:'1px solid #e8e8e8', borderRadius:10, padding:'1rem 1.25rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <span style={{ fontSize:15, color:'#555' }}>#</span>
              <span style={{ fontSize:13, fontWeight:500 }}>ppc</span>
              <span style={{ fontSize:11, color:'#bbb' }}>FPD pricing brief</span>
            </div>
            <pre style={{ fontFamily:'monospace', fontSize:12, color:'#333', whiteSpace:'pre-wrap', lineHeight:1.8,
              border:'1px solid #e8e8e8', borderRadius:6, background:'#fff', padding:12,
              minHeight:80, maxHeight:400, overflowY:'auto', margin:0 }}>
              {slackMsg || 'Run analysis first, then come back here.'}
            </pre>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:12, alignItems:'center' }}>
            <button onClick={() => { navigator.clipboard.writeText(slackMsg).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500) }) }}
              disabled={!slackMsg} style={{
                fontSize:13, fontWeight:500, padding:'8px 18px', borderRadius:7,
                border:'none', background:'#111', color:'#fff', cursor:'pointer', opacity:slackMsg?1:0.4
              }}>Copy message</button>
            {copied && <span style={{ fontSize:12, color:'#27500A' }}>Copied ✓</span>}
          </div>

          {etaRows.length > 0 && (() => {
            const today = new Date().toISOString().split('T')[0]
            const upcoming = etaRows.filter(r => r['W/C ETA'] >= today)
            if (!upcoming.length) return null
            return (
              <div style={{ marginTop:20 }}>
                <div style={{ fontSize:12, fontWeight:500, color:'#666', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>Incoming stock calendar</div>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid #e8e8e8' }}>
                      {['SKU','Description','Qty','W/C ETA','Status'].map(h => (
                        <th key={h} style={{ fontSize:11, fontWeight:500, color:'#888', textAlign:'left', padding:'5px 8px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.slice(0, 25).map((r, i) => (
                      <tr key={i} style={{ borderBottom:'1px solid #f5f5f5' }}>
                        <td style={{ padding:'7px 8px', fontFamily:'monospace', fontSize:11, color:'#555' }}>{r.SKU || '—'}</td>
                        <td style={{ padding:'7px 8px', color:'#666', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r['Product Description'] || '—'}</td>
                        <td style={{ padding:'7px 8px' }}>{Number(r.Qty || 0).toLocaleString()}</td>
                        <td style={{ padding:'7px 8px', fontWeight:500 }}>{r['W/C ETA']}</td>
                        <td style={{ padding:'7px 8px' }}>
                          {r['Back in Stock?'] === 'Back in Stock'
                            ? <span style={{ fontSize:11, background:'#EAF3DE', color:'#27500A', padding:'2px 7px', borderRadius:10 }}>Back in stock</span>
                            : <span style={{ fontSize:11, color:'#bbb' }}>Incoming</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
