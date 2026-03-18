import React from 'react';
import AdminLayout from './AdminLayout';
import { Notifications } from '@mui/icons-material';
import './AdminDashboard.css';

const AdminNotifications = () => {
  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Notifications</h1>
          <p className="admin-page-subtitle">System alerts and customer notifications</p>
        </div>
      </div>

      <div className="admin-placeholder admin-animate-in">
        <div className="admin-placeholder-icon"><Notifications style={{ fontSize: 56 }} /></div>
        <div className="admin-placeholder-title">Notifications Center</div>
        <div className="admin-placeholder-subtitle">Manage notifications sent to customers here.<br/>Coming soon — connect to the Notifications API.</div>
      </div>
    </AdminLayout>
  );
};

export default AdminNotifications;
