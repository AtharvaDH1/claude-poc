import { jsPDF } from 'jspdf'
import { COMPANY } from '../config/companyBrand'
import { buildCaseSummaryReport } from './caseSummaryText'

const MARGIN = 16
const FOOTER_H = 14

async function loadLogoDataUrl() {
  try {
    const res = await fetch(COMPANY.logoPath)
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function drawFooter(doc, pageNum, totalPages, generatedAt) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const y = pageHeight - 10

  doc.setDrawColor(226, 232, 240)
  doc.line(MARGIN, pageHeight - FOOTER_H, pageWidth - MARGIN, pageHeight - FOOTER_H)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text(`${COMPANY.name} · ${COMPANY.tagline}`, MARGIN, y)
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - MARGIN, y, { align: 'right' })

  if (pageNum === totalPages) {
    doc.setFontSize(7)
    doc.text(
      `Generated ${generatedAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · Confidential`,
      pageWidth / 2,
      y,
      { align: 'center' }
    )
  }
}

function drawHeader(doc, logoDataUrl, claimId, policyId, generatedAt) {
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = MARGIN

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', MARGIN, y, 42, 18)
    y += 22
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(15, 23, 42)
    doc.text(COMPANY.name, MARGIN, y + 5)
    y += 10
  }

  doc.setDrawColor(139, 26, 43)
  doc.setLineWidth(0.6)
  doc.line(MARGIN, y, pageWidth - MARGIN, y)
  y += 5

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(COMPANY.tagline, MARGIN, y)
  y += 10

  // Document title band
  doc.setFillColor(248, 250, 252)
  doc.rect(MARGIN, y, pageWidth - MARGIN * 2, 22, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.rect(MARGIN, y, pageWidth - MARGIN * 2, 22, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(15, 23, 42)
  doc.text('CLAIM CASE SUMMARY REPORT', MARGIN + 4, y + 9)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(51, 65, 85)
  doc.text(`Claim: ${claimId || '—'}`, MARGIN + 4, y + 16)
  doc.text(`Policy: ${policyId || '—'}`, pageWidth / 2, y + 16)
  doc.text(
    generatedAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    pageWidth - MARGIN - 4,
    y + 16,
    { align: 'right' }
  )

  y += 28

  doc.setFillColor(254, 242, 242)
  doc.setDrawColor(254, 202, 202)
  doc.roundedRect(MARGIN, y, pageWidth - MARGIN * 2, 8, 1, 1, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(153, 27, 27)
  doc.text('CONFIDENTIAL — For internal use only. Unauthorized distribution is prohibited.', pageWidth / 2, y + 5.5, { align: 'center' })

  return y + 14
}

function drawSection(doc, section, startY, contentWidth, pageHeight) {
  let y = startY
  const pageWidth = doc.internal.pageSize.getWidth()
  const labelWidth = 58

  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - MARGIN - FOOTER_H) {
      doc.addPage()
      y = MARGIN + 6
    }
  }

  ensureSpace(14)
  doc.setFillColor(29, 78, 216)
  doc.rect(MARGIN, y, 3, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text(section.title.toUpperCase(), MARGIN + 6, y + 6)
  y += 12

  section.rows.forEach(({ label, value }) => {
    ensureSpace(8)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(label, MARGIN + 2, y)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(15, 23, 42)
    const valueLines = doc.splitTextToSize(String(value || '—'), contentWidth - labelWidth - 4)
    valueLines.forEach((line, i) => {
      if (i > 0) {
        ensureSpace(5)
        y += 5
      }
      doc.text(line, MARGIN + labelWidth, y)
    })
    y += 6
    doc.setDrawColor(241, 245, 249)
    doc.line(MARGIN, y - 2, pageWidth - MARGIN, y - 2)
  })

  return y + 4
}

/**
 * Download a branded PDF case summary report.
 */
export async function downloadCaseSummaryPdf({ claim, demogs, generatedAt = new Date() }) {
  const report = buildCaseSummaryReport(claim, demogs)
  const claimId = String(report.claimId || 'claim').trim() || 'claim'

  if (!report.sections?.length) {
    throw new Error('No case summary content to download.')
  }

  const logoDataUrl = await loadLogoDataUrl()
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - MARGIN * 2

  let y = drawHeader(doc, logoDataUrl, claimId, report.policyId, generatedAt)

  report.sections.forEach((section) => {
    y = drawSection(doc, section, y, contentWidth, pageHeight)
  })

  // Certification block
  if (y + 28 > pageHeight - MARGIN - FOOTER_H) {
    doc.addPage()
    y = MARGIN + 6
  }
  y += 6
  doc.setFillColor(248, 250, 252)
  doc.rect(MARGIN, y, contentWidth, 24, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.rect(MARGIN, y, contentWidth, 24, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(51, 65, 85)
  doc.text('Document certification', MARGIN + 4, y + 7)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 116, 139)
  const cert = doc.splitTextToSize(
    `This report was system-generated by ${COMPANY.name} ${COMPANY.product} and reflects claim data at the time of export. For queries contact ${COMPANY.email} or ${COMPANY.phone}.`,
    contentWidth - 8
  )
  doc.text(cert, MARGIN + 4, y + 13)

  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p)
    drawFooter(doc, p, totalPages, generatedAt)
  }

  doc.save(`DH-Claim-Summary-${claimId.replace(/[^\w.-]+/g, '_')}.pdf`)
}
