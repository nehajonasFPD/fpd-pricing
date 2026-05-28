'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const GREEN  = '#4ADE80'
const BORDER = '#1E2240'
const CARD   = '#13152A'
const DIM    = '#8B90A0'

const TODAY = new Date().toLocaleDateString('en-GB', {
  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
})
const NEXT_REVIEW = (() => {
  const d = new Date(); d.setDate(d.getDate() + 3)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
})()

const ACTION_CFG = {
  RAISE: { label:'Raise price', color:'#4ADE80', bg:'rgba(74,222,128,0.1)',  icon:'↑' },
  DROP:  { label:'Drop price',  color:'#F87171', bg:'rgba(248,113,113,0.1)', icon:'↓' },
  DEAL:  { label:'Run deal',    color:'#FBBF24', bg:'rgba(251,191,36,0.1)',  icon:'%' },
  HOLD:  { label:'Hold',        color:'#94A3B8', bg:'rgba(148,163,184,0.1)', icon:'—' },
  ALERT: { label:'Stock alert', color:'#FB923C', bg:'rgba(251,146,60,0.1)',  icon:'⚠' },
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

function Cell({ val, lo, hi, fmt }) {
  if (val == null || isNaN(val)) return <span style={{ color:'#444' }}>—</span>
  const n = Number(val)
  const color = n < lo ? '#F87171' : n > hi ? '#4ADE80' : '#CBD5E1'
  return <span style={{ color, fontWeight:(n < lo || n > hi) ? 500 : 400 }}>{fmt(n)}</span>
}

async function uploadFile(key, file) {
  const fd = new FormData()
  fd.append(key, file)
  const resp = await fetch('/api/upload', { method: 'POST', body: fd })
  const data = await resp.json()
  if (data.error) throw new Error(data.error)
  return data[key] || ''
}

function parseEtaCSV(csv) {
  if (!csv || !csv.trim()) return []
  const lines = csv.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const hdrs = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/"/g, ''))
    const row = {}; hdrs.forEach((h, i) => { row[h] = vals[i] || '' }); return row
  }).filter(r => r['W/C ETA'] && r['SKU'])
}

function UploadBox({ label, note, fileName, onFile, accept }) {
  const [drag, setDrag] = useState(false)
  const id = 'upload-' + label.replace(/\s+/g, '-')
  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); if(e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]) }}
      style={{ background:drag?'#0f1e38':CARD, border:`1.5px dashed ${drag?'#378ADD':fileName?'#16a34a':BORDER}`, borderRadius:10, padding:'16px 14px', transition:'all .15s' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
        <span style={{ fontSize:11, fontWeight:500, color:DIM, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</span>
        {fileName && <span style={{ fontSize:10, background:'rgba(74,222,128,0.1)', color:GREEN, padding:'2px 7px', borderRadius:10 }}>✓ loaded</span>}
      </div>
      {note && <div style={{ fontSize:11, color:'#444E6A', marginBottom:8 }}>{note}</div>}
      <label htmlFor={id} style={{ cursor:'pointer' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px', borderRadius:7,
          background:fileName?'rgba(74,222,128,0.06)':'rgba(255,255,255,0.03)', border:`1px solid ${fileName?'#16a34a':BORDER}`,
          fontSize:12, color:fileName?GREEN:DIM }}>
          <span style={{ fontSize:16 }}>{fileName?'📄':'⬆'}</span>
          <span>{fileName||'Click to upload or drag & drop'}</span>
        </div>
        <input id={id} type="file" accept={accept||'.csv,.xlsx,.xls'} style={{ display:'none' }} onChange={e => { if(e.target.files[0]) onFile(e.target.files[0]) }} />
      </label>
    </div>
  )
}

// ── CHAT WINDOW ──────────────────────────────────────────────
function ChatWindow({ context, onClose }) {
  const [messages, setMessages] = useState([
    { role:'assistant', content:"Hi — I'm APEX. Ask me anything about this pricing brief. Try: *\"Which SKUs should we raise first?\"* or *\"What's arriving next week?\"*" }
  ])
  const [input, setInput]   = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])
  useEffect(() => { inputRef.current?.focus() }, [])

  const SUGGESTIONS = [
    'Which SKUs should we raise first?',
    'Show me the worst loss-makers',
    'What stock is running low?',
    'Which deals should we run this week?',
  ]

  const send = async (text) => {
    const content = text || input.trim()
    if (!content) return
    setInput('')
    const userMsg = { role:'user', content }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setThinking(true)
    try {
      const resp = await fetch('/api/chat', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          messages: updated.map(m => ({ role:m.role, content:m.content })),
          context,
        })
      })
      const data = await resp.json()
      setMessages(prev => [...prev, { role:'assistant', content: data.reply || data.error || 'Something went wrong.' }])
    } catch(e) {
      setMessages(prev => [...prev, { role:'assistant', content:'Network error — please try again.' }])
    }
    setThinking(false)
  }

  const renderMsg = (text) => text.replace(/\*([^*]+)\*/g, '<strong>$1</strong>')

  return (
    <div style={{ position:'fixed', bottom:88, right:24, width:380, height:520,
      background:'#0D0F1C', border:`1px solid ${BORDER}`, borderRadius:16,
      boxShadow:'0 24px 80px rgba(0,0,0,0.6)', display:'flex', flexDirection:'column',
      zIndex:1000, overflow:'hidden' }}>

      {/* Chat header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'14px 16px', borderBottom:`1px solid ${BORDER}`, background:CARD, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'rgba(74,222,128,0.1)',
            border:`1px solid rgba(74,222,128,0.2)`, display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:14, color:GREEN, fontWeight:700 }}>A</div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>APEX</div>
            <div style={{ fontSize:11, color:GREEN, display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:GREEN, display:'inline-block' }}/>
              {context ? 'Brief loaded' : 'No data yet'}
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', color:DIM,
          cursor:'pointer', fontSize:18, lineHeight:1, padding:4 }}>×</button>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent: m.role==='user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth:'85%', padding:'10px 14px', borderRadius: m.role==='user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              background: m.role==='user' ? 'rgba(74,222,128,0.12)' : CARD,
              border: `1px solid ${m.role==='user' ? 'rgba(74,222,128,0.2)' : BORDER}`,
              fontSize:13, color:'#CBD5E1', lineHeight:1.6,
            }} dangerouslySetInnerHTML={{ __html: renderMsg(m.content) }} />
          </div>
        ))}
        {thinking && (
          <div style={{ display:'flex', justifyContent:'flex-start' }}>
            <div style={{ padding:'10px 14px', borderRadius:'14px 14px 14px 4px',
              background:CARD, border:`1px solid ${BORDER}`, display:'flex', gap:4, alignItems:'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:DIM,
                  animation:`bounce 1s ease-in-out ${i*0.15}s infinite` }}/>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions — only show at start */}
      {messages.length === 1 && (
        <div style={{ padding:'0 12px 8px', display:'flex', flexWrap:'wrap', gap:6, flexShrink:0 }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)} style={{
              fontSize:11, padding:'5px 10px', borderRadius:20, cursor:'pointer',
              border:`1px solid ${BORDER}`, background:'transparent', color:DIM,
              transition:'all .15s'
            }}>{s}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding:'12px', borderTop:`1px solid ${BORDER}`, flexShrink:0 }}>
        <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Ask about your pricing data..."
            rows={1}
            style={{ flex:1, fontSize:13, padding:'9px 12px', borderRadius:8, resize:'none',
              border:`1px solid ${BORDER}`, background:'#0A0C18', color:'#CBD5E1',
              lineHeight:1.5, outline:'none', maxHeight:80, overflowY:'auto' }}
          />
          <button onClick={() => send()} disabled={!input.trim() || thinking} style={{
            width:36, height:36, borderRadius:8, border:'none', cursor:'pointer',
            background: input.trim() && !thinking ? GREEN : BORDER,
            color: input.trim() && !thinking ? '#0D0F1C' : DIM,
            fontSize:16, display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0, transition:'all .15s'
          }}>↑</button>
        </div>
        <div style={{ fontSize:10, color:'#333', marginTop:6, textAlign:'center' }}>Enter to send · Shift+Enter for new line</div>
      </div>
    </div>
  )
}

// ── MAIN DASHBOARD ───────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter()
  const [tab, setTab]           = useState('data')
  const [fileNames, setFN]      = useState({ looker:'', sellerboard:'', bible:'' })
  const [csvData, setCsvData]   = useState({ looker:'', sellerboard:'', eta:'' })
  const [manual, setManual]     = useState('')
  const [results, setResults]   = useState([])
  const [etaRows, setEtaRows]   = useState([])
  const [filter, setFilter]     = useState('all')
  const [loading, setLoading]   = useState(false)
  const [slackMsg, setSlackMsg] = useState('')
  const [error, setError]       = useState('')
  const [copied, setCopied]     = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  const handleFile = async (key, file) => {
    setFN(prev => ({ ...prev, [key]: file.name }))
    setError('')
    try {
      const csv = await uploadFile(key, file)
      if (key === 'bible') {
        setCsvData(prev => ({ ...prev, eta: csv }))
      } else {
        setCsvData(prev => ({ ...prev, [key]: csv }))
      }
      console.log(`Loaded ${key}: ${csv.length} chars`)
    } catch(e) {
      setError(`Could not read ${file.name}: ${e.message}`)
    }
  }

  // Build a readable context string for the chat
  const buildChatContext = () => {
    if (!results.length) return null
    const raise  = results.filter(r => r.action==='RAISE')
    const drops  = results.filter(r => r.action==='DROP')
    const deals  = results.filter(r => r.action==='DEAL')
    const alerts = results.filter(r => r.action==='ALERT')
    const holds  = results.filter(r => r.action==='HOLD')
    let ctx = `Date: ${TODAY}\nTotal SKUs reviewed: ${results.length}\n\n`
    const fmt = (arr, label) => {
      if (!arr.length) return ''
      let s = `${label} (${arr.length}):\n`
      arr.forEach(r => {
        s += `- ${r.sku}`
        if (r.product_line) s += ` (${r.product_line})`
        if (r.net_profit != null) s += ` | NP: £${Number(r.net_profit).toFixed(0)}`
        if (r.margin_pct != null) s += ` | Margin: ${r.margin_pct.toFixed(1)}%`
        if (r.real_acos_pct != null) s += ` | ACOS: ${r.real_acos_pct.toFixed(1)}%`
        if (r.dos != null) s += ` | DOS: ${r.dos}d`
        if (r.bsr != null) s += ` | BSR: ${Number(r.bsr).toLocaleString()}`
        if (r.avg_price != null) s += ` | Price: £${Number(r.avg_price).toFixed(2)}`
        if (r.reasoning) s += ` | Note: ${r.reasoning}`
        s += '\n'
      })
      return s + '\n'
    }
    ctx += fmt(alerts, 'STOCK ALERTS')
    ctx += fmt(raise, 'RAISE PRICE')
    ctx += fmt(drops, 'DROP PRICE')
    ctx += fmt(deals, 'RUN DEAL')
    ctx += fmt(holds, 'HOLD')
    if (etaRows.length) {
      const today = new Date().toISOString().split('T')[0]
      const upcoming = etaRows.filter(r => r['W/C ETA'] >= today)
      if (upcoming.length) {
        ctx += `INCOMING STOCK (${upcoming.length} lines):\n`
        upcoming.slice(0,20).forEach(r => {
          ctx += `- ${r.SKU} | Qty: ${r.Qty} | ETA: ${r['W/C ETA']} | ${r['Back in Stock?']||'Incoming'}\n`
        })
      }
    }
    return ctx
  }

  const runAnalysis = async () => {
    if (!csvData.looker && !csvData.sellerboard) { setError('Please upload at least the Looker CSV or Sellerboard file.'); return }
    setError(''); setLoading(true); setTab('results')
    const eta = parseEtaCSV(csvData.eta); setEtaRows(eta)
    try {
      const resp = await fetch('/api/analyse', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ looker:csvData.looker, sellerboard:csvData.sellerboard, stockEta:csvData.eta, manual }),
      })
      const data = await resp.json()
      if (data.error) throw new Error(data.error + (data.raw ? ' | Raw: ' + data.raw : ''))
      if (!data.results || data.results.length === 0) {
        setError('Analysis returned no results. Check that your files contain data and try again.')
        setLoading(false); return
      }
      setResults(data.results); buildSlack(data.results, eta)
    } catch(e) { setError('Analysis failed — ' + e.message) }
    setLoading(false)
  }

  const buildSlack = (res, eta) => {
    const raise=res.filter(r=>r.action==='RAISE'), drops=res.filter(r=>r.action==='DROP'),
          deals=res.filter(r=>r.action==='DEAL'), alerts=res.filter(r=>r.action==='ALERT'),
          holds=res.filter(r=>r.action==='HOLD')
    let msg = `:bar_chart: *APEX Pricing Brief — ${TODAY}*\n_${res.length} SKUs | Raise: ${raise.length} | Drop/Deal: ${drops.length+deals.length} | Alerts: ${alerts.length}_\n\n`
    if (alerts.length) { msg+=`:rotating_light: *STOCK ALERTS*\n`; alerts.forEach(r=>{msg+=`• *${r.sku}* — ${r.dos??'?'}d DOS\n`}); msg+='\n' }
    if (raise.length) { msg+=`:green_circle: *RAISE PRICE (${raise.length})*\n`; raise.forEach(r=>{const p=[r.reasoning];if(r.margin_pct!=null)p.push(`Margin ${r.margin_pct.toFixed(1)}%`);if(r.dos!=null)p.push(`${r.dos}d DOS`);if(r.avg_price!=null)p.push(`@£${Number(r.avg_price).toFixed(2)}`);msg+=`• *${r.sku}* — ${p.join(' | ')}\n`}); msg+='\n' }
    if (drops.length) { msg+=`:red_circle: *DROP PRICE (${drops.length})*\n`; drops.forEach(r=>{const p=[r.reasoning];if(r.net_profit!=null)p.push(`NP £${Number(r.net_profit).toFixed(0)}`);msg+=`• *${r.sku}* — ${p.join(' | ')}\n`}); msg+='\n' }
    if (deals.length) { msg+=`:yellow_circle: *RUN DEAL (${deals.length})*\n`; deals.forEach(r=>{const p=[r.reasoning];if(r.real_acos_pct!=null)p.push(`ACOS ${r.real_acos_pct.toFixed(1)}%`);msg+=`• *${r.sku}* — ${p.join(' | ')}\n`}); msg+='\n' }
    if (holds.length) { msg+=`:white_circle: *HOLD (${holds.length})*\n`; holds.slice(0,6).forEach(r=>msg+=`• ${r.sku}\n`); if(holds.length>6)msg+=`• _...and ${holds.length-6} more_\n`; msg+='\n' }
    if (eta.length) {
      const today=new Date().toISOString().split('T')[0], upcoming=eta.filter(r=>r['W/C ETA']>=today)
      if (upcoming.length) {
        msg+=`:package: *Incoming stock*\n`
        const byDate={}; upcoming.forEach(r=>{const d=r['W/C ETA'];if(!byDate[d])byDate[d]=[];byDate[d].push(r)})
        Object.keys(byDate).sort().slice(0,3).forEach(date=>{
          const label=new Date(date).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})
          msg+=`*W/C ${label}:* `+byDate[date].slice(0,5).map(r=>`${r.SKU} (${Number(r.Qty||0).toLocaleString()})${r['Back in Stock?']==='Back in Stock'?' ✅':''}`).join(', ')+'\n'
        })
        msg+='\n'
      }
    }
    msg+=`_Next review: ${NEXT_REVIEW}_`; setSlackMsg(msg)
  }

  const filtered = filter==='all'?results:filter==='raise'?results.filter(r=>r.action==='RAISE'):filter==='drop'?results.filter(r=>r.action==='DROP'||r.action==='DEAL'):filter==='hold'?results.filter(r=>r.action==='HOLD'):results.filter(r=>r.action==='ALERT')
  const readyCount = [csvData.looker, csvData.sellerboard].filter(Boolean).length
  const chatContext = buildChatContext()

  const TabBtn = ({ k, label }) => (
    <button onClick={()=>setTab(k)} style={{ fontSize:13, padding:'8px 16px', border:'none', borderBottom:tab===k?`2px solid ${GREEN}`:'2px solid transparent', background:'transparent', cursor:'pointer', fontWeight:tab===k?500:400, color:tab===k?'#fff':DIM }}>{label}</button>
  )
  const FilterBtn = ({ f, label }) => (
    <button onClick={()=>setFilter(f)} style={{ fontSize:12, padding:'4px 12px', borderRadius:20, cursor:'pointer', border:'1px solid', borderColor:filter===f?GREEN:BORDER, background:filter===f?'rgba(74,222,128,0.1)':'transparent', color:filter===f?GREEN:DIM }}>{label}</button>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#0D0F1C' }}>
      <style>{`
        * { box-sizing:border-box }
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
        textarea:focus { outline: 1px solid ${BORDER}; }
        ::-webkit-scrollbar { width:4px; height:4px }
        ::-webkit-scrollbar-track { background:transparent }
        ::-webkit-scrollbar-thumb { background:#1E2240; border-radius:4px }
      `}</style>

      {/* NAV */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 2rem', height:56, borderBottom:`1px solid ${BORDER}`, background:'rgba(13,15,28,0.95)', position:'sticky', top:0, zIndex:200 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <button onClick={()=>router.push('/')} style={{ background:'none', border:'none', cursor:'pointer' }}>
            <span style={{ fontWeight:700, fontSize:16, letterSpacing:'0.04em', color:'#fff' }}>APEX</span>
          </button>
          <span style={{ color:BORDER }}>|</span>
          <span style={{ fontSize:13, color:DIM }}>Amazon UK Repricing Brief</span>
        </div>
        <div style={{ fontSize:12, color:DIM, background:CARD, padding:'4px 12px', borderRadius:6, border:`1px solid ${BORDER}` }}>{TODAY}</div>
      </nav>

      <div style={{ maxWidth:980, margin:'0 auto', padding:'2rem 1rem' }}>
        <div style={{ display:'flex', borderBottom:`1px solid ${BORDER}`, marginBottom:'1.5rem' }}>
          <TabBtn k="data" label="Data inputs" />
          <TabBtn k="results" label="Recommendations" />
          <TabBtn k="slack" label="Slack message" />
        </div>

        {/* DATA TAB */}
        {tab==='data' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:12, marginBottom:16 }}>
              <UploadBox label="Looker Studio CSV ★" note="Export for date range — provides DOS and live stock" fileName={fileNames.looker} onFile={f=>handleFile('looker',f)} accept=".csv" />
              <UploadBox label="Sellerboard export ★" note="Dashboard → Products → Export. CSV or xlsx both work" fileName={fileNames.sellerboard} onFile={f=>handleFile('sellerboard',f)} accept=".csv,.xlsx,.xls" />
              <UploadBox label="Product Bible (Stock ETA)" note="Upload full xlsx — Stock ETA sheet extracted automatically" fileName={fileNames.bible} onFile={f=>handleFile('bible',f)} accept=".xlsx,.xls" />
              <div style={{ background:CARD, border:`1.5px dashed ${BORDER}`, borderRadius:10, padding:'16px 14px' }}>
                <div style={{ fontSize:11, fontWeight:500, color:DIM, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Manual notes (optional)</div>
                <div style={{ fontSize:11, color:'#444E6A', marginBottom:8 }}>CEO targets, seasonal flags, anything extra</div>
                <textarea value={manual} onChange={e=>setManual(e.target.value)} placeholder="e.g. Hold pricing on gas stoves until June restock..."
                  style={{ width:'100%', height:82, fontSize:12, resize:'vertical', border:`1px solid ${BORDER}`, borderRadius:6, background:'#0D0F1C', color:'#CBD5E1', padding:'7px 9px', lineHeight:1.5 }} />
              </div>
            </div>
            {error && <div style={{ fontSize:13, color:'#F87171', marginBottom:12 }}>{error}</div>}
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <button onClick={runAnalysis} disabled={readyCount===0} style={{ fontSize:13, fontWeight:600, padding:'10px 24px', borderRadius:7, border:'none', background:readyCount>0?GREEN:'#1E2240', color:readyCount>0?'#0D0F1C':DIM, cursor:readyCount>0?'pointer':'not-allowed' }}>✦ Analyse &amp; recommend</button>
              {readyCount>0 && <span style={{ fontSize:12, color:GREEN }}>{readyCount} source{readyCount>1?'s':''} ready</span>}
            </div>
            <div style={{ fontSize:12, color:'#444E6A', marginTop:10 }}>Looker + Sellerboard are required. Product Bible adds the stock arrival calendar.</div>
          </div>
        )}

        {/* RESULTS TAB */}
        {tab==='results' && (
          <div>
            {loading ? (
              <div style={{ display:'flex', alignItems:'center', gap:10, color:DIM, padding:'2.5rem 0', fontSize:13 }}>
                <div style={{ width:16, height:16, border:`2px solid ${BORDER}`, borderTopColor:GREEN, borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
                Merging your data and scoring each SKU…
              </div>
            ) : (
              <>
                <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
                  {[{label:'SKUs reviewed',val:results.length||'—',color:'#fff'},{label:'Raise price',val:results.filter(r=>r.action==='RAISE').length||'—',color:'#4ADE80'},{label:'Drop / deal',val:results.filter(r=>r.action==='DROP'||r.action==='DEAL').length||'—',color:'#F87171'},{label:'Stock alerts',val:results.filter(r=>r.action==='ALERT').length||'—',color:'#FB923C'}].map(k=>(
                    <div key={k.label} style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:8, padding:'12px 16px', flex:1, minWidth:100 }}>
                      <div style={{ fontSize:11, color:DIM, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{k.label}</div>
                      <div style={{ fontSize:24, fontWeight:600, color:k.color }}>{k.val}</div>
                    </div>
                  ))}
                </div>
                {results.length>0 && (
                  <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
                    {[['all','All'],['raise','Raise'],['drop','Drop / deal'],['hold','Hold'],['alert','Alerts']].map(([f,l])=><FilterBtn key={f} f={f} label={l}/>)}
                  </div>
                )}
                {results.length===0 ? (
                  <div style={{ textAlign:'center', padding:'3rem', color:DIM, fontSize:13 }}><div style={{ fontSize:26, marginBottom:8 }}>◫</div>Upload files and run analysis first</div>
                ) : filtered.length===0 ? (
                  <div style={{ textAlign:'center', padding:'2rem', color:DIM, fontSize:13 }}>No SKUs match this filter</div>
                ) : (
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, tableLayout:'fixed' }}>
                      <colgroup><col style={{width:'19%'}}/><col style={{width:'12%'}}/><col style={{width:'8%'}}/><col style={{width:'7%'}}/><col style={{width:'7%'}}/><col style={{width:'7%'}}/><col style={{width:'8%'}}/><col style={{width:'7%'}}/><col style={{width:'7%'}}/><col style={{width:'18%'}}/></colgroup>
                      <thead>
                        <tr style={{ borderBottom:`1px solid ${BORDER}` }}>
                          {['SKU','Action','DOS','Margin','ACOS','BSR','Net P&L','Price','Stock','Reasoning'].map(h=>(
                            <th key={h} style={{ fontSize:11, fontWeight:500, color:DIM, textAlign:'left', padding:'6px 8px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((r,i)=>(
                          <tr key={i} style={{ borderBottom:`1px solid ${BORDER}` }}>
                            <td style={{ padding:'10px 8px', fontFamily:'monospace', fontSize:11, color:'#94A3B8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.sku||'—'}</td>
                            <td style={{ padding:'10px 8px' }}><Badge action={r.action}/></td>
                            <td style={{ padding:'10px 8px', fontWeight:r.dos!=null&&r.dos<15?600:400, color:r.dos!=null&&r.dos<15?'#F87171':'#CBD5E1' }}>{r.dos!=null?r.dos+'d':'—'}</td>
                            <td style={{ padding:'10px 8px' }}><Cell val={r.margin_pct} lo={8} hi={25} fmt={v=>v.toFixed(1)+'%'}/></td>
                            <td style={{ padding:'10px 8px' }}><Cell val={r.real_acos_pct} lo={0} hi={9} fmt={v=>v.toFixed(1)+'%'}/></td>
                            <td style={{ padding:'10px 8px', fontSize:11, color:DIM }}>{r.bsr?Number(r.bsr).toLocaleString():'—'}</td>
                            <td style={{ padding:'10px 8px', color:r.net_profit!=null?(r.net_profit<0?'#F87171':'#4ADE80'):'#444', fontWeight:r.net_profit!=null&&Math.abs(r.net_profit)>500?500:400 }}>{r.net_profit!=null?'£'+Number(r.net_profit).toFixed(0):'—'}</td>
                            <td style={{ padding:'10px 8px', color:'#CBD5E1' }}>{r.avg_price!=null?'£'+Number(r.avg_price).toFixed(2):'—'}</td>
                            <td style={{ padding:'10px 8px', fontSize:11, color:DIM }}>{r.current_stock!=null?Number(r.current_stock).toLocaleString():'—'}</td>
                            <td style={{ padding:'10px 8px', fontSize:11, color:DIM, lineHeight:1.4, whiteSpace:'normal' }}>{r.reasoning||'—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {results.length>0 && (
                  <div style={{ marginTop:14 }}>
                    <button onClick={()=>{buildSlack(results,etaRows);setTab('slack')}} style={{ fontSize:13, padding:'8px 16px', borderRadius:7, cursor:'pointer', border:`1px solid ${BORDER}`, background:'transparent', color:DIM }}># Generate Slack message</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* SLACK TAB */}
        {tab==='slack' && (
          <div>
            <div style={{ fontSize:13, color:DIM, marginBottom:12 }}>Ready to paste into <strong style={{ color:'#fff' }}>#ppc</strong>.</div>
            <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:10, padding:'1rem 1.25rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <span style={{ fontSize:15, color:DIM }}>#</span>
                <span style={{ fontSize:13, fontWeight:500, color:'#fff' }}>ppc</span>
                <span style={{ fontSize:11, color:'#444E6A' }}>APEX pricing brief</span>
              </div>
              <pre style={{ fontFamily:'monospace', fontSize:12, color:'#CBD5E1', whiteSpace:'pre-wrap', lineHeight:1.8, border:`1px solid ${BORDER}`, borderRadius:6, background:'#0D0F1C', padding:12, minHeight:80, maxHeight:400, overflowY:'auto', margin:0 }}>
                {slackMsg||'Run analysis first, then come back here.'}
              </pre>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:12, alignItems:'center' }}>
              <button onClick={()=>{navigator.clipboard.writeText(slackMsg).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2500)})}} disabled={!slackMsg} style={{ fontSize:13, fontWeight:600, padding:'9px 20px', borderRadius:7, border:'none', background:slackMsg?GREEN:BORDER, color:slackMsg?'#0D0F1C':DIM, cursor:slackMsg?'pointer':'not-allowed' }}>Copy message</button>
              {copied && <span style={{ fontSize:12, color:GREEN }}>Copied ✓</span>}
            </div>
            {etaRows.length>0 && (()=>{
              const today=new Date().toISOString().split('T')[0], upcoming=etaRows.filter(r=>r['W/C ETA']>=today)
              if (!upcoming.length) return null
              return (
                <div style={{ marginTop:24 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:DIM, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.05em' }}>Incoming stock calendar</div>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead><tr style={{ borderBottom:`1px solid ${BORDER}` }}>{['SKU','Description','Qty','W/C ETA','Status'].map(h=><th key={h} style={{ fontSize:11, fontWeight:500, color:DIM, textAlign:'left', padding:'5px 8px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>)}</tr></thead>
                    <tbody>{upcoming.slice(0,25).map((r,i)=>(
                      <tr key={i} style={{ borderBottom:`1px solid ${BORDER}` }}>
                        <td style={{ padding:'8px', fontFamily:'monospace', fontSize:11, color:'#94A3B8' }}>{r.SKU||'—'}</td>
                        <td style={{ padding:'8px', color:DIM, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r['Product Description']||'—'}</td>
                        <td style={{ padding:'8px', color:'#CBD5E1' }}>{Number(r.Qty||0).toLocaleString()}</td>
                        <td style={{ padding:'8px', fontWeight:500, color:'#CBD5E1' }}>{r['W/C ETA']}</td>
                        <td style={{ padding:'8px' }}>{r['Back in Stock?']==='Back in Stock'?<span style={{ fontSize:11, background:'rgba(74,222,128,0.1)', color:GREEN, padding:'2px 8px', borderRadius:10 }}>Back in stock</span>:<span style={{ fontSize:11, color:'#444E6A' }}>Incoming</span>}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {/* CHAT BUTTON */}
      <button onClick={()=>setChatOpen(o=>!o)} style={{
        position:'fixed', bottom:24, right:24, width:56, height:56, borderRadius:'50%',
        background: chatOpen ? CARD : GREEN, border:`1px solid ${chatOpen ? BORDER : GREEN}`,
        cursor:'pointer', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:'0 8px 32px rgba(0,0,0,0.4)', transition:'all .2s',
        fontSize: chatOpen ? 20 : 22, color: chatOpen ? DIM : '#0D0F1C'
      }}>
        {chatOpen ? '×' : 'A'}
      </button>

      {/* CHAT WINDOW */}
      {chatOpen && <ChatWindow context={chatContext} onClose={()=>setChatOpen(false)} />}
    </div>
  )
}
