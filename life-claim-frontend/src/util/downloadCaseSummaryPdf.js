import { jsPDF } from 'jspdf'

/**
 * Download a PDF containing only the on-screen case summary text (no print dialog).
 */
export function downloadCaseSummaryPdf({ claimId, summaryText, generatedAt = new Date() }) {
  const id = String(claimId || 'claim').trim() || 'claim'
  const body = String(summaryText || '').trim()
  if (!body) {
    throw new Error('No case summary content to download.')
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const margin = 18
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(15, 23, 42)
  doc.text(`Case Summary — ${id}`, margin, y)
  y += 9

  doc.setDrawColor(226, 232, 240)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(51, 65, 85)
  const lines = doc.splitTextToSize(body, contentWidth)
  lines.forEach((line) => {
    ensureSpace(6)
    doc.text(line, margin, y)
    y += 6
  })

  ensureSpace(12)
  y += 4
  doc.setFontSize(9)
  doc.setTextColor(148, 163, 184)
  const stamp = `Generated ${generatedAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`
  doc.text(stamp, margin, y)

  doc.save(`Case-Summary-${id.replace(/[^\w.-]+/g, '_')}.pdf`)
}
