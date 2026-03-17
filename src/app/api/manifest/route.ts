import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  let shortName = 'Grãos CRM'
  let fullName = 'Grãos CRM — Gestão de Commodities'
  let iconUrl = '/graos-crm-icon.svg'
  let faviconUrl: string | null = null

  try {
    const user = await getAuthUser()
    if (user) {
      const settings = await prisma.companySettings.findUnique({
        where: { userId: user.sub },
      })
      if (settings) {
        if (settings.shortName || settings.tradeName || settings.companyName) {
          const name = settings.shortName || settings.tradeName || settings.companyName || ''
          shortName = `${name} CRM`
          fullName = `${name} CRM — Gestão de Commodities`
        }
        if (settings.logoUrl) {
          iconUrl = settings.logoUrl
        }
        if (settings.logoFaviconUrl) {
          faviconUrl = settings.logoFaviconUrl
        }
      }
    }
  } catch {
    // Use defaults
  }

  const isSvg = iconUrl.endsWith('.svg')
  const icons = [
    {
      src: faviconUrl || iconUrl,
      sizes: '32x32',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: iconUrl,
      sizes: '192x192',
      type: isSvg ? 'image/svg+xml' : 'image/png',
      purpose: 'any maskable',
    },
    {
      src: iconUrl,
      sizes: '512x512',
      type: isSvg ? 'image/svg+xml' : 'image/png',
      purpose: 'any maskable',
    },
  ]

  const manifest = {
    name: fullName,
    short_name: shortName,
    description: 'CRM para gestão de operações de commodities agrícolas',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#16a34a',
    orientation: 'portrait-primary',
    icons,
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
