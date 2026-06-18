import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import userService from '../../services/userService';
import roleService from '../../services/roleService';
import Loader from './Loader';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{10}$/;

const validateNewUser = (u) => {
  const e = {};
  if (!u.username) e.username = 'User Name is required';
  if (!u.firstName) e.firstName = 'First Name is required';
  if (!u.lastName) e.lastName = 'Last Name is required';
  if (!u.password) e.password = 'Password is required';
  else if (u.password.length < 6) e.password = 'Password must be at least 6 characters long';
  if (!u.email) e.email = 'Email is required';
  else if (!EMAIL_RE.test(u.email)) e.email = 'Email is not valid';
  if (!u.phoneNumber) e.phoneNumber = 'Phone number is required';
  else if (!PHONE_RE.test(u.phoneNumber)) e.phoneNumber = 'Phone number is not valid';
  return e;
};

const UserManager = () => {
  const loggedUser = sessionStorage.getItem('loggedUser') || '';
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [checkedRoles, setCheckedRoles] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', firstName: '', lastName: '', password: '', email: '', phoneNumber: '' });
  const [newRole, setNewRole] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const userData = await userService.getUserById(loggedUser);
        const userRoles = userData?.roles || [];
        if (!userRoles.includes('admin')) {
          toast.error('Access denied. Admin role required.');
          setLoading(false);
          return;
        }
        setIsAdmin(true);
        const [usersData, rolesData] = await Promise.all([userService.getUsers(), roleService.getRoles()]);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      } catch {
        toast.error('Failed to load user management data.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loggedUser]);

  const filteredUsers = users.filter((u) => {
    if (statusFilter === 'active' && !u.active) return false;
    if (statusFilter === 'inactive' && u.active) return false;
    if (searchTerm && !`${u.username} ${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    setCheckedRoles(u.roles || []);
  };

  const handleRoleToggle = (role) => {
    setCheckedRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]);
  };

  const handleUpdateRoles = async () => {
    if (!selectedUser) return;
    try {
      await userService.updateUser(selectedUser.id, { roles: checkedRoles });
      toast.success(`Roles updated for ${selectedUser.username}`);
      setUsers((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, roles: checkedRoles } : u));
      setSelectedUser(null);
    } catch { toast.error('Failed to update roles.'); }
  };

  const handleAddUser = async () => {
    const errs = validateNewUser(newUser);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      const created = await userService.addUser(newUser);
      setUsers((prev) => [...prev, created]);
      setNewUser({ username: '', firstName: '', lastName: '', password: '', email: '', phoneNumber: '' });
      setShowAddUser(false);
      toast.success('User created successfully.');
    } catch { toast.error('Failed to create user.'); }
  };

  const handleAddRole = async () => {
    if (!newRole.trim()) { toast.warning('Role Name Required'); return; }
    try {
      const created = await roleService.addRoles({ name: newRole });
      setRoles((prev) => [...prev, created]);
      setNewRole('');
      setShowAddRole(false);
      toast.success('Role added.');
    } catch { toast.error('Failed to add role.'); }
  };

  if (loading) return <Loader message="Loading user management..." />;

  if (!isAdmin) return (
    <div className="alert alert-danger">Access denied. This page requires admin privileges.</div>
  );

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h5 className="fw-bold mb-0" style={{ color: '#1a3c6e' }}>User Management</h5>
        <div className="d-flex gap-2">
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddUser(!showAddUser)}>+ Add User</button>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowAddRole(!showAddRole)}>+ Add Role</button>
        </div>
      </div>

      {/* Add User Form */}
      {showAddUser && (
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '20px' }}>
          <h6 className="fw-semibold mb-3">New User</h6>
          <div className="row g-2">
            {[['username', 'Username'], ['firstName', 'First Name'], ['lastName', 'Last Name'], ['email', 'Email'], ['phoneNumber', 'Phone (10 digits)'], ['password', 'Password']].map(([field, label]) => (
              <div key={field} className="col-md-4">
                <label className="form-label small">{label}</label>
                <input
                  type={field === 'password' ? 'password' : 'text'}
                  className={`form-control form-control-sm ${errors[field] ? 'is-invalid' : ''}`}
                  value={newUser[field]}
                  onChange={(e) => { setNewUser((p) => ({ ...p, [field]: e.target.value })); setErrors((p) => ({ ...p, [field]: '' })); }}
                />
                {errors[field] && <div className="invalid-feedback">{errors[field]}</div>}
              </div>
            ))}
          </div>
          <div className="mt-3 d-flex gap-2">
            <button className="btn btn-success btn-sm" onClick={handleAddUser}>Create User</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => { setShowAddUser(false); setErrors({}); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Add Role Form */}
      {showAddRole && (
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '20px' }}>
          <h6 className="fw-semibold mb-3">New Role</h6>
          <div className="d-flex gap-2" style={{ maxWidth: '400px' }}>
            <input className="form-control form-control-sm" value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="Role name" />
            <button className="btn btn-success btn-sm" onClick={handleAddRole}>Add</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowAddRole(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
        {['all', 'active', 'inactive'].map((f) => (
          <button key={f} className={`btn btn-sm ${statusFilter === f ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setStatusFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <input
          className="form-control form-control-sm ms-auto"
          style={{ maxWidth: '200px' }}
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: '20px' }}>
        <table className="table table-hover mb-0" style={{ fontSize: '13px' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-muted py-4">No users found.</td></tr>
            ) : filteredUsers.map((u) => (
              <tr key={u.id} style={{ background: selectedUser?.id === u.id ? '#eff6ff' : '' }}>
                <td className="fw-semibold">{u.username}</td>
                <td>{u.firstName} {u.lastName}</td>
                <td>{u.email || '—'}</td>
                <td>{(u.roles || []).map((r) => <span key={r} className="badge bg-info text-dark me-1">{r}</span>)}</td>
                <td>{u.active ? <span className="badge bg-success">Active</span> : <span className="badge bg-secondary">Inactive</span>}</td>
                <td>
                  <button className="btn btn-outline-primary btn-sm py-0 px-2" onClick={() => handleSelectUser(u)}>Edit Roles</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role editor */}
      {selectedUser && (
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '20px' }}>
          <h6 className="fw-semibold mb-3">Edit Roles — {selectedUser.username}</h6>
          <div className="d-flex flex-wrap gap-3 mb-3">
            {roles.map((r) => {
              const rName = r.name || r;
              return (
                <div key={rName} className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`role-${rName}`}
                    checked={checkedRoles.includes(rName)}
                    onChange={() => handleRoleToggle(rName)}
                  />
                  <label className="form-check-label small" htmlFor={`role-${rName}`}>{rName}</label>
                </div>
              );
            })}
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={handleUpdateRoles}>Save Roles</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setSelectedUser(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
