import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../../services/authService';
import userService from '../../services/userService';

const ProfileView = ({ setProfileViewtoggle, setAuthenticated }) => {
  const history = useHistory();
  const loggedUser = sessionStorage.getItem('loggedUser') || '';

  const [profileData, setProfileData] = useState({});
  const [editEmail, setEditEmail] = useState(false);
  const [editPhone, setEditPhone] = useState(false);
  const [editPassword, setEditPassword] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    userService.getUserById(loggedUser)
      .then((data) => setProfileData(data || {}))
      .catch(() => {});
  }, [loggedUser]);

  const handleLogout = () => {
    authService.logout();
    setAuthenticated(false);
    setProfileViewtoggle(false);
    history.push('/login');
  };

  const validateEmail = (val) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(val)) return 'Invalid email address';
    return '';
  };

  const handleUpdate = async () => {
    if (editEmail) {
      const err = validateEmail(newEmail);
      if (err) { setEmailError(err); return; }
    }
    setLoading(true);
    try {
      await userService.updateUser(profileData.id, {
        ...(editEmail && { email: newEmail }),
        ...(editPhone && { phoneNumber: newPhoneNumber }),
        ...(editPassword && { password }),
      });
      toast.success('Profile updated successfully');
      setEditEmail(false); setEditPhone(false); setEditPassword(false);
    } catch (e) {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-view-dropdown" style={{
      position: 'absolute', top: '60px', right: '16px', background: '#fff',
      border: '1px solid #ddd', borderRadius: '8px', padding: '20px',
      minWidth: '300px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 1000,
    }}>
      <h6 className="fw-bold mb-3">{profileData.firstName} {profileData.lastName}</h6>
      <p className="text-muted small mb-1"><strong>Username:</strong> {loggedUser}</p>
      <p className="text-muted small mb-1"><strong>Role:</strong> {Array.isArray(profileData.roles) ? profileData.roles.join(', ') : profileData.roles}</p>

      <hr />

      {/* Email */}
      <div className="mb-2">
        <div className="d-flex justify-content-between align-items-center">
          <span className="small"><strong>Email:</strong> {profileData.email}</span>
          <button className="btn btn-link btn-sm p-0" onClick={() => setEditEmail(!editEmail)}>Edit</button>
        </div>
        {editEmail && (
          <div className="mt-1">
            <input className="form-control form-control-sm" value={newEmail} onChange={(e) => { setNewEmail(e.target.value); setEmailError(''); }} placeholder="New email" />
            {emailError && <small className="text-danger">{emailError}</small>}
          </div>
        )}
      </div>

      {/* Phone */}
      <div className="mb-2">
        <div className="d-flex justify-content-between align-items-center">
          <span className="small"><strong>Phone:</strong> {profileData.phoneNumber}</span>
          <button className="btn btn-link btn-sm p-0" onClick={() => setEditPhone(!editPhone)}>Edit</button>
        </div>
        {editPhone && (
          <input className="form-control form-control-sm mt-1" value={newPhoneNumber} onChange={(e) => setNewPhoneNumber(e.target.value)} placeholder="New phone" />
        )}
      </div>

      {/* Password */}
      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center">
          <span className="small"><strong>Password</strong></span>
          <button className="btn btn-link btn-sm p-0" onClick={() => setEditPassword(!editPassword)}>Change</button>
        </div>
        {editPassword && (
          <input className="form-control form-control-sm mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" />
        )}
      </div>

      {(editEmail || editPhone || editPassword) && (
        <button className="btn btn-primary btn-sm w-100 mb-2" onClick={handleUpdate} disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      )}

      <button className="btn btn-outline-danger btn-sm w-100" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default ProfileView;
