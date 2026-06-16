import { useState } from 'react'
// Registration — v2 with full demographics, requirements, assessment, decision
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import AppLayout from '../../layouts/AppLayout'
import { useAuth } from '../../context/AuthContext'
import DemographicsTab from './DemographicsTab'
import RequirementsTab from './RequirementsTab'
import AssessmentTab from './AssessmentTab'
import DecisionTab from './DecisionTab'
import RegisterFormGate from './RegisterFormGate'
import { isPreAssessorRole } from '../../util/preAssessor'
import { primaryOperationalRole } from '../../util/workflowRole'
import { useToast } from '../../components/Toast'
import { withRegistrationNotificationDefaults } from '../../config/registrationNotificationDefaults'

const TABS = [
  { id:'demographics', label:'Demographics',  step:1, desc:'Policy, claimant & fraud details' },
  { id:'requirements', label:'Requirements',  step:2, desc:'Document checklist & communication' },
  { id:'assessment',   label:'Assessment',    step:3, desc:'Questions, telecalling & remarks' },
  { id:'decision',     label:'Decision',      step:4, desc:'System & accessor decision' },
]

const T = {
  primary:'#1D4ED8', card:'#FFFFFF', border:'#E2E8F0',
  borderSubtle:'#F1F5F9', textPrimary:'#0F172A', textMuted:'#64748B',
}

export default function Registration() {
  const navigate    = useNavigate()
  const location    = useLocation()
  const { claimId } = useParams()
  const isView      = !!claimId
  const { user }    = useAuth()
  const toast       = useToast()
  const userRole = primaryOperationalRole(user?.roles, user?.role) || 'Pre Assessor'
  const isPreAssessor = isPreAssessorRole(userRole, user?.roles) || userRole === 'pre assessor'

  const prefillPolicy = location.state?.policy || null
  const prefillPolicyNo = location.state?.policyNumber || prefillPolicy?.policyId || ''

  const [wizardStarted, setWizardStarted] = useState(Boolean(prefillPolicy?.productName || prefillPolicy?.registerForm))

  /* ── Single shared policyData state ── */
  const [policyData, setPolicyData] = useState(withRegistrationNotificationDefaults({
    policyId: prefillPolicyNo || prefillPolicy?.policyId || '',
    claimType: prefillPolicy?.registerForm?.claimType || 'Death',
    informationType: prefillPolicy?.registerForm?.informationType || 'Written Information',
    createdBy: sessionStorage.getItem('loggedUser') || user?.username || '',
  }))
  const [policy, setPolicy] = useState(prefillPolicy || null)

  const startWizard = ({ policy: p, policyData: pd }) => {
    setPolicy(p)
    const today = new Date().toISOString().split('T')[0]
    setPolicyData((prev) => withRegistrationNotificationDefaults({
      ...prev,
      ...pd,
      initiationDate: today,
      initialPolicyStatus: p?.premiumStatus || pd?.initialPolicyStatus,
      createdBy: prev.createdBy || sessionStorage.getItem('loggedUser') || user?.username || '',
      _demographicsComplete: false,
      _requirementsComplete: false,
      _assessmentComplete: false,
    }))
    setWizardStarted(true)
    setCompletedTabs(new Set())
    setActiveTab('demographics')
  }

  /* update() merges partial changes into policyData */
  const update = (partial) => setPolicyData(prev => ({ ...prev, ...partial }))

  const [activeTab, setActiveTab] = useState('demographics')
  const [completedTabs, setCompletedTabs] = useState(new Set())

  const completeTab = (tabId) => {
    setCompletedTabs(p => new Set([...p, tabId]))
    const idx = TABS.findIndex(t => t.id === tabId)
    if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1].id)
  }

  const isDone = (id) => completedTabs.has(id)

  return (
    <AppLayout>
      <div style={{ padding:'24px', fontFamily:'Inter,sans-serif' }}>

        {/* Page header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'24px' }}>
          <div>
            <h1 style={{ fontSize:'22px', fontWeight:800, color:T.textPrimary, letterSpacing:'-0.02em', margin:'0 0 4px' }}>
              {isView ? `View Claim — ${claimId}` : 'Register New Claim'}
            </h1>
            <p style={{ fontSize:'13px', color:T.textMuted, fontWeight:500 }}>
              {isView ? 'Read-only view of registered claim.' : 'Complete all 4 sections to register the claim.'}
            </p>
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            {(policy?.policyId || prefillPolicy) && (
              <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:'8px', padding:'8px 14px', fontSize:'12px', fontWeight:700, color:T.primary }}>
                📋 {(policy || prefillPolicy).policyId || policyData.policyId} — {(policy || prefillPolicy).productName || policyData.productName || 'Policy'}
              </div>
            )}
            {policyData.policyId && !policy && !prefillPolicy && (
              <div style={{ background:'#ECFDF5', border:'1px solid #A7F3D0', borderRadius:'8px', padding:'8px 14px', fontSize:'12px', fontWeight:700, color:'#059669' }}>
                📋 {policyData.policyId}
              </div>
            )}
          </div>
        </div>

        {!wizardStarted && !isView ? (
          <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
            <RegisterFormGate initialPolicyNo={prefillPolicyNo} onProceed={startWizard} />
          </div>
        ) : (
        <>
        {/* Tab navigator */}
        <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', overflow:'hidden', marginBottom:'4px' }}>
          <div style={{ display:'flex', borderBottom:`1px solid ${T.border}` }}>
            {TABS.map((tab, i) => {
              const done   = isDone(tab.id)
              const active = activeTab === tab.id
              const locked = !done && i > 0 && !isDone(TABS[i-1].id) && tab.id !== 'demographics'
              return (
                <button key={tab.id}
                  onClick={() => {
                    if (locked) {
                      toast('warning', 'Section locked', `Complete "${TABS[i - 1].label}" before opening "${tab.label}".`)
                      return
                    }
                    setActiveTab(tab.id)
                  }}
                  style={{
                    flex:1, padding:'16px 12px', border:'none', cursor: locked?'not-allowed':'pointer',
                    borderBottom: active ? '3px solid #1D4ED8' : '3px solid transparent',
                    background: active ? '#EFF6FF' : 'transparent',
                    fontFamily:'Inter,sans-serif', transition:'all 0.15s', marginBottom:'-1px',
                    opacity: locked ? 0.45 : 1,
                  }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                    <div style={{ width:'22px', height:'22px', borderRadius:'50%', background: done?'#059669': active?T.primary:'#E2E8F0', color:'#fff', fontSize:'10px', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background 0.15s' }}>
                      {done ? '✓' : tab.step}
                    </div>
                    <div style={{ textAlign:'left' }}>
                      <div style={{ fontSize:'13px', fontWeight:700, color: active?T.primary: done?'#059669':T.textPrimary }}>{tab.label}</div>
                      <div style={{ fontSize:'10px', color:'#94A3B8', marginTop:'1px' }}>{tab.desc}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div style={{ minHeight:'400px' }}>
            {activeTab === 'demographics' && (
              <DemographicsTab
                data={policyData}
                update={update}
                policy={policy}
                setPolicy={setPolicy}
                onComplete={() => completeTab('demographics')}
              />
            )}
            {activeTab === 'requirements' && (
              <RequirementsTab
                data={policyData}
                update={update}
                userRole={userRole}
                onComplete={() => completeTab('requirements')}
              />
            )}
            {activeTab === 'assessment' && (
              <AssessmentTab
                userRole={userRole}
                isPreAssessor={isPreAssessor}
                data={policyData}
                update={update}
                policy={policy}
                onComplete={() => completeTab('assessment')}
              />
            )}
            {activeTab === 'decision' && (
              <DecisionTab
                data={policyData}
                update={update}
                policy={policy}
                isPreAssessor={isPreAssessor}
                userRoles={user?.roles || []}
                userRole={userRole}
              />
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop:'12px', display:'flex', gap:'4px' }}>
          {TABS.map(tab => (
            <div key={tab.id} style={{ flex:1, height:'4px', borderRadius:'99px', background: isDone(tab.id)?'#059669': activeTab===tab.id?T.primary:'#E2E8F0', transition:'background 0.3s' }}/>
          ))}
        </div>
        <div style={{ marginTop:'6px', textAlign:'right', fontSize:'11px', color:'#94A3B8', fontWeight:600 }}>
          {completedTabs.size} of {TABS.length} sections complete
        </div>
        </>
        )}
      </div>
    </AppLayout>
  )
}
