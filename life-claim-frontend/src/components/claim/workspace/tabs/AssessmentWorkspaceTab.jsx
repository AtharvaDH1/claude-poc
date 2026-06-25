import { useState } from 'react'
import { Accordion, ROField, EditableField, SimpleTable, useWorkspaceTokens, workspaceFieldStyle, workspaceTheadRowStyle } from '../workspaceUi'
import { mapAssessmentForWorkspace } from '../../../../util/workspaceDisplay'

const FRAUD_FLAG_PLACEHOLDER = [{ sl: '—', date: '—', remarks: 'Fraud flags not available', score: '—', response: '—' }]

export default function AssessmentWorkspaceTab({ assessment, canEdit, onPatch }) {
  const WS = useWorkspaceTokens()
  const [open, setOpen] = useState('questions')
  const toggle = (id) => setOpen((p) => (p === id ? '' : id))
  const questions = assessment?.assessment || assessment?.claimQuestions || {}
  const questionRows = mapAssessmentForWorkspace(assessment)

  const systemRows = (() => {
    const raw = assessment?.remarks || assessment?.systemRemarksTable
    if (Array.isArray(raw)) return raw
    if (raw && typeof raw === 'object' && Object.keys(raw).length) return [raw]
    return []
  })()

  const priorityRows = (() => {
    const raw = assessment?.priorityFlag || assessment?.priorityFlagTable
    return Array.isArray(raw) ? raw : raw ? [raw] : []
  })()

  const patchQuestion = (key, val) => {
    const stored = val === 'Yes' ? 'Y' : val === 'No' ? 'N' : val
    onPatch({ claimQuestions: { ...questions, [key]: stored } })
  }

  return (
    <div>
      <Accordion title="Assessment questions" subtitle="14 questions from registration (Yes / No)" open={open === 'questions'} onToggle={() => toggle('questions')}>
        {questionRows.every((q) => q.answer === '—') ? (
          <div style={{ fontSize: '13px', color: WS.textMuted }}>No assessment answers saved at registration.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={workspaceTheadRowStyle(WS)}>
                  {['#', 'Questions', 'Answer'].map((h) => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: WS.textMuted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {questionRows.map((row) => (
                  <tr key={row.id} style={{ borderBottom: `1px solid ${WS.borderSubtle}` }}>
                    <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 700, color: WS.textMuted, width: '40px' }}>{row.id}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: WS.textSecondary }}>{row.question}</td>
                    <td style={{ padding: '10px 12px', width: '100px' }}>
                      {canEdit ? (
                        <select value={row.answer === '—' ? '' : row.answer} onChange={(e) => patchQuestion(row.key, e.target.value)} style={workspaceFieldStyle(WS, { height: '32px', borderRadius: '6px', fontSize: '12px', width: '100%' })}>
                          <option value="">—</option>
                          {['Yes', 'No'].map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontWeight: 700, fontSize: '12px' }}>{row.answer}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ marginTop: '12px' }}>
          <SimpleTable columns={[{ key: 'enquiryType', label: 'Type' }, { key: 'status', label: 'Status' }]} rows={assessment?.iibEnquiry || assessment?.iibEnquiryTable || []} empty="No IIB rows." />
        </div>
      </Accordion>

      <Accordion title="Telecalling" open={open === 'tel'} onToggle={() => toggle('tel')}>
        <SimpleTable columns={[{ key: 'callDate', label: 'Date' }, { key: 'outcome', label: 'Outcome' }, { key: 'remarks', label: 'Remarks' }]} rows={assessment?.telecalling || assessment?.telecallingTable || []} />
      </Accordion>

      <Accordion title="Case trigger" open={open === 'trigger'} onToggle={() => toggle('trigger')}>
        <SimpleTable columns={[{ key: 'triggerFlag', label: 'Trigger' }, { key: 'reason', label: 'Reason' }]} rows={assessment?.caseTrigger || assessment?.caseTriggerTable || []} />
      </Accordion>

      <Accordion title="System assessor remarks" subtitle="From assessor-fetch remarks" open={open === 'remarks'} onToggle={() => toggle('remarks')}>
        {systemRows.length ? (
          <SimpleTable
            columns={[
              { key: 'sl', label: 'SL' },
              { key: 'date', label: 'Date' },
              { key: 'remarks', label: 'Remarks' },
              { key: 'score', label: 'Score' },
              { key: 'response', label: 'Response' },
            ]}
            rows={systemRows.map((r, i) => ({
              sl: r.sl ?? r.SL ?? i + 1,
              date: r.date ?? r.remarkDate ?? '—',
              remarks: r.remarks ?? r.remark ?? r.systemRemarks ?? '—',
              score: r.score ?? '—',
              response: r.response ?? '—',
            }))}
          />
        ) : (
          <ROField label="System remarks" value="No system remarks rows." span />
        )}
      </Accordion>

      <Accordion title="Fraud & priority flag remarks" subtitle="Fraud flags will appear when available" open={open === 'fraud'} onToggle={() => toggle('fraud')}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: WS.textSubtle, textTransform: 'uppercase', marginBottom: '8px' }}>Fraud flags</div>
          <SimpleTable
            columns={[
              { key: 'sl', label: 'SL' },
              { key: 'date', label: 'Date' },
              { key: 'remarks', label: 'Remarks' },
              { key: 'score', label: 'Score' },
              { key: 'response', label: 'Response' },
            ]}
            rows={FRAUD_FLAG_PLACEHOLDER}
          />
          <p style={{ fontSize: '11px', color: WS.textMuted, marginTop: '6px' }}>Per-claim fraud rules use Demographics → Eagle → Fraud Prevention modal (Section G).</p>
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: WS.textSubtle, textTransform: 'uppercase', marginBottom: '8px' }}>Priority flags</div>
          {priorityRows.length ? (
            <SimpleTable columns={[{ key: 'flag', label: 'Flag' }, { key: 'remarks', label: 'Remarks' }]} rows={priorityRows} />
          ) : (
            <div style={{ fontSize: '12px', color: WS.textMuted }}>No priority flag rows.</div>
          )}
        </div>
        {canEdit && (
          <div style={{ marginTop: '14px' }}>
            <EditableField
              label="Priority / fraud remarks"
              value={assessment?.fraudRemarks || assessment?.priorityFlagRemarks || ''}
              onChange={(v) => onPatch({ priorityFlagRemarks: v, fraudRemarks: v })}
              disabled={!canEdit}
            />
          </div>
        )}
      </Accordion>
    </div>
  )
}
