/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclui pacotes Node.js-only do bundle de Server Components.
  // bcryptjs e @prisma/client NÃO devem ser bundled pelo webpack para SSR.
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs', 'prisma'],
  },

  // Headers de segurança HTTP básicos
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options',        value: 'DENY' },
          { key: 'X-XSS-Protection',       value: '1; mode=block' },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
