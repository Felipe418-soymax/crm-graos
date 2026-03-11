import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Grãos CRM',
  description: 'Grãos CRM — Gestão inteligente para corretores de commodities',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
