import { useState } from 'react'
import { Accordion, SimpleTable, WS } from '../workspaceUi'

export default function RequirementsWorkspaceTab({ requirements, assessorCanEdit, onPatch }) {
  const [open, setOpen] = useState('base')
  const toggle = (id) => setOpen((p) => (p === id ? '' : id))
  const reqTable = requirements?.requirementTable || []
  const emails = requirements?.reqEmailDetailsTable || []
  const letters = requirements?.reqLetterDetailsTable || []
  const sms = requirements?.smsScriptTable || []

  const setReqStatus = (idx, status) => {
    const next = reqTable.map((row, i) => (i === idx ? { ...row, status, documentStatus: status } : row))
    onPatch({ requirementTable: next })
  }

  return (
    <div>
      <Accordion title="Requirement and other details" open={open === 'base'} onToggle={() => toggle('base')}>
        {reqTable.length === 0 ? (
          <div style={{ color: WS.textMuted, fontSize: '13px' }}>No requirement rows loaded.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFAFA' }}>
                  {['Document', 'Mandatory', 'Status'].map((h) => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: WS.textSubtle }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reqTable.map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${WS.borderSubtle}` }}>
                    <td style={{ padding: '10px 12px', fontSize: '13px' }}>{row.document_name || row.documentName || row.name || `Req ${i + 1}`}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px' }}>{row.mandatory || row.MANDATORY || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {assessorCanEdit ? (
                        <select value={row.status || row.documentStatus || 'Pending'} onChange={(e) => setReqStatus(i, e.target.value)} style={{ height: '32px', borderRadius: '6px', border: `1px solid ${WS.border}`, fontSize: '12px' }}>
                          {['Pending', 'Received', 'Waived'].map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span>{row.status || row.documentStatus || 'Pending'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Accordion>

      <Accordion title="Communication" subtitle="Email, letter, SMS" open={open === 'comm'} onToggle={() => toggle('comm')}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: WS.primary, marginBottom: '8px' }}>Email</div>
          <SimpleTable columns={[{ key: 'emailType', label: 'Type' }, { key: 'sentDate', label: 'Sent' }]} rows={emails} empty="No email rows." />
        </div>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: WS.primary, marginBottom: '8px' }}>Letters</div>
          <SimpleTable columns={[{ key: 'letterType', label: 'Type' }, { key: 'sentDate', label: 'Sent' }]} rows={letters} empty="No letter rows." />
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: WS.primary, marginBottom: '8px' }}>SMS script</div>
          <SimpleTable columns={[{ key: 'script', label: 'Script' }, { key: 'status', label: 'Status' }]} rows={sms} empty="No SMS rows." />
        </div>
      </Accordion>
    </div>
  )
}
