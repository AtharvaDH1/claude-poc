import { useState } from 'react'
import { useToast } from '../components/Toast'
import AppLayout from '../layouts/AppLayout'
import { Search, UserPlus, Upload, Layers, CheckSquare } from 'lucide-react'
import CaseSearchTab from '../components/add/tabs/CaseSearchTab'
import CaseAssignmentTab from '../components/add/tabs/CaseAssignmentTab'
import DataEntryUploaderTab from '../components/add/tabs/DataEntryUploaderTab'
import AssessmentPoolTab from '../components/add/tabs/AssessmentPoolTab'
import ApproverPoolTab from '../components/add/tabs/ApproverPoolTab'

const T = {
  primary: '#1D4ED8',
  card: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textMuted: '#64748B',
}

const TABS = [
  { id: 'case-search', label: 'Case Search', icon: Search },
  { id: 'assignment', label: 'Case Assignment', icon: UserPlus },
  { id: 'uploader', label: 'Data Entry Uploader', icon: Upload },
  { id: 'assess-pool', label: 'Assessment Pool', icon: Layers },
  { id: 'approver-pool', label: 'Approver Pool', icon: CheckSquare },
]

function TabNav({ active, setActive }) {
  return (
    <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, background: T.card, overflowX: 'auto' }}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActive(tab.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '14px 18px',
            border: 'none',
            borderBottom: active === tab.id ? `2px solid ${T.primary}` : '2px solid transparent',
            background: 'transparent',
            cursor: 'pointer',
            fontFamily: 'Inter,sans-serif',
            color: active === tab.id ? T.primary : T.textMuted,
            fontSize: '13px',
            fontWeight: active === tab.id ? 700 : 500,
            marginBottom: '-1px',
            whiteSpace: 'nowrap',
          }}
        >
          <tab.icon size={14} />
          {tab.label}
        </button>
      ))}
    </div>
  )
}

/** Section I — ADD / CAPS (Assessor & Verifier). Separate from life-claim /registration-fetch. */
export default function AddScreen() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('case-search')

  return (
    <AppLayout>
      <div style={{ padding: '24px', fontFamily: 'Inter,sans-serif' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em', margin: '0 0 4px' }}>
            Advance Investigation
          </h1>
          <p style={{ fontSize: '13px', color: T.textMuted, fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
            Supplemental referral / exclusion workflow · case ids in <code>caps_add_details</code> · open cases at <strong>/case/:id</strong> (not CL claim workspace).
          </p>
        </div>

        <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <TabNav active={activeTab} setActive={setActiveTab} />
          {activeTab === 'case-search' && <CaseSearchTab toast={toast} />}
          {activeTab === 'assignment' && <CaseAssignmentTab toast={toast} />}
          {activeTab === 'uploader' && <DataEntryUploaderTab toast={toast} />}
          {activeTab === 'assess-pool' && <AssessmentPoolTab toast={toast} />}
          {activeTab === 'approver-pool' && <ApproverPoolTab toast={toast} />}
        </div>
      </div>
    </AppLayout>
  )
}
