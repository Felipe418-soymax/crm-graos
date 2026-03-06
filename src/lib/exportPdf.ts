import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { MonthlyReport } from '@/types'

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatNum(value: number) {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

function fmtDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export function exportReportPDF(
  report: MonthlyReport,
  companyName?: string | null,
  region?: string | null,
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.setFillColor(22, 163, 74) // green-600
  doc.rect(0, 0, pageW, 22, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(companyName || 'CRM Grãos', margin, 10)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(region ? `Região: ${region}` : '', margin, 16)

  // Period label on the right
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(`Relatório: ${report.period.label}`, pageW - margin, 10, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageW - margin, 16, { align: 'right' })

  let y = 30

  // ── Summary boxes ───────────────────────────────────────────────────────────
  const boxes = [
    { label: 'Dinheiro movimentado', value: formatBRL(report.summary.totalValue) },
    { label: 'Comissão total', value: formatBRL(report.summary.commissionValue) },
    { label: 'Operações fechadas', value: String(report.summary.dealsCount) },
    {
      label: 'Volume por unidade',
      value: Object.entries(report.summary.volumeByUnit)
        .map(([u, v]) => `${formatNum(v as number)} ${u}`)
        .join('\n') || '-',
    },
  ]

  const boxW = (pageW - margin * 2 - 9) / 4
  boxes.forEach((box, i) => {
    const x = margin + i * (boxW + 3)
    doc.setDrawColor(220, 220, 220)
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, y, boxW, 22, 2, 2, 'FD')
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(box.label.toUpperCase(), x + 3, y + 6)
    doc.setTextColor(20, 20, 20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    const lines = box.value.split('\n')
    lines.forEach((line, li) => doc.text(line, x + 3, y + 13 + li * 5))
  })

  y += 28

  // ── Top Clients ─────────────────────────────────────────────────────────────
  if (report.topClients.length > 0) {
    doc.setTextColor(30, 30, 30)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Top Clientes do Período', margin, y)
    y += 3

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['#', 'Cliente', 'Negociações', 'Volume total', 'Comissão']],
      body: report.topClients.map((c, i) => [
        String(i + 1),
        c.name,
        String(c.dealsCount),
        formatBRL(c.totalValue),
        formatBRL(c.commissionValue),
      ]),
      headStyles: { fillColor: [22, 163, 74], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
      alternateRowStyles: { fillColor: [245, 255, 245] },
    })

    y = (doc as any).lastAutoTable.finalY + 8
  }

  // ── Deals Table ─────────────────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Operações Fechadas', margin, y)
  y += 3

  if (report.deals.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text('Nenhuma operação fechada neste período.', margin, y + 8)
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Data', 'Cliente', 'Produto', 'Op.', 'Volume', 'Preço Unit.', 'Total', 'Comissão %', 'Comissão']],
      body: report.deals.map((d) => [
        fmtDate(d.closedAt),
        d.client?.name || '-',
        d.product,
        d.side === 'sell' ? 'Venda' : 'Compra',
        `${formatNum(d.volume)} ${d.unit}`,
        formatBRL(d.unitPrice),
        formatBRL(d.totalValue),
        `${d.commissionPct}%`,
        formatBRL(d.commissionValue),
      ]),
      foot: [[
        '', '', '', '', '', 'TOTAL',
        formatBRL(report.summary.totalValue),
        '',
        formatBRL(report.summary.commissionValue),
      ]],
      headStyles: { fillColor: [22, 163, 74], textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5 },
      footStyles: { fillColor: [220, 252, 231], textColor: [21, 128, 61], fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right', fontStyle: 'bold' },
        7: { halign: 'center' },
        8: { halign: 'right' },
      },
      alternateRowStyles: { fillColor: [248, 255, 248] },
      showFoot: 'lastPage',
    })
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    const h = doc.internal.pageSize.getHeight()
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, h - 8, pageW - margin, h - 8)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(`${companyName || 'CRM Grãos'} — ${report.period.label}`, margin, h - 4)
    doc.text(`Página ${p} de ${totalPages}`, pageW - margin, h - 4, { align: 'right' })
  }

  const filename = `relatorio-${report.period.label.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`
  doc.save(filename)
}
