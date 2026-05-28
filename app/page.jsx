'use client'
import { useRouter } from 'next/navigation'

const GREEN  = '#4ADE80'
const GREEN2 = '#16a34a'
const CARD   = '#13152A'
const BORDER = '#1E2240'
const DIM    = '#8B90A0'

export default function Landing() {
  const router = useRouter()

  const steps = [
    { n:'01', title:'Upload your exports', body:'Drop in your Looker Studio CSV and Sellerboard export. Optionally add the Product Bible for the incoming stock calendar. No manual data entry.' },
    { n:'02', title:'APEX analyses', body:'Every SKU is scored against net profit, margin, Real ACOS, BSR, and DOS. Loss-makers, overstock, and high performers are identified instantly.' },
    { n:'03', title:'Post to Slack', body:'One click generates a formatted pricing brief for the #ppc channel — raise, drop, deal, and stock alerts — ready to post in seconds.' },
  ]

  const signals = [
    { icon:'↑', label:'Raise price',  color:'#4ADE80', bg:'#052e16', body:'Margin above 22%, Real ACOS below 9%, BSR improving, and healthy DOS. Room to capture more profit.' },
    { icon:'↓', label:'Drop price',   color:'#F87171', bg:'#2d0a0a', body:'Net profit negative or margin below 8% with excess stock. Price is wrong — fix it now.' },
    { icon:'%', label:'Run a deal',   color:'#FBBF24', bg:'#2d1a00', body:'High ACOS and strong sessions but low conversion. Traffic is there — price needs to convert it.' },
    { icon:'⚠', label:'Stock alert',  color:'#FB923C', bg:'#2d1200', body:'Under 15 days of stock left. Flag regardless of everything else — run out and you lose rank.' },
  ]

  const sources = [
    { name:'Looker Studio CSV', desc:'Your primary sales export. Provides DOS, live stock, TACOS, GM% and GP per SKU.' },
    { name:'Sellerboard export', desc:'BSR, net profit, Real ACOS, margin, sessions and average selling price for the period.' },
    { name:'Product Bible', desc:'Upload the full xlsx — APEX extracts the Stock ETA sheet automatically for the arrival calendar.' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#0D0F1C' }}>

      {/* NAV */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 2rem', height:56, borderBottom:`1px solid ${BORDER}`,
        background:'rgba(13,15,28,0.95)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontWeight:700, fontSize:18, letterSpacing:'0.04em', color:'#fff' }}>APEX</span>
          <span style={{ fontSize:11, color:GREEN, fontWeight:500, background:'rgba(74,222,128,0.1)',
            padding:'2px 8px', borderRadius:20, letterSpacing:'0.05em' }}>v1.0</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:GREEN, display:'inline-block' }}/>
          <span style={{ fontSize:13, color:DIM }}>First Point Distribution</span>
          <span style={{ fontSize:13, color:'#fff', marginLeft:8, fontWeight:500 }}>Neha Jonas</span>
          <span style={{ fontSize:12, color:DIM }}>· Global Marketplace Director</span>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ textAlign:'center', padding:'100px 2rem 80px', maxWidth:720, margin:'0 auto' }}>
        <div style={{ fontSize:12, fontWeight:500, color:GREEN, letterSpacing:'0.1em',
          textTransform:'uppercase', marginBottom:20 }}>
          First Point Distribution · Pricing Intelligence Engine
        </div>
        <h1 style={{ fontSize:'clamp(36px, 5vw, 58px)', fontWeight:700, lineHeight:1.15,
          color:'#fff', margin:'0 0 24px', letterSpacing:'-0.02em' }}>
          Every price decision,<br />built on profit.
        </h1>
        <p style={{ fontSize:17, color:DIM, lineHeight:1.7, margin:'0 0 40px', maxWidth:560, marginLeft:'auto', marginRight:'auto' }}>
          APEX merges your Looker and Sellerboard data, scores every SKU against real profitability signals, and generates a Slack-ready pricing brief — twice a week, in under a minute.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={() => router.push('/dashboard')} style={{
            background:GREEN, color:'#0D0F1C', fontWeight:600, fontSize:14,
            padding:'12px 28px', borderRadius:8, border:'none', cursor:'pointer',
            display:'flex', alignItems:'center', gap:8
          }}>
            Open dashboard →
          </button>
          <button onClick={() => document.getElementById('how').scrollIntoView({ behavior:'smooth' })} style={{
            background:'transparent', color:'#fff', fontWeight:500, fontSize:14,
            padding:'12px 24px', borderRadius:8, border:`1px solid ${BORDER}`, cursor:'pointer'
          }}>
            How it works
          </button>
        </div>
      </section>

      {/* STAT ROW */}
      <section style={{ borderTop:`1px solid ${BORDER}`, borderBottom:`1px solid ${BORDER}`,
        padding:'32px 2rem' }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'flex', gap:0,
          justifyContent:'space-around', flexWrap:'wrap' }}>
          {[
            { val:'4 signals', label:'per SKU scored' },
            { val:'< 60s', label:'from upload to brief' },
            { val:'2×', label:'per week cadence' },
            { val:'#ppc', label:'Slack-ready output' },
          ].map(s => (
            <div key={s.val} style={{ textAlign:'center', padding:'8px 24px' }}>
              <div style={{ fontSize:28, fontWeight:700, color:GREEN, marginBottom:4 }}>{s.val}</div>
              <div style={{ fontSize:13, color:DIM }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding:'80px 2rem', maxWidth:900, margin:'0 auto' }}>
        <div style={{ fontSize:12, fontWeight:500, color:GREEN, letterSpacing:'0.1em',
          textTransform:'uppercase', marginBottom:12 }}>How it works</div>
        <h2 style={{ fontSize:32, fontWeight:700, color:'#fff', margin:'0 0 48px', letterSpacing:'-0.01em' }}>
          Three steps to a pricing decision
        </h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:16 }}>
          {steps.map(s => (
            <div key={s.n} style={{ background:CARD, border:`1px solid ${BORDER}`,
              borderRadius:12, padding:'28px 24px' }}>
              <div style={{ fontSize:13, fontWeight:700, color:GREEN, marginBottom:16,
                fontFamily:'monospace', letterSpacing:'0.05em' }}>{s.n}</div>
              <div style={{ fontSize:17, fontWeight:600, color:'#fff', marginBottom:12 }}>{s.title}</div>
              <div style={{ fontSize:14, color:DIM, lineHeight:1.65 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING SIGNALS */}
      <section style={{ padding:'0 2rem 80px', maxWidth:900, margin:'0 auto' }}>
        <div style={{ fontSize:12, fontWeight:500, color:GREEN, letterSpacing:'0.1em',
          textTransform:'uppercase', marginBottom:12 }}>Pricing signals</div>
        <h2 style={{ fontSize:32, fontWeight:700, color:'#fff', margin:'0 0 12px', letterSpacing:'-0.01em' }}>
          Four outcomes, clearly reasoned
        </h2>
        <p style={{ fontSize:15, color:DIM, marginBottom:40, lineHeight:1.6 }}>
          Every SKU gets one of four recommendations — each with the data behind it.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12 }}>
          {signals.map(s => (
            <div key={s.label} style={{ background:s.bg, border:`1px solid ${BORDER}`,
              borderRadius:12, padding:'24px 20px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <span style={{ width:30, height:30, borderRadius:8, background:`rgba(0,0,0,0.3)`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:14, color:s.color, fontWeight:700 }}>{s.icon}</span>
                <span style={{ fontSize:14, fontWeight:600, color:s.color }}>{s.label}</span>
              </div>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.6, margin:0 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DATA SOURCES */}
      <section style={{ padding:'0 2rem 80px', maxWidth:900, margin:'0 auto' }}>
        <div style={{ fontSize:12, fontWeight:500, color:GREEN, letterSpacing:'0.1em',
          textTransform:'uppercase', marginBottom:12 }}>Data sources</div>
        <h2 style={{ fontSize:32, fontWeight:700, color:'#fff', margin:'0 0 40px', letterSpacing:'-0.01em' }}>
          Your existing exports, intelligently merged
        </h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:12 }}>
          {sources.map((s, i) => (
            <div key={s.name} style={{ background:CARD, border:`1px solid ${BORDER}`,
              borderRadius:12, padding:'24px 20px', display:'flex', gap:14 }}>
              <div style={{ width:36, height:36, borderRadius:8, background:'rgba(74,222,128,0.08)',
                border:`1px solid rgba(74,222,128,0.15)`, display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:13, color:GREEN, fontWeight:700, flexShrink:0 }}>
                {['L','S','B'][i]}
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:'#fff', marginBottom:6 }}>{s.name}</div>
                <div style={{ fontSize:13, color:DIM, lineHeight:1.6 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:'0 2rem 100px', maxWidth:720, margin:'0 auto', textAlign:'center' }}>
        <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:16, padding:'52px 40px' }}>
          <h2 style={{ fontSize:32, fontWeight:700, color:'#fff', margin:'0 0 16px', letterSpacing:'-0.01em' }}>
            Ready to run this week's brief?
          </h2>
          <p style={{ fontSize:15, color:DIM, margin:'0 0 32px', lineHeight:1.6 }}>
            Upload your Looker and Sellerboard exports and have a Slack-ready pricing brief in under a minute.
          </p>
          <button onClick={() => router.push('/dashboard')} style={{
            background:GREEN, color:'#0D0F1C', fontWeight:600, fontSize:15,
            padding:'14px 32px', borderRadius:8, border:'none', cursor:'pointer'
          }}>
            Open APEX dashboard →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:`1px solid ${BORDER}`, padding:'24px 2rem',
        display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
        <span style={{ fontSize:13, fontWeight:600, color:DIM }}>APEX · First Point Distribution</span>
        <span style={{ fontSize:12, color:'#444' }}>Internal tool · Not for external distribution</span>
      </footer>
    </div>
  )
}
