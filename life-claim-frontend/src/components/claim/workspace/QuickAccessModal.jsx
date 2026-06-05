import { useState, useEffect } from 'react'
import { WS, EditableField } from './workspaceUi'

/** Assessor quick edits → policyData (Section F3). */
export default function QuickAccessModal({ open, onClose, policyData, onSave, disabled }) {
  const [form, setForm] = useState({})

  useEffect(() => {
    if (!open || !policyData) return
    const i = policyData.intimationDetails || {}
    const c0 = (policyData.claimantDetails || [])[0] || {}
    setForm({
      intimationDate: i.intimationDate || i.initiationDate || '',
      source: i.source || '',
      claimantName: c0.name || c0.claimantName || '',
      claimantMobile: c0.mobileNo || c0.mobile || '',
      claimantCity: c0.city || c0.resCity || '',
      claimantPan: c0.panNo || c0.pan || '',
    })
  }, [open, policyData])

  if (!open) return null

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleSave = () => {
    const claimants = [...(policyData.claimantDetails || [])]
    if (claimants.length) {
      claimants[0] = { ...claimants[0], name: form.claimantName, mobileNo: form.claimantMobile, city: form.claimantCity, panNo: form.claimantPan }
    } else if (form.claimantName) {
      claimants.push({ name: form.claimantName, mobileNo: form.claimantMobile, city: form.claimantCity, panNo: form.claimantPan })
    }
    onSave({
      intimationDetails: {
        ...(policyData.intimationDetails || {}),
        intimationDate: form.intimationDate,
        source: form.source,
      },
      claimantDetails: claimants,
    })
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '520px', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${WS.border}`, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 800, fontSize: '15px' }}>Quick Access</span>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '22px', cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: '20px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <EditableField label="Intimation date" value={form.intimationDate} onChange={(v) => set('intimationDate', v)} disabled={disabled} type="date" />
          <EditableField label="Source" value={form.source} onChange={(v) => set('source', v)} disabled={disabled} options={['Branch', 'Direct', 'Email', 'Agent', 'Website']} />
          <EditableField label="Claimant name" value={form.claimantName} onChange={(v) => set('claimantName', v)} disabled={disabled} />
          <EditableField label="Claimant mobile" value={form.claimantMobile} onChange={(v) => set('claimantMobile', v)} disabled={disabled} />
          <EditableField label="Claimant city" value={form.claimantCity} onChange={(v) => set('claimantCity', v)} disabled={disabled} />
          <EditableField label="Claimant PAN" value={form.claimantPan} onChange={(v) => set('claimantPan', v)} disabled={disabled} />
        </div>
        <div style={{ padding: '14px 22px', borderTop: `1px solid ${WS.border}`, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: '8px', border: `1px solid ${WS.border}`, background: '#F8FAFC', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Cancel</button>
          <button type="button" onClick={handleSave} disabled={disabled} style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: disabled ? '#CBD5E1' : WS.primary, color: '#fff', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'Inter,sans-serif' }}>Apply to claim data</button>
        </div>
      </div>
    </div>
  )
}
