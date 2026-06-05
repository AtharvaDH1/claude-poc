import { useState, useEffect } from 'react'
import { useToast } from '../Toast'
import { getCaseDetails, refreshLifeAsiaData } from '../../services/add/AssessmentPool'
import { getDecisionMasterData, saveDecision, saveFindings } from '../../services/add/decisionService'
import { T, ROField, ROGrid, SectionTitle, PrimaryBtn } from './AddUi'

const CASE_SUB_TABS = ['Demographics', 'Assessment', 'Decisions', 'Requirement & Comm']

export default function AddCaseDetailPanel({ caseId, fallback, compact = false }) {
  const toast = useToast()
  const [subTab, setSubTab] = useState('Demographics')
  const [loading, setLoading] = useState(!!caseId)
  const [detail, setDetail] = useState(null)
  const [master, setMaster] = useState(null)
  const [decisionForm, setDecisionForm] = useState({ final_decision: '', rule: '', remarks: '' })
  const [findingsText, setFindingsText] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!caseId) return
    setLoading(true)
    try {
      const [caseRes, masterRes] = await Promise.all([
        getCaseDetails(caseId),
        getDecisionMasterData().catch(() => null),
      ])
      const data = caseRes?.data || caseRes
      setDetail(data)
      setMaster(masterRes?.data || masterRes)
      const d = data?.decision || data?.caseInfo || {}
      setDecisionForm({
        final_decision: d.finalDecision || d.FINAL_DECISION || '',
        rule: d.rule || d.RULE || '',
        remarks: data?.caseInfo?.initialCaseRemark || '',
      })
    } catch (e) {
      toast('error', 'Load failed', e?.message || 'Could not load case details.')
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [caseId])

  const info = detail?.caseInfo || {}
  const la = detail?.lifeAssured || {}
  const contract = detail?.contractDetails || detail?.contract || {}

  const handleRefreshAsia = async () => {
    setRefreshing(true)
    try {
      await refreshLifeAsiaData(caseId)
      toast('success', 'Refreshed', 'Life Asia data refresh requested.')
      await load()
    } catch (e) {
      toast('error', 'Refresh failed', e?.message || 'Could not refresh.')
    } finally {
      setRefreshing(false)
    }
  }

  const handleSaveDecision = async () => {
    const username = sessionStorage.getItem('loggedUser') || 'system'
    setSaving(true)
    try {
      await saveDecision(
        {
          case_id: caseId,
          final_decision: decisionForm.final_decision,
          rule: decisionForm.rule,
          add_case_remarks: decisionForm.remarks,
        },
        username
      )
      toast('success', 'Saved', 'Decision saved.')
      await load()
    } catch (e) {
      toast('error', 'Save failed', e?.message || 'Could not save decision.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveFindings = async () => {
    if (!findingsText.trim()) {
      toast('warning', 'Findings', 'Enter at least one finding line.')
      return
    }
    const username = sessionStorage.getItem('loggedUser') || 'system'
    const lines = findingsText.split('\n').filter(Boolean).map((text, i) => ({
      case_id: caseId,
      finding_text: text.trim(),
      seq: i + 1,
    }))
    setSaving(true)
    try {
      await saveFindings(lines, username)
      toast('success', 'Saved', 'Findings saved.')
      setFindingsText('')
    } catch (e) {
      toast('error', 'Save failed', e?.message || 'Could not save findings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: compact ? '16px' : '24px', color: T.textMuted, fontSize: '13px' }}>Loading case {caseId}…</div>
  }

  if (!detail && fallback) {
    return (
      <ROGrid cols={compact ? 2 : 3}>
        {[['Case ID', fallback.caseId], ['Claim ID', fallback.claimId], ['Claimant', fallback.claimant], ['Type', fallback.type], ['Registered', fallback.registeredDate], ['Assigned To', fallback.assignedTo], ['Status', fallback.status]].map(([k, v]) => (
          <ROField key={k} label={k} value={v} />
        ))}
      </ROGrid>
    )
  }

  const tabContent = {
    Demographics: (
      <>
        <SectionTitle>Case</SectionTitle>
        <ROGrid cols={compact ? 2 : 3}>
          <ROField label="Case ID" value={info.caseId || caseId} />
          <ROField label="Policy" value={info.policyNo} />
          <ROField label="KRN" value={info.krn} />
          <ROField label="Status" value={info.activityStatus} />
          <ROField label="Assigned To" value={info.assignedTo} />
          <ROField label="Referral Date" value={info.referralDate} />
          <ROField label="Exclusion Type" value={info.exclusionType} />
        </ROGrid>
        <div style={{ marginTop: '16px' }}>
          <SectionTitle>Life assured</SectionTitle>
          <ROGrid cols={compact ? 2 : 3}>
            <ROField label="Name" value={la.name} />
            <ROField label="DOB" value={la.dob} />
            <ROField label="Gender" value={la.gender} />
            <ROField label="City" value={la.city} />
            <ROField label="State" value={la.state} />
            <ROField label="Mobile" value={la.mobileNo || la.mobile_no} />
          </ROGrid>
        </div>
        <div style={{ marginTop: '16px' }}>
          <SectionTitle>Contract</SectionTitle>
          <ROGrid cols={compact ? 2 : 3}>
            <ROField label="Product" value={contract.productName || contract.product_name} />
            <ROField label="Product Code" value={contract.productCode || contract.product_code} />
            <ROField label="Base SA" value={contract.baseSa || contract.base_sa || contract.BASE_SA} />
            <ROField label="Policy Status" value={contract.policyStatus || contract.policy_status} />
            <ROField label="UW Decision" value={contract.uwDecision || contract.uw_decision} />
          </ROGrid>
        </div>
        <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
          <PrimaryBtn onClick={handleRefreshAsia} disabled={refreshing}>{refreshing ? 'Refreshing…' : 'Refresh Life Asia'}</PrimaryBtn>
        </div>
      </>
    ),
    Assessment: (
      <div>
        <SectionTitle>Assessment findings</SectionTitle>
        <p style={{ fontSize: '11px', color: T.textMuted, marginBottom: '10px' }}>“Refresh Iris” is not wired in v2 — use exclusion actions from Assessment Pool or Life Asia refresh on Demographics.</p>
        <textarea
          value={findingsText}
          onChange={(e) => setFindingsText(e.target.value)}
          rows={5}
          placeholder="One finding per line…"
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${T.border}`, fontFamily: 'Inter,sans-serif', fontSize: '13px', boxSizing: 'border-box' }}
        />
        <div style={{ marginTop: '10px' }}>
          <PrimaryBtn onClick={handleSaveFindings} disabled={saving}>Save findings</PrimaryBtn>
        </div>
        {master && (
          <div style={{ marginTop: '16px', fontSize: '12px', color: T.textMuted }}>
            Decision master options loaded ({Array.isArray(master) ? master.length : '—'} rules).
          </div>
        )}
      </div>
    ),
    Decisions: (
      <div>
        <SectionTitle>Decision</SectionTitle>
        <div style={{ display: 'grid', gap: '12px', maxWidth: '480px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: T.textSecondary }}>Final decision</label>
          <input
            value={decisionForm.final_decision}
            onChange={(e) => setDecisionForm((p) => ({ ...p, final_decision: e.target.value }))}
            style={{ height: '38px', padding: '0 10px', borderRadius: '7px', border: `1px solid ${T.border}`, fontFamily: 'Inter,sans-serif' }}
          />
          <label style={{ fontSize: '12px', fontWeight: 600, color: T.textSecondary }}>Rule</label>
          <input
            value={decisionForm.rule}
            onChange={(e) => setDecisionForm((p) => ({ ...p, rule: e.target.value }))}
            style={{ height: '38px', padding: '0 10px', borderRadius: '7px', border: `1px solid ${T.border}`, fontFamily: 'Inter,sans-serif' }}
          />
          <label style={{ fontSize: '12px', fontWeight: 600, color: T.textSecondary }}>Remarks</label>
          <textarea
            value={decisionForm.remarks}
            onChange={(e) => setDecisionForm((p) => ({ ...p, remarks: e.target.value }))}
            rows={3}
            style={{ padding: '10px', borderRadius: '7px', border: `1px solid ${T.border}`, fontFamily: 'Inter,sans-serif' }}
          />
        </div>
        <div style={{ marginTop: '12px' }}>
          <PrimaryBtn onClick={handleSaveDecision} disabled={saving}>Save decision</PrimaryBtn>
        </div>
      </div>
    ),
    'Requirement & Comm': (
      <div style={{ color: T.textMuted, fontSize: '13px', padding: '12px', background: '#FAFAFA', borderRadius: '8px', border: `1px solid ${T.border}` }}>
        Requirement and communication data for case <strong style={{ color: T.primary }}>{caseId}</strong> is managed in the main claims registration workspace once the case is linked to a claim number.
      </div>
    ),
  }

  return (
    <div>
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, marginBottom: '16px', flexWrap: 'wrap' }}>
        {CASE_SUB_TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setSubTab(t)}
            style={{
              padding: '10px 14px',
              border: 'none',
              borderBottom: subTab === t ? `2px solid ${T.primary}` : '2px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: subTab === t ? 700 : 500,
              color: subTab === t ? T.primary : T.textMuted,
              fontFamily: 'Inter,sans-serif',
              marginBottom: '-1px',
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {tabContent[subTab]}
    </div>
  )
}
