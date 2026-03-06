import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgriValor CRM',
  description: 'CRM para comércio de grãos e commodities',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
