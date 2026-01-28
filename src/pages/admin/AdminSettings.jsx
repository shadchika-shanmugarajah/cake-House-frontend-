import React, { useState } from 'react';
import { 
  Settings, Save, Bell, CreditCard, Shield, Users,
  Globe, Palette, Moon, Sun, Eye, EyeOff, Database,
  Smartphone, Mail, MessageSquare, Lock, AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import './AdminSettings.css';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    // General Settings
    storeName: 'Sweet Delights Bakery',
    storeEmail: 'contact@sweetdelights.com',
    storePhone: '+1 (555) 123-4567',
    storeAddress: '123 Bakery Street, Sweet City, SC 12345',
    currency: 'Rs',
    timezone: 'UTC+5:30 (India Standard Time)',
    
    // Notification Settings
    emailNotifications: true,
    orderNotifications: true,
    lowStockAlerts: true,
    marketingEmails: false,
    
    // Payment Settings
    acceptCreditCards: true,
    acceptCashOnDelivery: true,
    acceptPayPal: false,
    paymentTestMode: false,
    
    // Security Settings
    twoFactorAuth: false,
    passwordExpiry: 90,
    sessionTimeout: 30,
    showPassword: false,
    
    // Display Settings
    theme: 'light',
    language: 'english',
    dateFormat: 'DD/MM/YYYY',
    itemsPerPage: 20
  });

  const [newPassword, setNewPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handleSaveSettings = () => {
    toast.success('Settings saved successfully!');
    // In a real app, you would make an API call here
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      toast.info('Settings reset to default');
    }
  };

  const handleChangePassword = () => {
    if (newPassword.new !== newPassword.confirm) {
      toast.error('New passwords do not match!');
      return;
    }
    if (newPassword.new.length < 8) {
      toast.error('Password must be at least 8 characters!');
      return;
    }
    toast.success('Password changed successfully!');
    setNewPassword({ current: '', new: '', confirm: '' });
  };

  return (
    <div className="settings-page">
      {/* Page Header */}
      <div className="settings-header">
        <div className="settings-header-left">
          <div className="settings-header-icon">
            <Settings size={24} />
          </div>
          <div>
            <h1>Settings</h1>
            <p className="settings-header-subtitle">
              Manage your bakery's configuration and preferences
            </p>
          </div>
        </div>
        <div className="settings-header-actions">
          <button className="settings-btn secondary" onClick={handleResetSettings}>
            Reset to Default
          </button>
          <button className="settings-btn primary" onClick={handleSaveSettings}>
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="settings-tabs">
        <button 
          className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <Globe size={18} />
          General
        </button>
        <button 
          className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={18} />
          Notifications
        </button>
        <button 
          className={`settings-tab ${activeTab === 'payment' ? 'active' : ''}`}
          onClick={() => setActiveTab('payment')}
        >
          <CreditCard size={18} />
          Payment
        </button>
        <button 
          className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <Shield size={18} />
          Security
        </button>
        <button 
          className={`settings-tab ${activeTab === 'display' ? 'active' : ''}`}
          onClick={() => setActiveTab('display')}
        >
          <Palette size={18} />
          Display
        </button>
      </div>

      {/* Settings Content */}
      <div className="settings-content">
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="settings-section">
            <h3 className="settings-section-title">
              <Globe size={20} />
              General Settings
            </h3>
            <p className="settings-section-desc">
              Configure your bakery's basic information and preferences
            </p>

            <div className="settings-grid">
              <div className="setting-group">
                <label className="setting-label">Store Name</label>
                <input 
                  type="text" 
                  className="setting-input"
                  value={settings.storeName}
                  onChange={(e) => setSettings({...settings, storeName: e.target.value})}
                />
              </div>

              <div className="setting-group">
                <label className="setting-label">Store Email</label>
                <input 
                  type="email" 
                  className="setting-input"
                  value={settings.storeEmail}
                  onChange={(e) => setSettings({...settings, storeEmail: e.target.value})}
                />
              </div>

              <div className="setting-group">
                <label className="setting-label">Store Phone</label>
                <input 
                  type="tel" 
                  className="setting-input"
                  value={settings.storePhone}
                  onChange={(e) => setSettings({...settings, storePhone: e.target.value})}
                />
              </div>

              <div className="setting-group full-width">
                <label className="setting-label">Store Address</label>
                <textarea 
                  className="setting-textarea"
                  value={settings.storeAddress}
                  onChange={(e) => setSettings({...settings, storeAddress: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="setting-group">
                <label className="setting-label">Currency</label>
                <select 
                  className="setting-select"
                  value={settings.currency}
                  onChange={(e) => setSettings({...settings, currency: e.target.value})}
                >
                  <option value="Rs">Rupees (Rs)</option>
                  <option value="$">Dollars ($)</option>
                  <option value="€">Euros (€)</option>
                  <option value="£">Pounds (£)</option>
                </select>
              </div>

              <div className="setting-group">
                <label className="setting-label">Timezone</label>
                <select 
                  className="setting-select"
                  value={settings.timezone}
                  onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                >
                  <option value="UTC+5:30 (India Standard Time)">UTC+5:30 (India)</option>
                  <option value="UTC-5 (EST)">UTC-5 (EST)</option>
                  <option value="UTC-8 (PST)">UTC-8 (PST)</option>
                  <option value="UTC+0 (GMT)">UTC+0 (GMT)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <div className="settings-section">
            <h3 className="settings-section-title">
              <Bell size={20} />
              Notification Settings
            </h3>
            <p className="settings-section-desc">
              Control what notifications you receive
            </p>

            <div className="settings-grid">
              <div className="toggle-group">
                <div className="toggle-label">
                  <Mail size={16} />
                  <div>
                    <div className="toggle-title">Email Notifications</div>
                    <div className="toggle-desc">Receive notifications via email</div>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="toggle-group">
                <div className="toggle-label">
                  <MessageSquare size={16} />
                  <div>
                    <div className="toggle-title">Order Notifications</div>
                    <div className="toggle-desc">Notify when new orders arrive</div>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.orderNotifications}
                    onChange={(e) => setSettings({...settings, orderNotifications: e.target.checked})}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="toggle-group">
                <div className="toggle-label">
                  <AlertCircle size={16} />
                  <div>
                    <div className="toggle-title">Low Stock Alerts</div>
                    <div className="toggle-desc">Get alerts when items are low in stock</div>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.lowStockAlerts}
                    onChange={(e) => setSettings({...settings, lowStockAlerts: e.target.checked})}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="toggle-group">
                <div className="toggle-label">
                  <Smartphone size={16} />
                  <div>
                    <div className="toggle-title">Marketing Emails</div>
                    <div className="toggle-desc">Receive promotional emails and updates</div>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.marketingEmails}
                    onChange={(e) => setSettings({...settings, marketingEmails: e.target.checked})}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Payment Settings */}
        {activeTab === 'payment' && (
          <div className="settings-section">
            <h3 className="settings-section-title">
              <CreditCard size={20} />
              Payment Settings
            </h3>
            <p className="settings-section-desc">
              Configure payment methods and preferences
            </p>

            <div className="settings-grid">
              <div className="toggle-group">
                <div className="toggle-label">
                  <CreditCard size={16} />
                  <div>
                    <div className="toggle-title">Accept Credit/Debit Cards</div>
                    <div className="toggle-desc">Allow customers to pay with cards</div>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.acceptCreditCards}
                    onChange={(e) => setSettings({...settings, acceptCreditCards: e.target.checked})}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="toggle-group">
                <div className="toggle-label">
                  <Database size={16} />
                  <div>
                    <div className="toggle-title">Accept Cash on Delivery</div>
                    <div className="toggle-desc">Allow customers to pay when delivered</div>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.acceptCashOnDelivery}
                    onChange={(e) => setSettings({...settings, acceptCashOnDelivery: e.target.checked})}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="toggle-group">
                <div className="toggle-label">
                  <Smartphone size={16} />
                  <div>
                    <div className="toggle-title">Accept PayPal</div>
                    <div className="toggle-desc">Allow customers to pay with PayPal</div>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.acceptPayPal}
                    onChange={(e) => setSettings({...settings, acceptPayPal: e.target.checked})}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="toggle-group">
                <div className="toggle-label">
                  <Settings size={16} />
                  <div>
                    <div className="toggle-title">Test Mode</div>
                    <div className="toggle-desc">Use test payment gateway (for testing)</div>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.paymentTestMode}
                    onChange={(e) => setSettings({...settings, paymentTestMode: e.target.checked})}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-group full-width">
                <label className="setting-label">Payment Instructions</label>
                <textarea 
                  className="setting-textarea"
                  placeholder="Add any special payment instructions for customers..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="settings-section">
            <h3 className="settings-section-title">
              <Shield size={20} />
              Security Settings
            </h3>
            <p className="settings-section-desc">
              Manage your account security and access controls
            </p>

            {/* Change Password Section */}
            <div className="security-section">
              <h4 className="security-section-title">
                <Lock size={18} />
                Change Password
              </h4>
              
              <div className="password-form">
                <div className="setting-group">
                  <label className="setting-label">Current Password</label>
                  <div className="password-input-wrapper">
                    <input 
                      type={settings.showPassword ? "text" : "password"} 
                      className="setting-input"
                      value={newPassword.current}
                      onChange={(e) => setNewPassword({...newPassword, current: e.target.value})}
                      placeholder="Enter current password"
                    />
                    <button 
                      className="password-toggle"
                      onClick={() => setSettings({...settings, showPassword: !settings.showPassword})}
                    >
                      {settings.showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="setting-group">
                  <label className="setting-label">New Password</label>
                  <input 
                    type={settings.showPassword ? "text" : "password"} 
                    className="setting-input"
                    value={newPassword.new}
                    onChange={(e) => setNewPassword({...newPassword, new: e.target.value})}
                    placeholder="Enter new password"
                  />
                  <div className="password-hint">
                    Password must be at least 8 characters long
                  </div>
                </div>

                <div className="setting-group">
                  <label className="setting-label">Confirm New Password</label>
                  <input 
                    type={settings.showPassword ? "text" : "password"} 
                    className="setting-input"
                    value={newPassword.confirm}
                    onChange={(e) => setNewPassword({...newPassword, confirm: e.target.value})}
                    placeholder="Confirm new password"
                  />
                </div>

                <button className="settings-btn primary" onClick={handleChangePassword}>
                  Change Password
                </button>
              </div>
            </div>

            {/* Security Features */}
            <div className="security-section">
              <h4 className="security-section-title">Security Features</h4>
              
              <div className="settings-grid">
                <div className="toggle-group">
                  <div className="toggle-label">
                    <Shield size={16} />
                    <div>
                      <div className="toggle-title">Two-Factor Authentication</div>
                      <div className="toggle-desc">Add extra security to your account</div>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.twoFactorAuth}
                      onChange={(e) => setSettings({...settings, twoFactorAuth: e.target.checked})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-group">
                  <label className="setting-label">Password Expiry (Days)</label>
                  <select 
                    className="setting-select"
                    value={settings.passwordExpiry}
                    onChange={(e) => setSettings({...settings, passwordExpiry: e.target.value})}
                  >
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                    <option value={180}>180 days</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label className="setting-label">Session Timeout (Minutes)</label>
                  <select 
                    className="setting-select"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({...settings, sessionTimeout: e.target.value})}
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Display Settings */}
        {activeTab === 'display' && (
          <div className="settings-section">
            <h3 className="settings-section-title">
              <Palette size={20} />
              Display Settings
            </h3>
            <p className="settings-section-desc">
              Customize how the admin panel looks and behaves
            </p>

            <div className="settings-grid">
              {/* Theme Selection */}
              <div className="setting-group">
                <label className="setting-label">Theme</label>
                <div className="theme-options">
                  <button 
                    className={`theme-option ${settings.theme === 'light' ? 'active' : ''}`}
                    onClick={() => setSettings({...settings, theme: 'light'})}
                  >
                    <Sun size={20} />
                    <span>Light</span>
                  </button>
                  <button 
                    className={`theme-option ${settings.theme === 'dark' ? 'active' : ''}`}
                    onClick={() => setSettings({...settings, theme: 'dark'})}
                  >
                    <Moon size={20} />
                    <span>Dark</span>
                  </button>
                </div>
              </div>

              <div className="setting-group">
                <label className="setting-label">Language</label>
                <select 
                  className="setting-select"
                  value={settings.language}
                  onChange={(e) => setSettings({...settings, language: e.target.value})}
                >
                  <option value="english">English</option>
                  <option value="spanish">Spanish</option>
                  <option value="french">French</option>
                  <option value="german">German</option>
                </select>
              </div>

              <div className="setting-group">
                <label className="setting-label">Date Format</label>
                <select 
                  className="setting-select"
                  value={settings.dateFormat}
                  onChange={(e) => setSettings({...settings, dateFormat: e.target.value})}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div className="setting-group">
                <label className="setting-label">Items Per Page</label>
                <select 
                  className="setting-select"
                  value={settings.itemsPerPage}
                  onChange={(e) => setSettings({...settings, itemsPerPage: e.target.value})}
                >
                  <option value={10}>10 items</option>
                  <option value={20}>20 items</option>
                  <option value={50}>50 items</option>
                  <option value={100}>100 items</option>
                </select>
              </div>

              {/* Preview Card */}
              <div className="setting-group full-width">
                <label className="setting-label">Preview</label>
                <div className="preview-card">
                  <div className="preview-header">
                    <div className="preview-store-name">{settings.storeName}</div>
                    <div className="preview-date">
                      {settings.dateFormat === 'DD/MM/YYYY' ? '15/01/2026' : 
                       settings.dateFormat === 'MM/DD/YYYY' ? '01/15/2026' : '2026-01-15'}
                    </div>
                  </div>
                  <div className="preview-content">
                    <div className="preview-item">
                      <span>Red Velvet Cake</span>
                      <span>{settings.currency} 459</span>
                    </div>
                    <div className="preview-item">
                      <span>Chocolate Cupcakes</span>
                      <span>{settings.currency} 840</span>
                    </div>
                  </div>
                  <div className="preview-footer">
                    <span>Total</span>
                    <span>{settings.currency} 1,299</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;