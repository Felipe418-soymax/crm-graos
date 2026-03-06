import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgriValor CRM',
  description: 'CRM para comércio de grãos e commodities',
  icons: {
    icon: '/api/favicon',
    apple: '/api/favicon',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
