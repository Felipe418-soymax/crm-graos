import type Sharp from 'sharp'

export interface LogoVariants {
  /** Compressed original (max 800px wide) */
  original: Buffer
  /** 180x60 for document headers */
  header: Buffer
  /** 64x64 square thumbnail */
  thumbnail: Buffer
  /** 32x32 favicon PNG */
  favicon: Buffer
}

/**
 * Process an uploaded logo image:
 * - Compress the original (max 800px wide, quality 85)
 * - Generate header variant (max 180x60, fit inside)
 * - Generate thumbnail (64x64 cover)
 * - Generate favicon (32x32 cover, PNG)
 *
 * Accepts PNG or SVG input. SVG is rasterized to PNG for variants.
 */
export async function processLogo(
  buffer: Buffer,
  mimeType: string
): Promise<LogoVariants> {
  // Dynamic import to avoid webpack bundling issues in Next.js API routes
  const sharp = (await import('sharp')).default

  const isSvg = mimeType === 'image/svg+xml'

  // For SVG: convert to high-res PNG first, then resize
  // For PNG: work directly with the buffer
  const base = isSvg
    ? sharp(buffer, { density: 300 }).png()
    : sharp(buffer)

  // Compressed original: max 800px wide, preserve aspect ratio
  const original = await base
    .clone()
    .resize({ width: 800, withoutEnlargement: true })
    .png({ quality: 85, compressionLevel: 9 })
    .toBuffer()

  // Header variant: fit within 180x60
  const header = await base
    .clone()
    .resize({ width: 180, height: 60, fit: 'inside', withoutEnlargement: true })
    .png({ quality: 85, compressionLevel: 9 })
    .toBuffer()

  // Thumbnail: 64x64 cover (cropped to square)
  const thumbnail = await base
    .clone()
    .resize({ width: 64, height: 64, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ quality: 80, compressionLevel: 9 })
    .toBuffer()

  // Favicon: 32x32
  const favicon = await base
    .clone()
    .resize({ width: 32, height: 32, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ quality: 80, compressionLevel: 9 })
    .toBuffer()

  return { original, header, thumbnail, favicon }
}
