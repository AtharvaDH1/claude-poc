import { WS, SimpleTable } from './workspaceUi'

const TABLE_DEFS = [
  {
    policyKey: 'hospitalDetailsTable',
    label: 'Hospital details',
    cols: [
      { key: 'hospitalName', label: 'Hospital' },
      { key: 'admissionDate', label: 'Admission' },
      { key: 'dischargeDate', label: 'Discharge' },
      { key: 'diagnosis', label: 'Diagnosis' },
    ],
    emptyRow: { hospitalName: '', admissionDate: '', dischargeDate: '', diagnosis: '' },
  },
  {
    policyKey: 'doctorDetailsTable',
    label: 'Doctor details',
    cols: [
      { key: 'doctorName', label: 'Doctor' },
      { key: 'registrationNo', label: 'Reg. no' },
      { key: 'visitDate', label: 'Visit date' },
    ],
    emptyRow: { doctorName: '', registrationNo: '', visitDate: '' },
  },
  {
    policyKey: 'proofDetailsTable',
    label: 'Proof details',
    cols: [
      { key: 'proofType', label: 'Type' },
      { key: 'documentNo', label: 'Document' },
      { key: 'issueDate', label: 'Issue date' },
    ],
    emptyRow: { proofType: '', documentNo: '', issueDate: '' },
  },
  {
    policyKey: 'insuranceProofDetailsTable',
    label: 'Insurance proof',
    cols: [
      { key: 'insurerName', label: 'Insurer' },
      { key: 'policyNo', label: 'Policy' },
      { key: 'sumAssured', label: 'SA' },
    ],
    emptyRow: { insurerName: '', policyNo: '', sumAssured: '' },
  },
  {
    policyKey: 'witnessDetailsTable',
    label: 'Witness details',
    cols: [
      { key: 'witnessName', label: 'Name' },
      { key: 'relation', label: 'Relation' },
      { key: 'mobileNo', label: 'Mobile' },
    ],
    emptyRow: { witnessName: '', relation: '', mobileNo: '' },
  },
  {
    policyKey: 'incomeDetailsTable',
    label: 'Income details',
    cols: [
      { key: 'financialYear', label: 'FY' },
      { key: 'proofType', label: 'Proof' },
      { key: 'incomeAmount', label: 'Amount' },
    ],
    emptyRow: { financialYear: '', proofType: '', incomeAmount: '' },
  },
]

export default function EagleScreenSection({ demogs, assessorCanEdit, onPatch, onOpenFraud }) {
  const eagle = demogs?.eagle || {}

  const addRow = (policyKey, emptyRow) => {
    const current = demogs?.[policyKey] || []
    onPatch({ [policyKey]: [...current, { ...emptyRow }], eagleScreenDetails: { ...eagle, updated: true } })
  }

  return (
    <div>
      <p style={{ fontSize: '12px', color: WS.textMuted, marginBottom: '12px', lineHeight: 1.5 }}>
        Eagle investigative tables persist on Summary Submit via register-claim/update. Use Fraud Prevention for the four automated cross-claim rules.
      </p>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onOpenFraud}
          style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}
        >
          Fraud Prevention (Rule Manager)
        </button>
      </div>
      {TABLE_DEFS.map((def) => (
        <div key={def.policyKey} style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: WS.textSecondary, textTransform: 'uppercase' }}>{def.label}</span>
            {assessorCanEdit && (
              <button
                type="button"
                onClick={() => addRow(def.policyKey, def.emptyRow)}
                style={{ padding: '4px 12px', borderRadius: '6px', border: `1px solid ${WS.border}`, background: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}
              >
                + Add row
              </button>
            )}
          </div>
          <SimpleTable columns={def.cols} rows={demogs?.[def.policyKey] || []} empty="No rows." />
        </div>
      ))}
      <div style={{ marginTop: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: WS.textSubtle, marginBottom: '6px' }}>Eagle screen (bank / agent)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '12px' }}>
          {[['Bank', eagle.bank_name || eagle.bankName], ['Account', eagle.acc_no || eagle.accountNo], ['Agent', eagle.agent_code || eagle.agentCode]].map(([k, v]) => (
            <div key={k} style={{ padding: '8px', background: '#F8FAFC', borderRadius: '6px' }}>
              <div style={{ color: WS.textSubtle, fontWeight: 700, fontSize: '10px' }}>{k}</div>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>{v || '—'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
