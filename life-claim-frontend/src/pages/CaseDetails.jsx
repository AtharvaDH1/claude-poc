import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import AddCaseDetailPanel from '../components/add/AddCaseDetailPanel'
import { closeCasesAsExclusion, moveCasesToBeReferred } from '../services/add/AssessmentPool'
import { applyExclusionRules } from '../services/add/exclusionRulesService'
import { useToast } from '../components/Toast'
import { ArrowLeft } from 'lucide-react'
import { T, PrimaryBtn } from '../components/add/AddUi'

function placeholderCase(id) {
  return { caseId: id, policyNumber: '—', krn: '—', status: 'Open', assignedTo: 'Unassigned' }
}

export default function CaseDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const c = location.state?.case || placeholderCase(id)
  const [busy, setBusy] = useState(false)

  const runAction = async (fn, okMsg) => {
    setBusy(true)
    try {
      await fn()
      toast('success', 'Done', okMsg)
    } catch (e) {
      toast('error', 'Failed', e?.message || 'Action failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppLayout pageTitle={`Case ${c.caseId || id}`} pageSubtitle="ADD case workspace">
      <div style={{ padding: '24px', fontFamily: 'Inter,sans-serif' }}>
        <button
          type="button"
          onClick={() => navigate('/add-screen')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', padding: '8px 14px', borderRadius: '8px', border: `1px solid ${T.border}`, background: '#F8FAFC', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif', color: T.textMuted }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: T.textPrimary, margin: '0 0 4px' }}>{c.caseId || id}</h1>
            <p style={{ fontSize: '13px', color: T.textMuted, margin: 0 }}>Policy {c.policyNumber || '—'} · KRN {c.krn || '—'} · {c.status}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <PrimaryBtn disabled={busy} onClick={() => runAction(() => applyExclusionRules(c.caseId || id), 'Exclusion rules applied.')}>Apply exclusion</PrimaryBtn>
            <PrimaryBtn disabled={busy} variant="secondary" onClick={() => runAction(() => closeCasesAsExclusion([c.caseId || id], 'Manual', 'Closed from v2 UI'), 'Case closed as exclusion.')}>Close exclusion</PrimaryBtn>
            <PrimaryBtn disabled={busy} variant="secondary" onClick={() => runAction(() => moveCasesToBeReferred([c.caseId || id]), 'Case marked for referral.')}>Refer case</PrimaryBtn>
          </div>
        </div>

        <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: '24px' }}>
          <AddCaseDetailPanel caseId={c.caseId || id} fallback={c} />
        </div>
      </div>
    </AppLayout>
  )
}
