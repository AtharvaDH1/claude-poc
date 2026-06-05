import { useState } from 'react'
import { WS } from './workspaceUi'
import { Download, ChevronDown, ChevronUp } from 'lucide-react'
import { buildCaseSummaryNarrative } from '../../../util/caseSummaryText'
import { downloadCaseSummaryPdf } from '../../../util/downloadCaseSummaryPdf'
import { useToast } from '../../Toast'

export default function CaseSummaryPanel({ claim, demogs }) {
  const toast = useToast()
  const [open, setOpen] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const narrative = buildCaseSummaryNarrative(claim, demogs)

  const downloadPdf = async () => {
    if (!narrative.trim()) {
      toast('warning', 'No summary', 'Case summary is not available yet.')
      return
    }
    setDownloading(true)
    try {
      downloadCaseSummaryPdf({
        claimId: claim?.claimId,
        summaryText: narrative,
      })
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
          <p style={{ fontSize: '13px', lineHeight: 1.7, color: WS.textSecondary, margin: '0 0 16px' }}>{narrative}</p>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={downloading || !narrative.trim()}
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
            <Download size={16} /> {downloading ? 'Generating PDF…' : 'Download PDF'}
          </button>
        </div>
      )}
    </div>
  )
}
