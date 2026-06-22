export const AUTH_COOKIE_NAME = 'apex_session'
export const SESSION_VALUE = 'apex_authenticated'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7

const encoder = new TextEncoder()

function toHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return ''
  const cookies = cookieHeader.split(';')

  for (const cookie of cookies) {
    const [rawKey, ...rawValue] = cookie.trim().split('=')
    if (rawKey === name) return rawValue.join('=')
  }

  return ''
}

export function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  if (a.length !== b.length) return false

  let mismatch = 0
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

export async function signValue(value, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value))
  return toHex(signature)
}

export async function createSessionCookieValue(secret) {
  const signature = await signValue(SESSION_VALUE, secret)
  return `${SESSION_VALUE}.${signature}`
}

export async function verifySessionCookieValue(cookieValue, secret) {
  if (!cookieValue || !secret || !cookieValue.includes('.')) return false

  const [value, signature] = cookieValue.split('.')
  if (value !== SESSION_VALUE || !signature) return false

  const expected = await signValue(value, secret)
  return constantTimeEqual(signature, expected)
}

export async function isAuthenticatedCookieHeader(cookieHeader, secret) {
  const cookieValue = getCookieValue(cookieHeader, AUTH_COOKIE_NAME)
  return verifySessionCookieValue(cookieValue, secret)
}

export async function isAuthenticatedRequest(request) {
  const secret = process.env.APEX_SESSION_SECRET
  if (!secret) return false

  return isAuthenticatedCookieHeader(request.headers.get('cookie'), secret)
}

export function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.APEX_COOKIE_SECURE === 'true',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  }
}
