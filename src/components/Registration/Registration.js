import React, { useState } from 'react';
import { toast } from 'react-toastify';
import RegisterForm from './RegisterForm';
import registerPolicyService from '../../services/registerPolicyService';

const Registration = () => {
  const loggedUser = sessionStorage.getItem('loggedUser') || '';
  const [, setPolicy] = useState({});
  const [registerForm, setRegisterForm] = useState(true);
  const [policyData, setPolicyData] = useState({ policyID: 1, createdBy: loggedUser });
  const [activeTab, setActiveTab] = useState('demographics');
  const [isTabClose, setIsTabClose] = useState({ req: true, assess: true, dec: true });
  const [show, setShow] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [claimNumber, setClaimNumber] = useState(null);

  const handleClose = (data) => {
    setPolicyData((prev) => ({ ...prev, ...data }));
    setRegisterForm(false);
  };

  const handleTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'requirement') setIsTabClose((p) => ({ ...p, req: false }));
    if (tab === 'assessment') setIsTabClose((p) => ({ ...p, assess: false }));
    if (tab === 'decision') setIsTabClose((p) => ({ ...p, dec: false }));
  };

  const registerPolicy = async () => {
    setShow(true);
    setRegistering(true);
    try {
      const result = await registerPolicyService(policyData);
      setClaimNumber(result?.claimNumber || result?.CLAIM_NUMBER || null);
      toast.success(`Claim registered: ${result?.claimNumber || ''}`);
    } catch (e) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  const tabs = [
    { key: 'demographics', label: 'Demographics', disabled: false },
    { key: 'requirement', label: 'Requirement', disabled: isTabClose.req },
    { key: 'assessment', label: 'Assessment', disabled: isTabClose.assess },
    { key: 'decision', label: 'Decision & Summary', disabled: isTabClose.dec },
  ];

  if (registerForm) {
    return (
      <div>
        <h5 className="fw-bold mb-4" style={{ color: '#1a3c6e' }}>Register New Claim</h5>
        <RegisterForm
          setAgentRepudiationDetails={(d) => setPolicyData((p) => ({ ...p, agentRepudiation: d }))}
          handleClose={handleClose}
          setPolicy={setPolicy}
        />
      </div>
    );
  }

  return (
    <div>
      <h5 className="fw-bold mb-3" style={{ color: '#1a3c6e' }}>
        New Claim Registration — {policyData.claimType || 'Death'}
        {policyData.policyID && <span className="text-muted ms-2" style={{ fontSize: '14px' }}>Policy: {policyData.policyID}</span>}
      </h5>

      {/* Tab navigation */}
      <ul className="nav nav-tabs mb-4">
        {tabs.map((t) => (
          <li key={t.key} className="nav-item">
            <button
              className={`nav-link ${activeTab === t.key ? 'active' : ''} ${t.disabled ? 'disabled text-muted' : ''}`}
              onClick={() => !t.disabled && setActiveTab(t.key)}
              style={{ cursor: t.disabled ? 'not-allowed' : 'pointer' }}
            >
              {t.label}
              {t.disabled && ' 🔒'}
            </button>
          </li>
        ))}
      </ul>

      {/* Tab content */}
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '24px' }}>
        {activeTab === 'demographics' && (
          <div>
            <h6 className="fw-semibold mb-3">Demographics</h6>
            <p className="text-muted">Fill in the demographics and intimation details.</p>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Insured Name</label>
                <input className="form-control" placeholder="Insured name"
                  onChange={(e) => setPolicyData((p) => ({ ...p, insuredName: e.target.value }))} />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Date of Death</label>
                <input type="date" className="form-control"
                  onChange={(e) => setPolicyData((p) => ({ ...p, dateOfDeath: e.target.value }))} />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Intimation Date</label>
                <input type="date" className="form-control"
                  onChange={(e) => setPolicyData((p) => ({ ...p, intimationDate: e.target.value }))} />
              </div>
            </div>
            <button className="btn btn-primary mt-4" onClick={() => handleTab('requirement')}>
              Next: Requirements →
            </button>
          </div>
        )}

        {activeTab === 'requirement' && (
          <div>
            <h6 className="fw-semibold mb-3">Requirements</h6>
            <p className="text-muted">Document requirements for {policyData.claimType} claim.</p>
            <button className="btn btn-primary mt-2" onClick={() => handleTab('assessment')}>
              Next: Assessment →
            </button>
          </div>
        )}

        {activeTab === 'assessment' && (
          <div>
            <h6 className="fw-semibold mb-3">Assessment</h6>
            <p className="text-muted">Complete the assessment questionnaire.</p>
            <button className="btn btn-primary mt-2" onClick={() => handleTab('decision')}>
              Next: Decision & Summary →
            </button>
          </div>
        )}

        {activeTab === 'decision' && (
          <div>
            <h6 className="fw-semibold mb-3">Decision & Summary</h6>
            <p className="text-muted">Review and submit the registration.</p>
            <div className="alert alert-warning">
              <strong>Review:</strong> Claim Type: {policyData.claimType} | Policy: {policyData.policyID}
            </div>
            <button className="btn btn-success" onClick={registerPolicy} disabled={registering}>
              {registering ? <><span className="spinner-border spinner-border-sm me-2" />Registering...</> : '✅ Register Claim'}
            </button>
          </div>
        )}
      </div>

      {/* Registration result modal */}
      {show && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Claim Registration</h5>
              </div>
              <div className="modal-body text-center">
                {registering ? (
                  <><div className="spinner-border text-primary" /><p className="mt-2">Processing...</p></>
                ) : claimNumber ? (
                  <><div style={{ fontSize: '48px' }}>✅</div><h5>Claim Registered Successfully</h5><p className="fw-bold text-success fs-4">{claimNumber}</p></>
                ) : (
                  <><div style={{ fontSize: '48px' }}>❌</div><p>Registration failed. Please try again.</p></>
                )}
              </div>
              {!registering && (
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShow(false)}>Close</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Registration;
