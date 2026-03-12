import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './AdminBackHeader.css';

const AdminBackHeader = () => (
  <Link to="/admin/dashboard" className="admin-back-btn">
    <ArrowLeft size={18} />
    Back to Dashboard
  </Link>
);

export default AdminBackHeader;
