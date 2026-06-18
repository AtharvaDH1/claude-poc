import React, { useState } from 'react';
import CaseSearch from './CaseSearch';
import CaseAssignment from './CaseAssignment';
import DataEntryUploader from './DataEntryUploader';
import AssessorPoolSearch from './AssessorPool/Search';
import ApproverPool from './ApproverPool';

const TABS = [
  { key: 'caseSearch', label: 'Case Search' },
  { key: 'caseAssignment', label: 'Case Assignment' },
  { key: 'dataEntry', label: 'Data Entry Uploader' },
  { key: 'assessmentPool', label: 'Assessment Pool' },
  { key: 'approverPool', label: 'Approver Pool' },
];

const AddScreen = () => {
  const [activeTab, setActiveTab] = useState('caseSearch');

  return (
    <div>
      <h5 className="fw-bold mb-4" style={{ color: '#1a3c6e' }}>Add Screen</h5>

      <ul className="nav nav-tabs mb-4">
        {TABS.map((t) => (
          <li key={t.key} className="nav-item">
            <button
              className={`nav-link ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >{t.label}</button>
          </li>
        ))}
      </ul>

      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '24px' }}>
        {activeTab === 'caseSearch' && <CaseSearch />}
        {activeTab === 'caseAssignment' && <CaseAssignment />}
        {activeTab === 'dataEntry' && <DataEntryUploader />}
        {activeTab === 'assessmentPool' && <AssessorPoolSearch />}
        {activeTab === 'approverPool' && <ApproverPool />}
      </div>
    </div>
  );
};

export default AddScreen;
