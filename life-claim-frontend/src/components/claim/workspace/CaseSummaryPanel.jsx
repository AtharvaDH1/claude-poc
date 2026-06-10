import { useState } from 'react'

import { WS } from './workspaceUi'

import { Download, ChevronDown, ChevronUp } from 'lucide-react'

import { buildCaseSummaryReport } from '../../../util/caseSummaryText'

import { downloadCaseSummaryPdf } from '../../../util/downloadCaseSummaryPdf'

import { useToast } from '../../Toast'



export default function CaseSummaryPanel({ claim, demogs }) {

  const toast = useToast()

  const [open, setOpen] = useState(true)

  const [downloading, setDownloading] = useState(false)

  const report = buildCaseSummaryReport(claim, demogs)

  const hasContent = report.sections.some((s) => s.rows.some((r) => r.value && r.value !== '—'))



  const downloadPdf = async () => {

    if (!hasContent) {

      toast('warning', 'No summary', 'Case summary is not available yet.')

      return

    }

    setDownloading(true)

    try {

      await downloadCaseSummaryPdf({ claim, demogs })

      toast('success', 'PDF downloaded', `Case summary for ${claim?.claimId || 'claim'} saved.`)

    } catch (e) {

      toast('error', 'Download failed', e?.message || 'Could not generate PDF.')

    } finally {

      setDownloading(false)

    }

  }



  return (

    <div style={{ background: WS.card, borderRadius: '12px', border: `1px solid ${WS.border}`, marginBottom: '16px', overflow: 'hidden' }}>

      <button

        type="button"

        onClick={() => setOpen((p) => !p)}

        style={{ width: '100%', padding: '14px 20px', border: 'none', background: '#FAFAFA', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Inter,sans-serif' }}

      >

        <span style={{ fontSize: '14px', fontWeight: 800, color: WS.textPrimary }}>Case Summary</span>

        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: WS.textMuted }}>

          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}

        </span>

      </button>

      {open && (

        <div style={{ padding: '18px 20px', borderTop: `1px solid ${WS.borderSubtle}` }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>

            {report.sections.map((section) => (

              <div key={section.title}>

                <div style={{ fontSize: '11px', fontWeight: 800, color: WS.primary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>

                  {section.title}

                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '6px 16px' }}>

                  {section.rows.map((row) => (

                    <div key={`${section.title}-${row.label}`} style={{ fontSize: '12px', lineHeight: 1.5 }}>

                      <span style={{ color: WS.textMuted, fontWeight: 600 }}>{row.label}: </span>

                      <span style={{ color: WS.textSecondary }}>{row.value}</span>

                    </div>

                  ))}

                </div>

              </div>

            ))}

          </div>

          <button

            type="button"

            onClick={downloadPdf}

            disabled={downloading || !hasContent}

            style={{

              display: 'inline-flex',

              alignItems: 'center',

              gap: '8px',

              padding: '9px 16px',

              borderRadius: '8px',

              border: `1px solid ${WS.border}`,

              background: '#fff',

              fontSize: '13px',

              fontWeight: 700,

              cursor: downloading ? 'wait' : 'pointer',

              color: WS.primary,

              fontFamily: 'Inter,sans-serif',

              opacity: downloading ? 0.7 : 1,

            }}

          >

            <Download size={16} /> {downloading ? 'Generating PDF…' : 'Download PDF Report'}

          </button>

        </div>

      )}

    </div>

  )

}


