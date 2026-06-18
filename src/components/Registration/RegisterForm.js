import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import policyService from '../../services/policyService';

const RegisterForm = ({ setAgentRepudiationDetails, handleClose, setPolicy }) => {
  const location = useLocation();
  const prefillPolicy = location.state?.policyNumber || '';

  const [registerForm, setRegisterForm] = useState({
    policyID: prefillPolicy,
    claimType: 'Death',
    informationType: 'Written',
    policyStatus: 'woh',
  });
  const [client, setClient] = useState({});
  const [, setIsLoadingPolicy] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  const handleFetchPolicy = async () => {
    if (!registerForm.policyID) { setError('Please enter a Policy ID.'); return; }
    setIsSearching(true);
    setError('');
    try {
      const data = await policyService.getPolicyDetails(registerForm.policyID);
      setClient(data || {});
      setPolicy(data || {});
      if (data?.advisorCode) {
        try {
          const agentData = await policyService.getAgentRepudiationDetails(data.advisorCode);
          setAgentRepudiationDetails(agentData);
        } catch {}
      }
    } catch {
      setError('Policy not found. Please check the Policy ID.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleProceed = () => {
    if (!client.policyID && !client.id) { setError('Please fetch a valid policy first.'); return; }
    handleClose({ ...registerForm, ...client });
  };

  return (
    <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '24px' }}>
      <h6 className="fw-bold mb-4" style={{ color: '#1a3c6e' }}>Register Form — Policy Search</h6>

      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <label className="form-label small fw-semibold">Policy ID *</label>
          <div className="d-flex gap-2">
            <input
              className="form-control"
              value={registerForm.policyID}
              onChange={(e) => setRegisterForm({ ...registerForm, policyID: e.target.value })}
              placeholder="Enter Policy ID"
              disabled={!!prefillPolicy}
            />
            <button className="btn btn-outline-primary" onClick={handleFetchPolicy} disabled={isSearching}>
              {isSearching ? <span className="spinner-border spinner-border-sm" /> : 'Fetch'}
            </button>
          </div>
          {error && <small className="text-danger">{error}</small>}
        </div>

        <div className="col-md-4">
          <label className="form-label small fw-semibold">Claim Type</label>
          <select className="form-select" value={registerForm.claimType} onChange={(e) => setRegisterForm({ ...registerForm, claimType: e.target.value })}>
            {['Death', 'Disability', 'Critical Illness', 'Accidental'].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label small fw-semibold">Information Type</label>
          <select className="form-select" value={registerForm.informationType} onChange={(e) => setRegisterForm({ ...registerForm, informationType: e.target.value })}>
            {['Written', 'Verbal', 'Email', 'Walk-in'].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {client.policyID || client.id ? (
        <div className="alert alert-info">
          <strong>Policy Found:</strong> {client.policyName || client.productName || registerForm.policyID}
          {client.sumAssured && <span className="ms-3">Sum Assured: ₹{client.sumAssured?.toLocaleString()}</span>}
        </div>
      ) : null}

      <button className="btn btn-primary" onClick={handleProceed} disabled={!client.policyID && !client.id}>
        Proceed to Registration →
      </button>
    </div>
  );
};

export default RegisterForm;
