import { storeConfig } from '../../config/store.config.ts'
import type { SalesReportView } from './sales-report.models'

function pdfText(value: string) {
  return value.normalize('NFC').replace(/[^\u0020-\u00FF]/g, '?').replaceAll('\u00a0', ' ')
}

function reportDate(value: string) {
  return new Intl.DateTimeFormat(storeConfig.locale, { dateStyle: 'medium' }).format(new Date(value))
}

function money(value: number | null) {
  if (value === null) return 'No disponible'
  return pdfText(new Intl.NumberFormat(storeConfig.locale, {
    style: 'currency',
    currency: storeConfig.currency,
  }).format(value / 100))
}

export async function downloadSalesReportPdf(input: {
  report: SalesReportView
  fromLabel: string
  toLabel: string
}) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const document = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const { report } = input
  const generatedAt = new Date()

  document.setProperties({
    title: `Informe de ventas ${input.fromLabel} a ${input.toLabel}`,
    subject: 'Ventas, costos y ganancias',
    author: storeConfig.company.legalName,
    creator: storeConfig.name,
  })
  document.setFillColor(36, 86, 70)
  document.rect(0, 0, 297, 32, 'F')
  document.setTextColor(255, 255, 255)
  document.setFont('helvetica', 'bold')
  document.setFontSize(17)
  document.text(pdfText(storeConfig.name), 14, 13)
  document.setFontSize(11)
  document.text('Informe de ventas y ganancias', 14, 22)
  document.setFont('helvetica', 'normal')
  document.setFontSize(8)
  document.text(pdfText(`${storeConfig.company.legalName} - NIT ${storeConfig.company.taxId}`), 283, 12, { align: 'right' })
  document.text(pdfText(`Periodo: ${input.fromLabel} al ${input.toLabel}`), 283, 19, { align: 'right' })
  document.text(pdfText(`Generado: ${new Intl.DateTimeFormat(storeConfig.locale, { dateStyle: 'medium', timeStyle: 'short' }).format(generatedAt)}`), 283, 25, { align: 'right' })

  const cards = [
    ['Pedidos', String(report.summary.orderCount)],
    ['Unidades', String(report.summary.units)],
    ['Costo', money(report.summary.missingCommercialLines ? null : report.summary.costMinor)],
    ['Ganancia', money(report.summary.missingCommercialLines ? null : report.summary.profitMinor)],
    ['Recargo', money(report.summary.missingCommercialLines ? null : report.summary.taxMinor)],
    ['Total cobrado', money(report.summary.totalMinor)],
  ]
  cards.forEach(([label, value], index) => {
    const x = 14 + index * 45
    document.setFillColor(240, 242, 236)
    document.roundedRect(x, 38, 41, 18, 2, 2, 'F')
    document.setTextColor(83, 97, 90)
    document.setFontSize(7)
    document.text(label, x + 3, 44)
    document.setTextColor(23, 62, 50)
    document.setFont('helvetica', 'bold')
    document.setFontSize(9)
    document.text(pdfText(value), x + 3, 51)
    document.setFont('helvetica', 'normal')
  })

  autoTable(document, {
    startY: 62,
    tableWidth: 250,
    margin: { left: 14, right: 14, bottom: 16 },
    head: [['Fecha', 'Pedido', 'Artículo', 'Categoría', 'Cant.', 'Costo', 'Ganancia', 'Recargo', 'Venta']],
    body: report.rows.map((row) => [
      reportDate(row.completedAt),
      pdfText(row.orderNumber),
      pdfText(`${row.name} - ${row.sku}`),
      pdfText(row.categoryName ?? 'Sin dato histórico'),
      String(row.quantity),
      money(row.costMinor),
      money(row.profitMinor),
      money(row.taxMinor),
      money(row.saleMinor),
    ]),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7, cellPadding: 2.4, textColor: [31, 47, 41], lineColor: [215, 221, 214], lineWidth: 0.15 },
    headStyles: { fillColor: [36, 86, 70], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 249, 246] },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 30 },
      2: { cellWidth: 44 },
      3: { cellWidth: 31 },
      4: { cellWidth: 13, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' },
      6: { cellWidth: 28, halign: 'right' },
      7: { cellWidth: 28, halign: 'right' },
      8: { cellWidth: 28, halign: 'right' },
    },
  })

  const pages = document.getNumberOfPages()
  for (let page = 1; page <= pages; page += 1) {
    document.setPage(page)
    document.setDrawColor(215, 221, 214)
    document.line(14, 196, 283, 196)
    document.setFontSize(7)
    document.setTextColor(100, 108, 103)
    const note = report.summary.missingCommercialLines
      ? `${report.summary.missingCommercialLines} línea(s) histórica(s) no incluyen costo, ganancia o recargo.`
      : `Productos: ${money(report.summary.itemsMinor)} - Envíos: ${money(report.summary.shippingMinor)}`
    document.text(pdfText(note), 14, 201)
    document.text(`Página ${page} de ${pages}`, 283, 201, { align: 'right' })
  }

  const filename = `informe-ventas-${input.fromLabel}-a-${input.toLabel}.pdf`
  document.save(filename)
}
