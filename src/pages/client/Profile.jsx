// src/pages/client/Profile.jsx (updated)
import React, { useContext } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, admin, logoutUser, logoutAdmin } = useAuth();
  const navigate = useNavigate();
  
  const isAdmin = !!admin;
  const currentUser = isAdmin ? admin : user;

  const handleLogout = () => {
    if (isAdmin) {
      logoutAdmin();
      toast.success('Admin logged out successfully');
      navigate('/login');
    } else {
      logoutUser();
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {isAdmin ? (
              <Shield size={48} />
            ) : (
              <User size={48} />
            )}
          </div>
          <h1>
            {isAdmin ? 'Admin Profile' : 'My Profile'}
            {isAdmin && (
              <span className="admin-badge">
                {admin.role}
              </span>
            )}
          </h1>
        </div>

        <div className="profile-details">
          <div className="detail-item">
            <Mail size={20} />
            <div>
              <label>Email</label>
              <p>{currentUser.email}</p>
            </div>
          </div>
          
          {!isAdmin && user?.name && (
            <div className="detail-item">
              <User size={20} />
              <div>
                <label>Name</label>
                <p>{user.name}</p>
              </div>
            </div>
          )}
          
          {isAdmin && (
            <div className="detail-item">
              <Shield size={20} />
              <div>
                <label>Role</label>
                <p className="admin-role">{admin.role}</p>
              </div>
            </div>
          )}
        </div>

        <div className="profile-actions">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            <span>{isAdmin ? 'Logout Admin' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;