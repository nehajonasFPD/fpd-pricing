export function loginRedirectPath(search) {
  const next = new URLSearchParams(search || '').get('next')
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/dashboard'

  return next
}
