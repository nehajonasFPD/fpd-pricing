export const metadata = {
  title: 'APEX — Pricing Intelligence',
  description: 'Every price decision, built on profit.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0D0F1C', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
