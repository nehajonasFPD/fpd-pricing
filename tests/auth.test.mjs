import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AUTH_COOKIE_NAME,
  createSessionCookieValue,
  getCookieValue,
  verifySessionCookieValue,
} from '../lib/auth.mjs'
import { loginRedirectPath } from '../lib/login.mjs'

test('creates a signed session cookie that verifies with the same secret', async () => {
  const cookieValue = await createSessionCookieValue('secret-one')

  assert.equal(cookieValue.startsWith('apex_authenticated.'), true)
  assert.equal(await verifySessionCookieValue(cookieValue, 'secret-one'), true)
})

test('rejects a session cookie signed with another secret', async () => {
  const cookieValue = await createSessionCookieValue('secret-one')

  assert.equal(await verifySessionCookieValue(cookieValue, 'secret-two'), false)
})

test('rejects a tampered session cookie', async () => {
  const cookieValue = await createSessionCookieValue('secret-one')
  const tampered = cookieValue.replace('apex_authenticated', 'not_authenticated')

  assert.equal(await verifySessionCookieValue(tampered, 'secret-one'), false)
})

test('extracts the auth cookie from a cookie header', () => {
  const header = `theme=dark; ${AUTH_COOKIE_NAME}=abc123; other=value`

  assert.equal(getCookieValue(header, AUTH_COOKIE_NAME), 'abc123')
})

test('returns a safe same-origin redirect path after login', () => {
  assert.equal(loginRedirectPath('?next=%2Fdashboard'), '/dashboard')
  assert.equal(loginRedirectPath('?next=https%3A%2F%2Fevil.example'), '/dashboard')
  assert.equal(loginRedirectPath('?next=%2F%2Fevil.example'), '/dashboard')
  assert.equal(loginRedirectPath(''), '/dashboard')
})
