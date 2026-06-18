import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AssessmentPool, closeCasesAsExclusion, moveCasesToBeReferred } from '../../../services/add/AssessmentPool';

const PAGE_SIZE = 5;
const ATTRIBUTES = ['policy_number', 'case_id', 'krn', 'app_no', 'case_status', 'iris_status', 'base_sa'];

const AssessorPoolSearch = () => {
  const history = useHistory();
  const [attribute, setAttribute] = useState('policy_number');
  const [value, setValue] = useState('');
  const [activeTab, setActiveTab] = useState('non-exclusion');
  const [exclusionCases, setExclusionCases] = useState([]);
  const [nonExclusionCases, setNonExclusionCases] = useState([]);
  const [selectedCases, setSelectedCases] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const offset = (page - 1) * PAGE_SIZE;
      const results = await AssessmentPool(attribute, value, activeTab === 'exclusion', offset, PAGE_SIZE);
      if (activeTab === 'exclusion') setExclusionCases(Array.isArray(results) ? results : []);
      else setNonExclusionCases(Array.isArray(results) ? results : []);
    } catch {
      setError('Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const displayData = activeTab === 'exclusion' ? exclusionCases : nonExclusionCases;

  const toggleSelect = (id) => {
    setSelectedCases((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleCloseAsExclusion = async () => {
    if (!selectedCases.length) return;
    try {
      await closeCasesAsExclusion(selectedCases, '', '');
      toast.success('Cases closed as exclusion.');
      setSelectedCases([]);
    } catch { toast.error('Failed.'); }
  };

  const handleMoveToReferred = async () => {
    if (!selectedCases.length) return;
    try {
      await moveCasesToBeReferred(selectedCases);
      toast.success('Cases moved to referred.');
      setSelectedCases([]);
    } catch { toast.error('Failed.'); }
  };

  return (
    <div>
      <h6 className="fw-semibold mb-3">Assessment Pool Search</h6>

      <form onSubmit={handleSearch} className="row g-2 mb-3">
        <div className="col-auto">
          <select className="form-select form-select-sm" value={attribute} onChange={(e) => setAttribute(e.target.value)}>
            {ATTRIBUTES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="col-auto">
          <input className="form-control form-control-sm" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Search value..." />
        </div>
        <div className="col-auto">
          <button className="btn btn-primary btn-sm" type="submit" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm" /> : 'Search'}
          </button>
        </div>
      </form>

      {/* Sub-tabs */}
      <ul className="nav nav-pills mb-3">
        {[['non-exclusion', 'Non-Exclusion'], ['exclusion', 'Exclusion']].map(([k, l]) => (
          <li key={k} className="nav-item">
            <button className={`nav-link btn btn-sm me-2 ${activeTab === k ? 'active' : 'btn-outline-secondary'}`} onClick={() => setActiveTab(k)}>{l}</button>
          </li>
        ))}
      </ul>

      {selectedCases.length > 0 && (
        <div className="d-flex gap-2 mb-3">
          <button className="btn btn-warning btn-sm" onClick={handleCloseAsExclusion}>Close as Exclusion ({selectedCases.length})</button>
          <button className="btn btn-info btn-sm" onClick={handleMoveToReferred}>Move to Referred ({selectedCases.length})</button>
        </div>
      )}

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <table className="table table-hover table-sm" style={{ fontSize: '13px' }}>
        <thead style={{ background: '#f8fafc' }}>
          <tr>
            <th></th>
            <th>Case ID</th>
            <th>Policy Number</th>
            <th>Status</th>
            <th>Base SA</th>
          </tr>
        </thead>
        <tbody>
          {displayData.length === 0 ? (
            <tr><td colSpan={5} className="text-center text-muted py-3">No results. Run a search above.</td></tr>
          ) : displayData.map((c, i) => (
            <tr key={i} onDoubleClick={() => history.push(`/case/${c.case_id || c.id}`)}>
              <td><input type="checkbox" checked={selectedCases.includes(c.case_id || c.id)} onChange={() => toggleSelect(c.case_id || c.id)} /></td>
              <td>{c.case_id || c.id || '—'}</td>
              <td>{c.policy_number || '—'}</td>
              <td><span className="badge bg-secondary">{c.case_status || c.STATUS || '—'}</span></td>
              <td>{c.base_sa ? `₹${Number(c.base_sa).toLocaleString()}` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="d-flex justify-content-center gap-2">
        <button className="btn btn-sm btn-outline-secondary" disabled={page === 1} onClick={() => { setPage(page - 1); }}>‹ Prev</button>
        <span className="small">Page {page}</span>
        <button className="btn btn-sm btn-outline-secondary" disabled={displayData.length < PAGE_SIZE} onClick={() => { setPage(page + 1); }}>Next ›</button>
      </div>
    </div>
  );
};

export default AssessorPoolSearch;
