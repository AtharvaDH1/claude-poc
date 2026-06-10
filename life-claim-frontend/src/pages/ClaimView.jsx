import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import {
  getClaimWorkspaceInitial,
  getClaimWorkspaceTab,
} from '../services/claimsService'
import { claimSearch } from '../services/claimSearchService'
import updatePolicyService from '../services/updatePolicyService'
import {
  buildPolicyDataFromRaw,
  mergePolicyData,
  buildWorkspaceSubmitPayload,
} from '../util/buildPolicyData'
import {
  areFieldsDisabled,
  enableAssessor,
  enableVerifier,
  workspaceCanEdit,
  getSubmitGuard,
  mapAccessorDecisionToApi,
} from '../util/claimWorkspaceMode'
import { isPreAssessorRole } from '../util/preAssessor'
import FraudRuleManagerModal from '../components/claim/FraudRuleManagerModal'
import TransactionDetailsModal from '../components/claim/TransactionDetailsModal'
import ClaimSuccessModal from '../components/claim/ClaimSuccessModal'
import ClaimAssignModal from '../components/claim/ClaimAssignModal'
import CaseSummaryPanel from '../components/claim/workspace/CaseSummaryPanel'
import QuickAccessModal from '../components/claim/workspace/QuickAccessModal'
import DocumentSideSlider from '../components/claim/workspace/DocumentSideSlider'
import DemographicsWorkspaceTab from '../components/claim/workspace/tabs/DemographicsWorkspaceTab'
import RequirementsWorkspaceTab from '../components/claim/workspace/tabs/RequirementsWorkspaceTab'
import AssessmentWorkspaceTab from '../components/claim/workspace/tabs/AssessmentWorkspaceTab'
import DecisionWorkspaceTab from '../components/claim/workspace/tabs/DecisionWorkspaceTab'
import { WS } from '../components/claim/workspace/workspaceUi'
import { ShieldAlert, Receipt, UserPlus, FileText, Zap } from 'lucide-react'

const TABS = ['Demographics', 'Requirements', 'Assessment', 'Decision & Summary']
const LAZY_TABS = new Set(['Requirements', 'Assessment', 'Decision & Summary'])

const STATUS_COLORS = {
  Pending: { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' },
  Approved: { bg: '#ECFDF5', border: '#A7F3D0', color: '#065F46' },
  Rejected: { bg: '#FEF2F2', border: '#FECACA', color: '#991B1B' },
  'In Progress': { bg: '#EFF6FF', border: '#BFDBFE', color: '#1E40AF' },
}

function HeaderBox({ label, value }) {
  return (
    <div style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: '10px', border: `1px solid ${WS.border}`, minWidth: '120px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: WS.textSubtle, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 800, color: WS.textPrimary, marginTop: '4px', fontFamily: label.includes('Claim') || label.includes('Policy') ? 'monospace' : 'inherit' }}>{value || '—'}</div>
    </div>
  )
}

export default function ClaimView() {
  const { claimId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const { user } = useAuth()

  const [claim, setClaim] = useState(null)
  const [workspaceRaw, setWorkspaceRaw] = useState(null)
  const [policyData, setPolicyData] = useState(null)
  const policyDataRef = useRef(null)
  const workspaceRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState(false)
  const [loadedTabs, setLoadedTabs] = useState(new Set(['Demographics']))
  const [activeTab, setActiveTab] = useState('Demographics')
  const [showQuick, setShowQuick] = useState(false)
  const [showFraud, setShowFraud] = useState(false)
  const [showTxn, setShowTxn] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [showDocs, setShowDocs] = useState(false)
  const [calcResult, setCalcResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(null)

  const [accessorDecision, setAccessorDecision] = useState('')
  const [accessorReason, setAccessorReason] = useState('')
  const [accessorAmount, setAccessorAmount] = useState('')
  const [verificationStatus, setVerificationStatus] = useState('')
  const [verificationRemarks, setVerificationRemarks] = useState('')

  useEffect(() => { workspaceRef.current = workspaceRaw }, [workspaceRaw])
  useEffect(() => { policyDataRef.current = policyData }, [policyData])

  const syncFromView = useCallback((view, raw) => {
    setClaim(view)
    setWorkspaceRaw(raw)
    const pd = buildPolicyDataFromRaw(raw, claimId, user)
    setPolicyData(pd)
    policyDataRef.current = pd
    setAccessorDecision(view.accessorDecision || '')
    setAccessorReason(view.accessorReason || '')
    const calc = raw?.calcAmt
    if (calc) setCalcResult(calc)
    const payable =
      view.accessorAmount ||
      calc?.totalAmtPayable ||
      calc?.baseSec
    setAccessorAmount(String(payable || ''))
    setVerificationStatus(view.verificationStatus || '')
    setVerificationRemarks(view.verificationRemarks || '')
  }, [claimId, user])

  useEffect(() => {
    if (!claimId) return
    setLoading(true)
    setLoadedTabs(new Set(['Demographics']))
    getClaimWorkspaceInitial(claimId)
      .then(({ view, raw }) => syncFromView(view, raw))
      .catch(() => {
        toast('error', 'Load Failed', 'Could not load claim workspace.')
        navigate('/claim-search')
      })
      .finally(() => setLoading(false))
  }, [claimId, navigate, toast, syncFromView])

  const EAGLE_TABLE_KEYS = [
    'hospitalDetailsTable', 'doctorDetailsTable', 'proofDetailsTable',
    'insuranceProofDetailsTable', 'witnessDetailsTable', 'incomeDetailsTable',
  ]

  const patchPolicyData = useCallback((patch) => {
    setPolicyData((prev) => {
      const next = mergePolicyData(prev, patch)
      policyDataRef.current = next
      return next
    })
    setWorkspaceRaw((prev) => {
      if (!prev || !patch) return prev
      const demogs = { ...(prev.demogs || {}) }
      let requirements = prev.requirements ? { ...prev.requirements } : null
      let assessment = prev.assessment ? { ...prev.assessment } : null

      if (patch.intimationDetails) {
        demogs.intimation = { ...(demogs.intimation || {}), ...patch.intimationDetails }
      }
      if (patch.establishedCauseDetails) {
        demogs.establishedCause = { ...(demogs.establishedCause || {}), ...patch.establishedCauseDetails }
      }
      if (patch.lifeAssuredDetails) {
        demogs.lifeAssured = { ...(demogs.lifeAssured || {}), ...patch.lifeAssuredDetails }
      }
      if (patch.contactDetails) {
        demogs.contact = { ...(demogs.contact || {}), ...patch.contactDetails }
      }
      if (patch.claimantDetails) demogs.claimant = patch.claimantDetails
      if (patch.payeeDetails) demogs.payee = patch.payeeDetails
      EAGLE_TABLE_KEYS.forEach((k) => {
        if (patch[k]) demogs[k] = patch[k]
      })
      if (patch.eagleScreenDetails) {
        demogs.eagle = { ...(demogs.eagle || {}), ...patch.eagleScreenDetails }
      }
      if (patch.requirementTable) {
        requirements = { ...(requirements || {}), requirementTable: patch.requirementTable }
      }
      if (patch.claimQuestions) {
        const q = {
          ...(assessment?.assessment || assessment?.claimQuestions || {}),
          ...patch.claimQuestions,
        }
        assessment = { ...(assessment || {}), assessment: q, claimQuestions: q }
      }
      if (patch.priorityFlagRemarks != null || patch.fraudRemarks != null) {
        const v = patch.fraudRemarks ?? patch.priorityFlagRemarks
        assessment = { ...(assessment || {}), fraudRemarks: v, priorityFlagRemarks: v }
      }

      return {
        ...prev,
        demogs,
        ...(requirements ? { requirements } : {}),
        ...(assessment ? { assessment } : {}),
      }
    })
  }, [])

  const handleTabChange = async (tab) => {
    setActiveTab(tab)
    if (!claimId || !LAZY_TABS.has(tab) || loadedTabs.has(tab)) return
    setTabLoading(true)
    try {
      const { view, raw: next } = await getClaimWorkspaceTab(claimId, tab, workspaceRef.current || {})
      workspaceRef.current = next
      syncFromView(view, next)
      setLoadedTabs((p) => new Set([...p, tab]))
    } catch {
      toast('error', 'Tab load failed', `Could not load ${tab}. Click the tab again to retry.`)
    } finally {
      setTabLoading(false)
    }
  }

  const handleSubmit = async () => {
    const guard = getSubmitGuard(claim, user?.username, location.state)
    if (!guard.ok) {
      toast('warning', 'Cannot submit', guard.hint)
      return
    }
    setSubmitting(true)
    const username = user?.username || sessionStorage.getItem('loggedUser') || ''
    const edits = {
      accessorDecision,
      accessorReason,
      accessorAmount,
      verificationStatus,
      verificationRemarks,
    }
    try {
      if (guard.mode === 'assessor') {
        await claimSearch.updateAssessor(
          { decision: mapAccessorDecisionToApi(accessorDecision), remarks: accessorReason },
          claimId,
          username,
        )
      } else if (guard.mode === 'verifier') {
        await claimSearch.updateVerifier(
          { status: verificationStatus, remarks: verificationRemarks },
          claimId,
          username,
        )
      }
      const payload = buildWorkspaceSubmitPayload(
        policyDataRef.current,
        edits,
        claimId,
        username,
        guard.mode,
      )
      await updatePolicyService(payload)
      setSubmitSuccess({ mode: guard.mode, claimId })
    } catch (e) {
      toast('error', 'Submit failed', e?.message || 'Could not complete submit.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !claim) {
    return (
      <AppLayout>
        <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'Inter,sans-serif' }}>
          <div style={{ fontSize: '14px', color: WS.textMuted, fontWeight: 600 }}>Loading claim {claimId}…</div>
        </div>
      </AppLayout>
    )
  }

  const sc = STATUS_COLORS[claim.status] || STATUS_COLORS.Pending
  const userRoles = user?.roles?.length ? user.roles : user?.role ? [user.role] : []
  const browseMode = areFieldsDisabled(location.state)
  const assessorCanEdit = enableAssessor(location.state, claim, userRoles)
  const verifierCanEdit = enableVerifier(location.state, claim, userRoles)
  const canEdit = workspaceCanEdit(location.state, claim, userRoles)
  const isPreAssessor = isPreAssessorRole(user?.role, userRoles)
  const showWorkspaceTools = canEdit && !isPreAssessor && !browseMode
  const submitGuard = getSubmitGuard(claim, user?.username, location.state)
  const demogs = workspaceRaw?.demogs || {}

  return (
    <AppLayout>
      <div style={{ padding: '24px', fontFamily: 'Inter,sans-serif' }}>
        {browseMode && (
          <div style={{ marginBottom: '14px', padding: '12px 16px', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A', fontSize: '13px', color: '#92400E', fontWeight: 600 }}>
            Browse mode — fields are read-only. Open from <strong>My Tasks</strong> or Dashboard <strong>pencil</strong> to edit.
          </div>
        )}
        {canEdit && !browseMode && (
          <div style={{ marginBottom: '14px', padding: '12px 16px', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0', fontSize: '13px', color: '#065F46', fontWeight: 600 }}>
            Work mode — all tabs are editable. Changes save when you submit on Decision &amp; Summary.
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button type="button" onClick={() => navigate(-1)} style={{ padding: '8px 14px', borderRadius: '8px', border: `1px solid ${WS.border}`, background: '#F8FAFC', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>← Back</button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: WS.textPrimary }}>Claim workspace</h1>
                <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '99px', background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}>{claim.status}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setShowDocs(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '8px', border: `1px solid ${WS.border}`, background: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
              <FileText size={16} /> Documents
            </button>
            {showWorkspaceTools && (
              <>
                <button type="button" onClick={() => setShowQuick(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '8px', border: 'none', background: '#7C3AED', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                  <Zap size={16} /> Quick Access
                </button>
                <button type="button" onClick={() => setShowTxn(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '8px', border: `1px solid ${WS.border}`, fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                  <Receipt size={16} /> Transaction
                </button>
                <button type="button" onClick={() => setShowFraud(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '8px', background: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                  <ShieldAlert size={16} /> Fraud
                </button>
              </>
            )}
            {!browseMode && userRoles.some((r) => ['Admin', 'admin'].includes(r)) && (
              <button type="button" onClick={() => setShowAssign(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '8px', border: `1px solid ${WS.border}`, fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                <UserPlus size={16} /> Assign
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <HeaderBox label="Policy no" value={claim.policyId} />
          <HeaderBox label="Claim no" value={claim.claimId} />
          <HeaderBox label="Claim type" value={claim.claimType} />
          <HeaderBox label="Intimation date" value={claim.intimationDate} />
          <HeaderBox label="Life assured" value={claim.laName} />
        </div>

        {browseMode && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', background: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: '13px', fontWeight: 600, color: '#1E40AF' }}>
            Browse mode — read-only. Open from My Task to work this claim.
          </div>
        )}

        <CaseSummaryPanel claim={claim} demogs={demogs} />

        <div style={{ background: WS.card, borderRadius: '12px', border: `1px solid ${WS.border}`, overflow: 'hidden' }}>
          {tabLoading && (
            <div style={{ padding: '8px 16px', fontSize: '12px', background: '#FFFBEB', color: '#92400E' }}>Loading tab data…</div>
          )}
          <div style={{ display: 'flex', borderBottom: `1px solid ${WS.border}`, overflowX: 'auto' }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
                style={{
                  padding: '14px 18px',
                  border: 'none',
                  borderBottom: activeTab === tab ? `3px solid ${WS.primary}` : '3px solid transparent',
                  background: activeTab === tab ? '#EFF6FF' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: activeTab === tab ? 700 : 500,
                  color: activeTab === tab ? WS.primary : WS.textMuted,
                  fontFamily: 'Inter,sans-serif',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <div style={{ padding: '24px' }}>
            {activeTab === 'Demographics' && (
              <DemographicsWorkspaceTab
                claim={claim}
                demogs={demogs}
                canEdit={canEdit}
                onPatch={patchPolicyData}
                onOpenFraud={() => setShowFraud(true)}
              />
            )}
            {activeTab === 'Requirements' && (
              loadedTabs.has('Requirements') ? (
                <RequirementsWorkspaceTab
                  requirements={workspaceRaw?.requirements}
                  canEdit={canEdit}
                  onPatch={patchPolicyData}
                />
              ) : (
                <div style={{ color: WS.textMuted }}>Open this tab to load requirements.</div>
              )
            )}
            {activeTab === 'Assessment' && (
              loadedTabs.has('Assessment') ? (
                <AssessmentWorkspaceTab
                  assessment={workspaceRaw?.assessment}
                  canEdit={canEdit}
                  onPatch={patchPolicyData}
                />
              ) : (
                <div style={{ color: WS.textMuted }}>Open this tab to load assessment.</div>
              )
            )}
            {activeTab === 'Decision & Summary' && (
              loadedTabs.has('Decision & Summary') ? (
                <DecisionWorkspaceTab
                  claim={claim}
                  calcAmt={calcResult}
                  assessorCanEdit={assessorCanEdit}
                  verifierCanEdit={verifierCanEdit}
                  accessorDecision={accessorDecision}
                  setAccessorDecision={setAccessorDecision}
                  accessorReason={accessorReason}
                  setAccessorReason={setAccessorReason}
                  accessorAmount={accessorAmount}
                  setAccessorAmount={setAccessorAmount}
                  verificationStatus={verificationStatus}
                  setVerificationStatus={setVerificationStatus}
                  verificationRemarks={verificationRemarks}
                  setVerificationRemarks={setVerificationRemarks}
                  submitGuard={submitGuard}
                  submitting={submitting}
                  onSubmit={handleSubmit}
                />
              ) : (
                <div style={{ color: WS.textMuted }}>Open this tab to load decision & summary.</div>
              )
            )}
          </div>
        </div>
      </div>

      <QuickAccessModal open={showQuick} onClose={() => setShowQuick(false)} policyData={policyData} onSave={patchPolicyData} disabled={!canEdit} />
      <FraudRuleManagerModal
        open={showFraud}
        onClose={() => setShowFraud(false)}
        claimNumber={claimId}
        policyId={claim.policyId}
        fraudContext={{
          ...claim.fraudContext,
          intimation: demogs?.intimation || claim.fraudContext?.intimation,
          lifeAssured: demogs?.lifeAssured || claim.fraudContext?.lifeAssured,
          claimant: demogs?.claimant || claim.fraudContext?.claimant,
          eagle: demogs?.eagle,
        }}
        userRole={userRoles[0]}
        username={user?.username || sessionStorage.getItem('loggedUser')}
        enableAssessor={canEdit}
      />
      <TransactionDetailsModal
        open={showTxn}
        onClose={() => setShowTxn(false)}
        policyId={claim.policyId}
        claimId={claimId}
        txnDate={demogs?.intimation?.intimationDate || demogs?.intimation?.initiationDate || claim.intimationDate}
        calcAmt={calcResult}
      />
      <ClaimSuccessModal
        open={Boolean(submitSuccess)}
        title={submitSuccess?.mode === 'verifier' ? 'Verification Submitted!' : 'Assessment Submitted!'}
        message={
          submitSuccess?.mode === 'verifier'
            ? 'Your verification decision has been saved successfully and the claim has been updated.'
            : 'Your assessment decision has been saved successfully and the claim has been updated.'
        }
        claimNo={submitSuccess?.claimId}
        primaryLabel={submitSuccess?.mode === 'verifier' ? 'Back to Claim Search' : 'Back to My Tasks'}
        onPrimary={() => {
          const mode = submitSuccess?.mode
          setSubmitSuccess(null)
          navigate(mode === 'verifier' ? '/claim-search' : '/my-task')
        }}
        secondaryLabel="Stay on Claim"
        onSecondary={() => setSubmitSuccess(null)}
      />
      <ClaimAssignModal open={showAssign} onClose={() => setShowAssign(false)} claimNumber={claimId} mode={verifierCanEdit ? 'verifier' : 'assessor'} />
      <DocumentSideSlider open={showDocs} onClose={() => setShowDocs(false)} claimId={claimId} readOnly={!canEdit} />
    </AppLayout>
  )
}
