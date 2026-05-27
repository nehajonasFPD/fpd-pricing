export const metadata = {
  title: 'FPD Pricing Intelligence',
  description: 'Amazon UK Repricing Brief',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#fff' }}>
        {children}
      </body>
    </html>
  )
}
