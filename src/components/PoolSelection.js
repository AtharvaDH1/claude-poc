import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { DataSearch, updateAssignedUser } from '../services/poolSelectionService';
import userService from '../services/userService';

const formatDate = (str) => str ? new Date(str).toLocaleDateString('en-IN') : '—';
const getStatusBadge = (status) => {
  const s = (status || '').toLowerCase();
  if (s.includes('approved')) return <span className="badge bg-success">{status}</span>;
  if (s.includes('rejected')) return <span className="badge bg-danger">{status}</span>;
  return <span className="badge bg-warning text-dark">{status || '—'}</span>;
};

const PoolSelection = () => {
  const loggedUser = sessionStorage.getItem('loggedUser') || '';
  const [availableRoles, setAvailableRoles] = useState([]);
  const [role, setRole] = useState('');
  const [data, setData] = useState([]);
  const [showButton, setShowButton] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const roles = payload.realm_access?.roles || [];
        setAvailableRoles(roles.filter((r) => r === 'Assessor' || r === 'Verifier'));
        return;
      } catch {}
    }
    userService.getUserById(loggedUser).then((u) => {
      setAvailableRoles((u?.roles || []).filter((r) => r === 'Assessor' || r === 'Verifier'));
    }).catch(() => {});
  }, [loggedUser]);

  const handleRoleChange = async (selectedRole) => {
    setRole(selectedRole);
    if (!selectedRole || selectedRole === 'Select') { setShowTable(false); return; }
    setLoading(true);
    try {
      const results = await DataSearch(selectedRole);
      setData(Array.isArray(results) ? results : []);
      setShowTable(true);
      setShowButton(false);
      setCheckedItems({});
    } catch {
      toast.error('Failed to load pool data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = (claimNumber) => {
    setCheckedItems((prev) => {
      const updated = { ...prev, [claimNumber]: !prev[claimNumber] };
      setShowButton(Object.values(updated).some(Boolean));
      return updated;
    });
  };

  const handleAssignToSelf = async () => {
    const selected = Object.entries(checkedItems).filter(([, v]) => v).map(([k]) => k);
    if (!selected.length) return;
    try {
      await Promise.all(selected.map((cn) => updateAssignedUser(cn, loggedUser, role, true)));
      toast.success(`${selected.length} claim(s) assigned to you.`);
      setCheckedItems({});
      setShowButton(false);
      handleRoleChange(role);
    } catch {
      toast.error('Assignment failed.');
    }
  };

  return (
    <div>
      <h5 className="fw-bold mb-4" style={{ color: '#1a3c6e' }}>Pool Selection</h5>

      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '20px', maxWidth: '400px' }}>
        <label className="form-label fw-semibold small">Select Role</label>
        <select className="form-select" value={role} onChange={(e) => handleRoleChange(e.target.value)}>
          <option value="">-- Select --</option>
          {availableRoles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {loading && <div className="d-flex justify-content-center py-4"><div className="spinner-border text-primary" /></div>}

      {showTable && !loading && (
        <>
          {showButton && (
            <button className="btn btn-success mb-3" onClick={handleAssignToSelf}>
              ✅ Assign Selected to Me
            </button>
          )}
          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <table className="table table-hover mb-0" style={{ fontSize: '13px' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Claim Number</th>
                  <th>Policy No</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-muted py-4">No claims in pool.</td></tr>
                ) : data.map((c, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        type="checkbox"
                        checked={!!checkedItems[c.CLAIM_NUMBER]}
                        onChange={() => handleCheck(c.CLAIM_NUMBER)}
                      />
                    </td>
                    <td className="fw-semibold">{c.CLAIM_NUMBER}</td>
                    <td>{c.POLICY_NO || c.POLICY_NUMBER || '—'}</td>
                    <td>{getStatusBadge(c.STATUS)}</td>
                    <td>{formatDate(c.CREATED_AT)}</td>
                    <td>
                      <Link to={`/registration-fetch/${c.CLAIM_NUMBER}`} className="btn btn-outline-primary btn-sm py-0 px-2">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default PoolSelection;
