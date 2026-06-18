import React, { useState } from 'react';
import claimSearch from '../services/claimSearchService';
import adminService from '../services/adminService';
import { toast } from 'react-toastify';

const AdminClaimSearch = () => {
  const [claimNo, setClaimNo] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [assignee, setAssignee] = useState('');
  const [selectedClaim, setSelectedClaim] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!claimNo.trim()) { setError('Please enter a claim number.'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await claimSearch.claimSearchNumber(claimNo.trim());
      setResults(Array.isArray(data) ? data : [data].filter(Boolean));
    } catch {
      setError('Search failed.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (claim) => {
    if (!assignee.trim()) { toast.warning('Enter an assignee username.'); return; }
    try {
      await adminService.assignClaim({ claimNumber: claim.CLAIM_NUMBER, assignee, role: 'Assessor' });
      toast.success(`Assigned ${claim.CLAIM_NUMBER} to ${assignee}`);
      setAssignee('');
      setSelectedClaim(null);
    } catch { toast.error('Assignment failed.'); }
  };

  return (
    <div>
      <h5 className="fw-bold mb-4" style={{ color: '#1a3c6e' }}>Admin — Claim Search</h5>

      <form onSubmit={handleSearch} className="d-flex gap-2 mb-4" style={{ maxWidth: '500px' }}>
        <input className="form-control" value={claimNo} onChange={(e) => { setClaimNo(e.target.value); setError(''); }} placeholder="Claim number..." />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? <span className="spinner-border spinner-border-sm" /> : 'Search'}
        </button>
      </form>
      {error && <div className="text-danger mb-3 small">{error}</div>}

      {results.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table className="table table-hover mb-0" style={{ fontSize: '13px' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th>Claim No</th>
                <th>Policy No</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((c, i) => (
                <tr key={i}>
                  <td className="fw-semibold">{c.CLAIM_NUMBER}</td>
                  <td>{c.POLICY_NO || '—'}</td>
                  <td><span className="badge bg-secondary">{c.STATUS || '—'}</span></td>
                  <td>{c.ASSIGNED_TO || '—'}</td>
                  <td>
                    {selectedClaim === c.CLAIM_NUMBER ? (
                      <div className="d-flex gap-2">
                        <input className="form-control form-control-sm" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Username" style={{ width: '130px' }} />
                        <button className="btn btn-success btn-sm" onClick={() => handleAssign(c)}>Assign</button>
                        <button className="btn btn-outline-secondary btn-sm" onClick={() => setSelectedClaim(null)}>Cancel</button>
                      </div>
                    ) : (
                      <button className="btn btn-outline-primary btn-sm" onClick={() => setSelectedClaim(c.CLAIM_NUMBER)}>Reassign</button>
                    )}
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

export default AdminClaimSearch;
