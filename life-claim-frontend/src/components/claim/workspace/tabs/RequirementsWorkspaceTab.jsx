import { useState } from 'react'
import { Accordion, SimpleTable, WS } from '../workspaceUi'
import { mapRequirementsForWorkspace, patchRequirementRowStatus } from '../../../../util/workspaceDisplay'

export default function RequirementsWorkspaceTab({ requirements, canEdit, onPatch }) {
  const [open, setOpen] = useState('base')
  const toggle = (id) => setOpen((p) => (p === id ? '' : id))
  const reqRows = mapRequirementsForWorkspace(requirements)
  const emails = requirements?.reqEmailDetailsTable || []
  const letters = requirements?.reqLetterDetailsTable || []
  const sms = requirements?.smsScriptTable || []

  const setReqStatus = (idx, status) => {
    const table = requirements?.requirementTable || []
    const next = table.map((row, i) => (i === idx ? patchRequirementRowStatus(row, status) : row))
    onPatch({ requirementTable: next })
  }

  return (
    <div>
      <Accordion title="Requirements" subtitle="Same 10-document checklist from registration" open={open === 'base'} onToggle={() => toggle('base')}>
        {reqRows.length === 0 ? (
          <div style={{ color: WS.textMuted, fontSize: '13px' }}>No requirement rows loaded.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFAFA' }}>
                  {['Requirement Name', 'Doc Type', 'Source', 'Status', 'Triggered By', 'Trigger Date', 'Receipt Date'].map((h) => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: WS.textSubtle, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reqRows.map((row, i) => (
                  <tr key={row.id || i} style={{ borderBottom: `1px solid ${WS.borderSubtle}` }}>
                    <td style={{ padding: '10px 12px', fontSize: '12px', maxWidth: '280px' }}>{row.name}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px' }}>{row.docType}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px' }}>{row.source}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {canEdit ? (
                        <select value={row.status} onChange={(e) => setReqStatus(i, e.target.value)} style={{ height: '32px', borderRadius: '6px', border: `1px solid ${WS.border}`, fontSize: '12px' }}>
                          {['Pending', 'Received', 'Waived'].map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span style={{ fontWeight: 600, fontSize: '12px' }}>{row.status}</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: WS.textMuted }}>{row.triggeredBy}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: WS.textMuted }}>{row.triggerDate}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: WS.textMuted }}>{row.receiptDate}</td>
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
