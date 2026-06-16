import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import AddCaseDetailPanel from '../components/add/AddCaseDetailPanel'
import { getCaseDetails, closeCasesAsExclusion, moveCasesToBeReferred } from '../services/add/AssessmentPool'
import { applyExclusionRules } from '../services/add/exclusionRulesService'
import { useToast } from '../components/Toast'
import { ArrowLeft } from 'lucide-react'
import { T, PrimaryBtn, ROField, ROGrid } from '../components/add/AddUi'

function formatHeaderDate(raw) {
  if (!raw) return '—'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return String(raw).split('T')[0]
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function CaseDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const navCase = location.state?.case
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const loadDetail = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await getCaseDetails(id)
      if (res?.success === false) throw new Error(res.error || 'Failed to load case')
      setDetail(res?.data || res)
    } catch (e) {
      toast('error', 'Case load failed', e?.message || 'Could not open this case.')
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [id, toast])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  const info = detail?.caseInfo || {}
  const caseId = info.caseId || id
  const policyNo = info.policyNo || navCase?.policyNumber || navCase?.policyId || '—'
  const krn = info.krn || navCase?.krn || '—'
  const status = info.activityStatus || navCase?.status || '—'

  const runAction = async (fn, okMsg) => {
    setBusy(true)
    try {
      await fn()
      toast('success', 'Done', okMsg)
      await loadDetail()
    } catch (e) {
      toast('error', 'Failed', e?.message || 'Action failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppLayout pageTitle={`Case ${caseId}`} pageSubtitle="Advance Intelligence case workspace">
      <div style={{ padding: '24px', fontFamily: 'Inter,sans-serif' }}>
        <button
          type="button"
          onClick={() => navigate('/add-screen')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', padding: '8px 14px', borderRadius: '8px', border: `1px solid ${T.border}`, background: '#F8FAFC', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif', color: T.textMuted }}
        >
          <ArrowLeft size={16} /> Back to Advance Intelligence
        </button>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: T.textMuted }}>Loading case workspace…</div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: T.textPrimary, margin: '0 0 8px' }}>Case {caseId}</h1>
                <ROGrid cols={3}>
                  <ROField label="Policy No" value={policyNo} />
                  <ROField label="KRN" value={krn} />
                  <ROField label="Activity Status" value={status} />
                  <ROField label="Referral Date" value={formatHeaderDate(info.referralDate)} />
                  <ROField label="Triggered Date" value={formatHeaderDate(info.triggeredDate)} />
                  <ROField label="Exclusion Type" value={info.exclusionType || '—'} />
                </ROGrid>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <PrimaryBtn disabled={busy} onClick={() => runAction(() => applyExclusionRules(caseId), 'Exclusion rules applied.')}>Apply exclusion</PrimaryBtn>
                <PrimaryBtn disabled={busy} variant="secondary" onClick={() => runAction(() => closeCasesAsExclusion([caseId], 'Manual', 'Closed from workspace'), 'Case closed as exclusion.')}>Close exclusion</PrimaryBtn>
                <PrimaryBtn disabled={busy} variant="secondary" onClick={() => runAction(() => moveCasesToBeReferred([caseId]), 'Case marked for referral.')}>Refer case</PrimaryBtn>
              </div>
            </div>

            <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: '24px' }}>
              <AddCaseDetailPanel
                caseId={caseId}
                fallback={navCase}
                detail={detail}
                onDetailChange={setDetail}
              />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
