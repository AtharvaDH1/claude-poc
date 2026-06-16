import { jsPDF } from 'jspdf'
import { COMPANY } from '../config/companyBrand'
import { buildCaseSummaryReport } from './caseSummaryText'

const MARGIN = 12
const FOOTER_H = 14
const ROW_H = 5.4
const LABEL_W = 48

const C = {
  navy: [15, 23, 42],
  blue: [29, 78, 216],
  blueLight: [239, 246, 255],
  slate: [51, 65, 85],
  muted: [100, 116, 139],
  border: [226, 232, 240],
  rowAlt: [248, 250, 252],
  white: [255, 255, 255],
  accent: [139, 26, 43],
  amber: [146, 64, 14],
  amberBg: [255, 251, 235],
  green: [6, 95, 70],
  greenBg: [236, 253, 245],
}

function setFill(doc, [r, g, b]) {
  doc.setFillColor(r, g, b)
}

function setDraw(doc, [r, g, b]) {
  doc.setDrawColor(r, g, b)
}

function setText(doc, [r, g, b]) {
  doc.setTextColor(r, g, b)
}

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

function measureLogoSize(dataUrl, maxW, maxH) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight
      let w = maxW
      let h = w / ratio
      if (h > maxH) {
        h = maxH
        w = h * ratio
      }
      resolve({ w, h })
    }
    img.onerror = () => resolve({ w: maxW, h: maxH * 0.35 })
    img.src = dataUrl
  })
}

function statusStyle(status) {
  const s = String(status || '').toLowerCase()
  if (s.includes('approv') || s.includes('payout completed')) return { bg: C.greenBg, fg: C.green }
  if (s.includes('reject') || s.includes('repudi')) return { bg: [254, 242, 242], fg: [153, 27, 27] }
  return { bg: C.amberBg, fg: C.amber }
}

function drawKpiChip(doc, x, y, w, label, value, highlight = false) {
  setFill(doc, highlight ? C.blueLight : C.white)
  setDraw(doc, C.border)
  doc.roundedRect(x, y, w, 14, 2, 2, highlight ? 'FD' : 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  setText(doc, C.muted)
  doc.text(label.toUpperCase(), x + 3, y + 4.5)

  doc.setFont('helvetica', highlight ? 'bold' : 'normal')
  doc.setFontSize(highlight ? 9.5 : 8.5)
  setText(doc, highlight ? C.navy : C.slate)
  const lines = doc.splitTextToSize(String(value || '—'), w - 6)
  doc.text(lines[0], x + 3, y + 10.5)
}

function drawFooter(doc, generatedAt) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const barY = pageHeight - FOOTER_H

  setFill(doc, C.navy)
  doc.rect(0, barY, pageWidth, FOOTER_H, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  setText(doc, C.white)
  doc.text(`${COMPANY.name}  ·  ${COMPANY.product}`, MARGIN, barY + 5)
  doc.text(
    `Generated ${generatedAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`,
    pageWidth / 2,
    barY + 5,
    { align: 'center' }
  )
  doc.text('Confidential · Page 1 of 1', pageWidth - MARGIN, barY + 5, { align: 'right' })

  doc.setFontSize(6)
  setText(doc, [148, 163, 184])
  doc.text(`${COMPANY.email}  ·  ${COMPANY.phone}  ·  ${COMPANY.website}`, pageWidth / 2, barY + 10.5, { align: 'center' })
}

async function drawHeader(doc, logoDataUrl, claim, report, generatedAt) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentW = pageWidth - MARGIN * 2
  const headerH = 32

  setFill(doc, C.white)
  doc.rect(0, 0, pageWidth, headerH + 4, 'F')

  if (logoDataUrl) {
    const { w, h } = await measureLogoSize(logoDataUrl, 72, 24)
    doc.addImage(logoDataUrl, 'PNG', MARGIN, 6, w, h)
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    setText(doc, C.navy)
    doc.text(COMPANY.name, MARGIN, 14)
  }

  const titleX = MARGIN + 78
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  setText(doc, C.navy)
  doc.text('Claim Case Summary', titleX, 13)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  setText(doc, C.muted)
  doc.text(COMPANY.product, titleX, 18.5)
  doc.text(
    `Report date: ${generatedAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    titleX,
    23.5
  )

  setDraw(doc, C.accent)
  doc.setLineWidth(0.8)
  doc.line(MARGIN, headerH, pageWidth - MARGIN, headerH)

  let y = headerH + 4

  setFill(doc, C.navy)
  doc.rect(0, y, pageWidth, 10, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  setText(doc, C.white)
  doc.text('INTERNAL USE ONLY — CLAIM INTELLIGENCE REPORT', pageWidth / 2, y + 6.5, { align: 'center' })
  y += 12

  const overview = report.sections.find((s) => s.title === 'Claim Overview')
  const statusVal = overview?.rows.find((r) => r.label === 'Workflow Status')?.value || claim?.status
  const daysVal = overview?.rows.find((r) => r.label === 'Days Open')?.value || claim?.daysOpen
  const chipW = (contentW - 9) / 4

  drawKpiChip(doc, MARGIN, y, chipW, 'Claim Number', report.claimId || claim?.claimId, true)
  drawKpiChip(doc, MARGIN + chipW + 3, y, chipW, 'Policy Number', report.policyId || claim?.policyId)

  const st = statusStyle(statusVal)
  const statusX = MARGIN + (chipW + 3) * 2
  setFill(doc, st.bg)
  setDraw(doc, C.border)
  doc.roundedRect(statusX, y, chipW, 14, 2, 2, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  setText(doc, C.muted)
  doc.text('WORKFLOW STATUS', statusX + 3, y + 4.5)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  setText(doc, st.fg)
  const stLines = doc.splitTextToSize(String(statusVal || '—'), chipW - 6)
  doc.text(stLines[0], statusX + 3, y + 10.5)

  drawKpiChip(doc, MARGIN + (chipW + 3) * 3, y, chipW, 'Days Open', daysVal != null ? `${daysVal} days` : '—')
  y += 17

  setFill(doc, [254, 242, 242])
  setDraw(doc, [254, 202, 202])
  doc.roundedRect(MARGIN, y, contentW, 5.5, 1.5, 1.5, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  setText(doc, [153, 27, 27])
  doc.text(
    'CONFIDENTIAL — For authorised personnel only. Do not distribute outside the organisation.',
    pageWidth / 2,
    y + 3.8,
    { align: 'center' }
  )

  return y + 8
}

function sectionCardHeight(section, doc, colWidth) {
  let h = 9
  section.rows.forEach(({ value }) => {
    const lines = doc.splitTextToSize(String(value || '—'), colWidth - LABEL_W - 8)
    h += ROW_H + (Math.min(lines.length, 2) - 1) * 3
  })
  return h + 3
}

function drawSectionCard(doc, section, x, y, colWidth) {
  const cardH = sectionCardHeight(section, doc, colWidth)

  setFill(doc, C.white)
  setDraw(doc, C.border)
  doc.roundedRect(x, y, colWidth, cardH, 2.5, 2.5, 'FD')

  setFill(doc, C.blueLight)
  doc.roundedRect(x, y, colWidth, 7.5, 2.5, 2.5, 'F')
  doc.rect(x, y + 4, colWidth, 4, 'F')

  setFill(doc, C.blue)
  doc.rect(x, y + 1.5, 2, 4.5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  setText(doc, C.blue)
  doc.text(section.title.toUpperCase(), x + 5, y + 5.2)

  let ry = y + 10
  section.rows.forEach(({ label, value }, i) => {
    if (i % 2 === 0) {
      setFill(doc, C.rowAlt)
      doc.rect(x + 1.5, ry - 3.2, colWidth - 3, ROW_H, 'F')
    }

    const textY = ry
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    setText(doc, C.muted)
    doc.text(label, x + 4, textY)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    setText(doc, C.navy)
    const valueStr = String(value || '—')
    const maxW = colWidth - LABEL_W - 6
    const lines = doc.splitTextToSize(valueStr, maxW)
    const lineCount = Math.min(lines.length, 2)
    for (let li = 0; li < lineCount; li += 1) {
      doc.text(lines[li], x + LABEL_W, textY + li * 3)
    }

    ry += ROW_H + (lineCount > 1 ? (lineCount - 1) * 3 : 0)
  })

  return y + cardH + 4
}

/**
 * Download a premium branded single-page PDF case summary report.
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
  const colGap = 6
  const colWidth = (contentWidth - colGap) / 2
  const leftX = MARGIN
  const rightX = MARGIN + colWidth + colGap

  setFill(doc, C.rowAlt)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  let y = await drawHeader(doc, logoDataUrl, claim, report, generatedAt)

  const sections = report.sections.filter((s) => s.title !== 'Claim Overview')
  const splitAt = Math.ceil(sections.length / 2)
  const leftSections = sections.slice(0, splitAt)
  const rightSections = sections.slice(splitAt)

  let leftY = y
  leftSections.forEach((section) => {
    leftY = drawSectionCard(doc, section, leftX, leftY, colWidth)
  })

  let rightY = y
  rightSections.forEach((section) => {
    rightY = drawSectionCard(doc, section, rightX, rightY, colWidth)
  })

  y = Math.max(leftY, rightY) + 2

  const certH = 16
  const maxCertY = pageHeight - FOOTER_H - certH - 3
  if (y > maxCertY) y = maxCertY

  setFill(doc, C.white)
  setDraw(doc, C.border)
  doc.roundedRect(MARGIN, y, contentWidth, certH, 2, 2, 'FD')

  setFill(doc, C.blue)
  doc.rect(MARGIN, y, 3, certH, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  setText(doc, C.slate)
  doc.text('Document certification', MARGIN + 6, y + 5.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  setText(doc, C.muted)
  const cert = doc.splitTextToSize(
    `This report was automatically generated by ${COMPANY.name} ${COMPANY.product} and reflects claim data at the time of export. For verification or queries, contact ${COMPANY.email} or ${COMPANY.phone}.`,
    contentWidth - 12
  )
  doc.text(cert, MARGIN + 6, y + 10)

  drawFooter(doc, generatedAt)

  doc.save(`DH-Claim-Summary-${claimId.replace(/[^\w.-]+/g, '_')}.pdf`)
}
