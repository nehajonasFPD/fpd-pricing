import { NextResponse } from 'next/server'
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  constantTimeEqual,
  createSessionCookieValue,
} from '../../../lib/auth.mjs'

export async function POST(request) {
  try {
    const configuredPassword = process.env.APEX_PASSWORD
    const sessionSecret = process.env.APEX_SESSION_SECRET

    if (!configuredPassword || !sessionSecret) {
      return NextResponse.json(
        { error: 'Password auth is not configured.' },
        { status: 500 }
      )
    }

    const { password } = await request.json()
    if (!constantTimeEqual(password || '', configuredPassword)) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set(
      AUTH_COOKIE_NAME,
      await createSessionCookieValue(sessionSecret),
      authCookieOptions()
    )

    return response
  } catch (err) {
    return NextResponse.json(
      { error: 'Login failed: ' + err.message },
      { status: 500 }
    )
  }
}
