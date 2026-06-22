import { NextResponse } from 'next/server'
import { isAuthenticatedCookieHeader } from './lib/auth.mjs'

export async function middleware(request) {
  const isAuthenticated = await isAuthenticatedCookieHeader(
    request.headers.get('cookie'),
    process.env.APEX_SESSION_SECRET
  )

  if (isAuthenticated) return NextResponse.next()

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set(
    'next',
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  )

  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
