'use client'

import { useState } from 'react'
import { loginRedirectPath } from '../../lib/login.mjs'

const GREEN = '#4ADE80'
const BORDER = '#1E2240'
const CARD = '#13152A'
const DIM = '#8B90A0'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed.')
      }

      window.location.assign(loginRedirectPath(window.location.search))
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0D0F1C', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
      <form onSubmit={submit} style={{ width:'100%', maxWidth:380, background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:'28px 24px', boxShadow:'0 24px 80px rgba(0,0,0,0.35)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
          <div style={{ width:38, height:38, borderRadius:8, background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:GREEN, fontWeight:700 }}>A</div>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:'#fff', letterSpacing:'0.04em' }}>APEX</div>
            <div style={{ fontSize:12, color:DIM }}>Pricing dashboard access</div>
          </div>
        </div>

        <label htmlFor="password" style={{ display:'block', fontSize:12, color:DIM, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>
          Shared password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          autoFocus
          style={{ width:'100%', height:42, borderRadius:8, border:`1px solid ${BORDER}`, background:'#0A0C18', color:'#fff', padding:'0 12px', fontSize:14, marginBottom:12 }}
        />

        {error && <div style={{ fontSize:13, color:'#F87171', marginBottom:12 }}>{error}</div>}

        <button
          type="submit"
          disabled={!password || loading}
          style={{ width:'100%', height:42, borderRadius:8, border:'none', background:password && !loading ? GREEN : BORDER, color:password && !loading ? '#0D0F1C' : DIM, cursor:password && !loading ? 'pointer' : 'not-allowed', fontSize:14, fontWeight:700 }}
        >
          {loading ? 'Checking...' : 'Unlock dashboard'}
        </button>
      </form>
    </div>
  )
}
