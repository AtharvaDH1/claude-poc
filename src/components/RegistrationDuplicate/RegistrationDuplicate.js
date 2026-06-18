import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import assessorFetchService from '../../services/assessorFetchService';
import updatePolicyService from '../../services/updatePolicyService';
import userService from '../../services/userService';

const RegistrationDuplicate = () => {
  const { claimNo } = useParams();
  const loggedUser = sessionStorage.getItem('loggedUser') || '';

  const [policyData] = useState({});
  const [demographicsData, setDemographicsData] = useState(null);
  const [requirementData, setRequirementData] = useState(null);
  const [assessmentData, setAssessmentData] = useState(null);
  const [decisionData, setDecisionData] = useState(null);
  const [calculateAmountData, setCalculateAmountData] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [demogsLoading, setDemogsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('demographics');
  const [tabFetched, setTabFetched] = useState({ req: false, assess: false, dec: false });
  const [saving, setSaving] = useState(false);

  // Fetch demographics on mount
  useEffect(() => {
    setDemogsLoading(true);
    assessorFetchService.demogsFetch(claimNo)
      .then((data) => setDemographicsData(data))
      .catch(() => toast.error('Failed to load claim details.'))
      .finally(() => setDemogsLoading(false));

    userService.getUserById(loggedUser)
      .then((u) => setUserRole(u?.roles?.[0] || ''))
      .catch(() => {});
  }, [claimNo, loggedUser]);

  // Lazy tab fetch
  const handleTabClick = async (tab) => {
    setActiveTab(tab);

    if (tab === 'requirement' && !tabFetched.req) {
      try {
        const data = await assessorFetchService.requireFetch(claimNo);
        setRequirementData(data);
        setTabFetched((p) => ({ ...p, req: true }));
      } catch { toast.error('Failed to load requirements.'); }
    }

    if (tab === 'assessment' && !tabFetched.assess) {
      try {
        const data = await assessorFetchService.assessmentFetch(claimNo);
        setAssessmentData(data);
        setTabFetched((p) => ({ ...p, assess: true }));
      } catch { toast.error('Failed to load assessment.'); }
    }

    if (tab === 'decision' && !tabFetched.dec) {
      try {
        const [dec, calc] = await Promise.all([
          assessorFetchService.decisionFetch(claimNo),
          assessorFetchService.calculateAmountFetch(claimNo),
        ]);
        setDecisionData(dec);
        setCalculateAmountData(calc);
        setTabFetched((p) => ({ ...p, dec: true }));
      } catch { toast.error('Failed to load decision data.'); }
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await updatePolicyService({ ...policyData, claimNumber: claimNo, updatedBy: loggedUser });
      toast.success('Claim updated successfully.');
    } catch {
      toast.error('Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'demographics', label: 'Demographics' },
    { key: 'requirement', label: 'Requirements' },
    { key: 'assessment', label: 'Assessment' },
    { key: 'decision', label: 'Decision & Summary' },
  ];

  if (demogsLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  const d = demographicsData || {};

  return (
    <div>
      {/* Claim Header */}
      <div style={{ background: '#1a3c6e', color: '#fff', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px' }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h5 className="mb-0 fw-bold">{claimNo}</h5>
            <span style={{ fontSize: '13px', opacity: 0.8 }}>{d.claimType || d.CLAIM_TYPE || '—'} Claim</span>
          </div>
          <div className="d-flex gap-2">
            <div style={{ textAlign: 'center', padding: '0 16px', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ fontSize: '11px', opacity: 0.7 }}>Policy No</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{d.policyNo || d.POLICY_NO || '—'}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0 16px', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ fontSize: '11px', opacity: 0.7 }}>Status</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{d.status || d.STATUS || '—'}</div>
            </div>
            {userRole === 'Assessor' && (
              <>
                <button className="btn btn-outline-light btn-sm" onClick={() => toast.info('Quick Access')}>Quick Access</button>
                <button className="btn btn-outline-light btn-sm" onClick={() => toast.info('Transactions')}>Transactions</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        {tabs.map((t) => (
          <li key={t.key} className="nav-item">
            <button
              className={`nav-link ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => handleTabClick(t.key)}
            >{t.label}</button>
          </li>
        ))}
      </ul>

      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '24px' }}>
        {activeTab === 'demographics' && (
          <div>
            <h6 className="fw-semibold mb-3">Demographics & Intimation</h6>
            {Object.keys(d).length === 0 ? <p className="text-muted">No data found.</p> : (
              <div className="row g-2">
                {Object.entries(d).slice(0, 20).map(([k, v]) => (
                  <div key={k} className="col-md-4">
                    <div style={{ background: '#f8fafc', borderRadius: '6px', padding: '8px 12px' }}>
                      <div style={{ fontSize: '11px', color: '#888' }}>{k.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{v?.toString() || '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requirement' && (
          <div>
            <h6 className="fw-semibold mb-3">Requirements</h6>
            {!tabFetched.req ? <div className="spinner-border text-primary" /> :
              requirementData ? (
                <pre style={{ fontSize: '12px', background: '#f8fafc', padding: '12px', borderRadius: '6px', overflow: 'auto' }}>
                  {JSON.stringify(requirementData, null, 2)}
                </pre>
              ) : <p className="text-muted">No requirement data.</p>}
          </div>
        )}

        {activeTab === 'assessment' && (
          <div>
            <h6 className="fw-semibold mb-3">Assessment</h6>
            {!tabFetched.assess ? <div className="spinner-border text-primary" /> :
              assessmentData ? (
                <pre style={{ fontSize: '12px', background: '#f8fafc', padding: '12px', borderRadius: '6px', overflow: 'auto' }}>
                  {JSON.stringify(assessmentData, null, 2)}
                </pre>
              ) : <p className="text-muted">No assessment data.</p>}
          </div>
        )}

        {activeTab === 'decision' && (
          <div>
            <h6 className="fw-semibold mb-3">Decision & Summary</h6>
            {!tabFetched.dec ? <div className="spinner-border text-primary" /> : (
              <div className="row g-3">
                {calculateAmountData && (
                  <div className="col-md-6">
                    <div className="alert alert-info">
                      <strong>Calculated Claim Amount:</strong>
                      <div className="fs-4 fw-bold mt-1">₹{calculateAmountData.totalAmount?.toLocaleString() || '—'}</div>
                    </div>
                  </div>
                )}
                {decisionData && (
                  <div className="col-md-6">
                    <div className="alert alert-secondary">
                      <strong>Decision:</strong> {decisionData.decision || decisionData.DECISION || '—'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Save button for Assessor */}
        {userRole === 'Assessor' && (
          <div className="mt-4 border-top pt-3">
            <button className="btn btn-primary" onClick={handleUpdate} disabled={saving}>
              {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : '💾 Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationDuplicate;
