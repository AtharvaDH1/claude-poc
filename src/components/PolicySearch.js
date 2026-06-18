import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import historySearch from '../services/historySearchService';

const ROLES = ['Pre Assessor', 'Assessor', 'Verifier', 'Operations', 'Branch User'];

const PolicySearch = () => {
  const history = useHistory();
  const [userRole, setUserRole] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [claimNumber, setClaimNumber] = useState('');
  const [policyResults, setPolicyResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!userRole) { setErrorMessage('Please select a user role.'); return; }
    if (!policyNumber.trim() && !claimNumber.trim()) { setErrorMessage('Please fill either Policy Number or Claim Number.'); return; }
    setErrorMessage('');
    setLoading(true);
    try {
      const results = await historySearch(policyNumber.trim(), claimNumber.trim());
      setPolicyResults(Array.isArray(results) ? results : [results].filter(Boolean));
    } catch {
      setErrorMessage('Search failed. Please try again.');
      setPolicyResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterNew = (polNum) => {
    history.push({ pathname: '/registration', state: { policyNumber: polNum } });
  };

  return (
    <div>
      <h5 className="fw-bold mb-4" style={{ color: '#1a3c6e' }}>Policy Search</h5>

      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '24px', maxWidth: '700px', marginBottom: '24px' }}>
        <form onSubmit={handleSearch}>
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label small fw-semibold">User Role</label>
              <select className="form-select" value={userRole} onChange={(e) => { setUserRole(e.target.value); setErrorMessage(''); }}>
                <option value="">-- Select Role --</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Policy Number</label>
              <input className="form-control" value={policyNumber} onChange={(e) => { setPolicyNumber(e.target.value); setErrorMessage(''); }} placeholder="Policy number" />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Claim Number</label>
              <input className="form-control" value={claimNumber} onChange={(e) => { setClaimNumber(e.target.value); setErrorMessage(''); }} placeholder="Claim number" />
            </div>
          </div>
          {errorMessage && <div className="text-danger mb-2 small">{errorMessage}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <><span className="spinner-border spinner-border-sm me-1" />Searching...</> : 'Search'}
          </button>
        </form>
      </div>

      {policyResults.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table className="table table-hover mb-0" style={{ fontSize: '13px' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th>Policy No</th>
                <th>Claim No</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {policyResults.map((p, i) => (
                <tr key={i}>
                  <td className="fw-semibold">{p.POLICY_NO || p.POLICY_NUMBER || '—'}</td>
                  <td>{p.CLAIM_NUMBER || '—'}</td>
                  <td><span className="badge bg-secondary">{p.STATUS || '—'}</span></td>
                  <td>{p.CREATED_AT ? new Date(p.CREATED_AT).toLocaleDateString('en-IN') : '—'}</td>
                  <td>
                    <button
                      className="btn btn-outline-success btn-sm"
                      onClick={() => handleRegisterNew(p.POLICY_NO || p.POLICY_NUMBER)}
                    >
                      Register New Claim
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PolicySearch;
