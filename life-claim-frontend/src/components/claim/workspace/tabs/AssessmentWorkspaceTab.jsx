import { useState } from 'react'
import { Accordion, ROField, EditableField, SimpleTable, WS } from '../workspaceUi'

const FRAUD_FLAG_PLACEHOLDER = [{ sl: '—', date: '—', remarks: 'Fraud flags not loaded (backend fetch disabled)', score: '—', response: '—' }]

export default function AssessmentWorkspaceTab({ assessment, assessorCanEdit, onPatch }) {
  const [open, setOpen] = useState('questions')
  const toggle = (id) => setOpen((p) => (p === id ? '' : id))
  const questions = assessment?.assessment || assessment?.claimQuestions || {}
  const qEntries = Object.entries(questions).filter(([, v]) => v != null && v !== '')

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
    onPatch({ claimQuestions: { ...questions, [key]: val } })
  }

  return (
    <div>
      <Accordion title="Assessment questions & IIB enquiry" open={open === 'questions'} onToggle={() => toggle('questions')}>
        {qEntries.length === 0 ? (
          <div style={{ fontSize: '13px', color: WS.textMuted }}>No assessment questions.</div>
        ) : (
          qEntries.map(([key, val], idx) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${WS.borderSubtle}` }}>
              <span style={{ fontSize: '13px', color: WS.textSecondary, flex: 1 }}>Q{idx + 1} ({key})</span>
              {assessorCanEdit ? (
                <select value={String(val)} onChange={(e) => patchQuestion(key, e.target.value)} style={{ height: '32px', borderRadius: '6px', border: `1px solid ${WS.border}` }}>
                  {['Yes', 'No', 'NA'].map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <span style={{ fontWeight: 700, fontSize: '12px' }}>{String(val)}</span>
              )}
            </div>
          ))
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

      <Accordion title="Fraud & priority flag remarks" subtitle="Fraud flags placeholder until backend enables fetch" open={open === 'fraud'} onToggle={() => toggle('fraud')}>
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
        {assessorCanEdit && (
          <div style={{ marginTop: '14px' }}>
            <EditableField
              label="Assessor priority / fraud remarks (policyData)"
              value={assessment?.fraudRemarks || assessment?.priorityFlagRemarks || ''}
              onChange={(v) => onPatch({ priorityFlagRemarks: v, fraudRemarks: v })}
              disabled={!assessorCanEdit}
            />
          </div>
        )}
      </Accordion>
    </div>
  )
}
