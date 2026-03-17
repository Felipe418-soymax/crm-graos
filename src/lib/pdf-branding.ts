import { CompanySettings } from '@/types'

/**
 * Build formatted company address from CompanySettings
 */
export function buildCompanyAddress(c: CompanySettings | null): string {
  if (!c) return ''
  const parts = [
    c.street && c.number ? `${c.street}, ${c.number}` : c.street,
    c.district,
    c.city && c.state ? `${c.city} - ${c.state}` : c.city,
    c.zipCode,
  ].filter(Boolean)
  return parts.join(' · ')
}

/**
 * Build the full company info block for PDF headers
 */
export function buildCompanyInfoHtml(c: CompanySettings | null): string {
  if (!c) return ''
  const lines: string[] = []
  if (c.cnpjCpf) lines.push(`CNPJ/CPF: ${c.cnpjCpf}`)
  const addr = buildCompanyAddress(c)
  if (addr) lines.push(addr)
  if (c.phone) lines.push(`Tel: ${c.phone}`)
  if (c.email) lines.push(c.email)
  return lines.map(l => `<div>${l}</div>`).join('\n')
}

/**
 * Grãos CRM styled HTML logo for documents (more reliable than SVG text in print)
 */
export const GRAOS_LOGO_HTML = `<span style="font-family:Arial,Helvetica,sans-serif;white-space:nowrap"><span style="font-weight:900;font-size:11px;color:#1a1a2e;letter-spacing:0.5px">GRÃOS</span><span style="font-weight:800;font-size:10px;color:#16a34a;margin-left:2px">CRM</span></span>`

/**
 * Standard PDF header with client logo (primary) and company info
 */
export function pdfHeader(c: CompanySettings | null, title: string, subtitle: string): string {
  const brandLabel = c?.tradeName || c?.companyName || 'Empresa não configurada'
  const logoSrc = c?.logoHeaderUrl || c?.logoUrl
  const logoHtml = logoSrc
    ? `<img src="${logoSrc}" alt="Logo" style="height:44px;max-width:180px;object-fit:contain">`
    : ''
  const companyInfo = buildCompanyInfoHtml(c)

  return `
    <div class="hdr">
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
          ${logoHtml}
          <span style="font-size:18px;font-weight:700;color:#111">${brandLabel}</span>
        </div>
        ${companyInfo ? `<div style="font-size:9px;color:#6b7280;line-height:1.6">${companyInfo}</div>` : ''}
        <div class="sub" style="margin-top:8px">${title} — ${subtitle}</div>
      </div>
      <div class="meta">
        Gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}<br>
        ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>`
}

/**
 * Standard PDF footer with Grãos CRM branding (subtle, bottom-right)
 * Always includes the Grãos CRM logo + text for mandatory secondary branding.
 */
export function pdfFooter(c: CompanySettings | null): string {
  const brandLabel = c?.tradeName || c?.companyName || 'Grãos CRM'
  return `
    <div class="footer">
      <span>${brandLabel}</span>
      <span style="display:flex;align-items:center;gap:4px;color:#b0b0b0;font-size:8px">
        Documento gerado por ${GRAOS_LOGO_HTML}
      </span>
    </div>
    <script>window.onload = function(){ window.print() }</script>`
}

/**
 * Shared PDF CSS styles
 */
export const PDF_BASE_CSS = `
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;font-size:12px;color:#111;padding:28px}
  .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:14px;border-bottom:3px solid #16a34a}
  .brand{font-size:20px;font-weight:700;color:#16a34a}
  .sub{font-size:12px;color:#555;margin-top:4px}
  .meta{font-size:10px;color:#9ca3af;text-align:right;line-height:1.6}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:22px}
  .grid2{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:22px}
  .card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:11px 13px}
  .clbl{font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
  .cval{font-size:15px;font-weight:700;color:#111}
  .cval.g{color:#16a34a}
  .cval.plate{font-family:monospace;font-size:18px;letter-spacing:2px}
  h2{font-size:10px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.8px;margin:18px 0 8px;padding-bottom:6px;border-bottom:1px solid #e5e7eb}
  table{width:100%;border-collapse:collapse;font-size:10.5px;margin-bottom:4px}
  th{background:#f3f4f6;padding:7px 8px;text-align:left;font-size:9px;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #e5e7eb}
  th.r,td.r{text-align:right}
  td{padding:6px 8px;border-bottom:1px solid #f3f4f6}
  .tot td{background:#f0fdf4;font-weight:700;border-top:2px solid #bbf7d0}
  .info-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px 13px}
  .info-row .item .lbl{font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px}
  .info-row .item .val{font-size:11px;font-weight:600;color:#111;margin-top:2px;text-transform:capitalize}
  .footer{margin-top:24px;padding-top:10px;border-top:1px solid #e5e7eb;font-size:9px;color:#9ca3af;display:flex;justify-content:space-between;align-items:center}
  @media print{@page{margin:12mm}body{padding:0}}
`
