import { useState } from 'react'
import { Accordion, ROField, EditableField, SimpleTable, WS } from '../workspaceUi'
import EagleScreenSection from '../EagleScreenSection'

export default function DemographicsWorkspaceTab({ claim, demogs, assessorCanEdit, onPatch, onOpenFraud }) {
  const [open, setOpen] = useState('intimation')
  const toggle = (id) => setOpen((p) => (p === id ? '' : id))
  const intimation = demogs?.intimation || {}
  const cause = demogs?.cause || {}
  const la = demogs?.lifeAssured || {}
  const trap = demogs?.trap || {}
  const established = demogs?.establishedCause || {}
  const contact = demogs?.contact || {}

  const patchIntimation = (key, val) => onPatch({ intimationDetails: { ...intimation, [key]: val } })
  const patchEstablished = (key, val) => onPatch({ establishedCauseDetails: { ...established, [key]: val } })

  return (
    <div>
      <Accordion title="Intimation details" subtitle="Dates, source, death certificate" open={open === 'intimation'} onToggle={() => toggle('intimation')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {assessorCanEdit ? (
            <>
              <EditableField label="Intimation date" value={intimation.intimationDate} onChange={(v) => patchIntimation('intimationDate', v)} disabled={!assessorCanEdit} type="date" />
              <EditableField label="Source" value={intimation.source} onChange={(v) => patchIntimation('source', v)} disabled={!assessorCanEdit} />
              <EditableField label="Place of death" value={intimation.placeOfDeath} onChange={(v) => patchIntimation('placeOfDeath', v)} disabled={!assessorCanEdit} />
            </>
          ) : (
            <>
              <ROField label="Intimation date" value={intimation.intimationDate || claim?.intimationDate} />
              <ROField label="Source" value={intimation.source || claim?.source} />
              <ROField label="Place of death" value={intimation.placeOfDeath || claim?.placeOfDeath} />
            </>
          )}
          <ROField label="Date of death / event" value={intimation.dateOfDeath || intimation.dateOfDeathEvent} />
          <ROField label="Death certificate" value={intimation.deathCertificate} />
          <ROField label="FIR / PM" value={intimation.firPmReceived} />
        </div>
      </Accordion>

      <Accordion title="Trap score" subtitle="Read-only from registration" open={open === 'trap'} onToggle={() => toggle('trap')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <ROField label="Trap score" value={trap.trapScore || trap.score} />
          <ROField label="Risk" value={trap.trapRisk || trap.risk} />
          <ROField label="Date" value={trap.trapDate} />
        </div>
      </Accordion>

      <Accordion title="Declared cause of death / event" subtitle="Read-only" open={open === 'declared'} onToggle={() => toggle('declared')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <ROField label="Cause code" value={cause.causeCode || claim?.causeCode} />
          <ROField label="Description" value={cause.causeDescription || claim?.causeDescription} />
          <ROField label="Category" value={cause.causeCategory || claim?.causeCategory} />
        </div>
      </Accordion>

      <Accordion title="Established cause of death" subtitle="Assessor may update in work mode" open={open === 'established'} onToggle={() => toggle('established')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {assessorCanEdit ? (
            <>
              <EditableField label="Established cause" value={established.establishedCause || established.causeDescription} onChange={(v) => patchEstablished('establishedCause', v)} disabled={!assessorCanEdit} />
              <EditableField label="Remarks" value={established.remarks} onChange={(v) => patchEstablished('remarks', v)} disabled={!assessorCanEdit} />
            </>
          ) : (
            <>
              <ROField label="Established cause" value={established.establishedCause} />
              <ROField label="Remarks" value={established.remarks} />
            </>
          )}
        </div>
      </Accordion>

      <Accordion title="Payee details" open={open === 'payee'} onToggle={() => toggle('payee')}>
        <SimpleTable columns={[{ key: 'name', label: 'Name' }, { key: 'relation', label: 'Relation' }, { key: 'accountNo', label: 'Account' }]} rows={demogs?.payee || []} />
      </Accordion>

      <Accordion title="Claimant details" open={open === 'claimant'} onToggle={() => toggle('claimant')}>
        <SimpleTable columns={[{ key: 'name', label: 'Name' }, { key: 'relation', label: 'Relation' }, { key: 'mobileNo', label: 'Mobile' }, { key: 'panNo', label: 'PAN' }]} rows={(demogs?.claimant || []).map((c) => ({ ...c, name: c.name || c.claimantName }))} />
      </Accordion>

      <Accordion title="Life assured" open={open === 'la'} onToggle={() => toggle('la')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <ROField label="Name" value={la.name || la.laName || claim?.laName} />
          <ROField label="DOB" value={la.dob || la.dateOfBirth || claim?.laDob} />
          <ROField label="Gender" value={la.gender || claim?.laGender} />
          <ROField label="City" value={la.city || la.resCity || claim?.laCity} />
          <ROField label="State" value={la.state || la.resState || claim?.laState} />
        </div>
      </Accordion>

      <Accordion title="Agent repudiation history" open={open === 'agent'} onToggle={() => toggle('agent')}>
        <SimpleTable columns={[{ key: 'agentCode', label: 'Agent' }, { key: 'status', label: 'Status' }, { key: 'remarks', label: 'Remarks' }]} rows={demogs?.agentHistoryTable || []} />
      </Accordion>

      <Accordion title="Contract details" open={open === 'contact'} onToggle={() => toggle('contact')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <ROField label="Product" value={contact.productName || claim?.productName} />
          <ROField label="Sum assured" value={contact.sumAssured || claim?.sumAssured} />
          <ROField label="Advisor" value={contact.advisorCode || claim?.advisorCode} />
        </div>
        <div style={{ marginTop: '12px' }}>
          <SimpleTable columns={[{ key: 'riderCode', label: 'Rider' }, { key: 'riderSA', label: 'SA' }, { key: 'riderStatus', label: 'Status' }]} rows={demogs?.riderDetailsTable || []} empty="No riders." />
        </div>
      </Accordion>

      <Accordion title="Fraud screen (Eagle)" subtitle="Investigative tables + Rule Manager modal" open={open === 'eagle'} onToggle={() => toggle('eagle')}>
        <EagleScreenSection demogs={demogs} assessorCanEdit={assessorCanEdit} onPatch={onPatch} onOpenFraud={onOpenFraud} />
      </Accordion>
    </div>
  )
}
