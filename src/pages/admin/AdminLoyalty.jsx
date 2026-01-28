import React, { useState } from 'react';
import { 
  Award, Users, TrendingUp, Gift, Crown, Star,
  Target, Percent, Calendar, Clock, CheckCircle,
  Edit, Trash2, Plus, Search, Filter, Download,
  User, ShoppingBag, Phone, Mail, BarChart3, Eye
} from 'lucide-react';
import { toast } from 'react-toastify';
import './AdminLoyalty.css';

const AdminLoyalty = () => {
  const [activeTab, setActiveTab] = useState('members');
  const [selectedMember, setSelectedMember] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditRulesOpen, setIsEditRulesOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    anniversaryDate: '',
    initialPoints: '0',
    tier: 'bronze',
    joinDate: new Date().toISOString().split('T')[0],
    referralCode: '',
    notes: '',
    initialPurchase: '0',
    initialItems: '0',
    preferences: {
      email: true,
      sms: true,
      birthday: true,
      promotions: true
    }
  });

  // Loyalty program rules (5% discount after 8 items)
  const loyaltyRules = {
    itemsThreshold: 8,
    discountPercentage: 5,
    pointsPerDollar: 10,
    minPurchaseForPoints: 500,
    birthdayBonus: 100,
    anniversaryBonus: 50
  };

  // Loyalty members data
  const loyaltyMembers = [
    { 
      id: 'LM-001', 
      name: 'John Doe', 
      tier: 'gold',
      points: 1250,
      totalOrders: 15,
      totalSpent: 'Rs 45,820',
      discountAvailable: 'Rs 2,291',
      joinDate: 'Jan 15, 2024',
      lastOrder: 'Jan 15, 2026',
      phone: '+1 234 567 890',
      email: 'john@example.com',
      nextReward: 'After 2 more items',
      loyaltyStats: {
        itemsPurchased: 6,
        ordersCompleted: 15,
        discountsEarned: 'Rs 1,850',
        lifetimeValue: 'Rs 45,820'
      }
    },
    { 
      id: 'LM-002', 
      name: 'Jane Smith', 
      tier: 'platinum',
      points: 3250,
      totalOrders: 28,
      totalSpent: 'Rs 89,450',
      discountAvailable: 'Rs 4,473',
      joinDate: 'Nov 20, 2023',
      lastOrder: 'Jan 14, 2026',
      phone: '+1 234 567 891',
      email: 'jane@example.com',
      nextReward: 'Reward available',
      loyaltyStats: {
        itemsPurchased: 24,
        ordersCompleted: 28,
        discountsEarned: 'Rs 3,920',
        lifetimeValue: 'Rs 89,450'
      }
    },
    { 
      id: 'LM-003', 
      name: 'Robert Johnson', 
      tier: 'silver',
      points: 650,
      totalOrders: 8,
      totalSpent: 'Rs 22,150',
      discountAvailable: 'Rs 0',
      joinDate: 'Feb 10, 2025',
      lastOrder: 'Jan 13, 2026',
      phone: '+1 234 567 892',
      email: 'robert@example.com',
      nextReward: 'After 3 more items',
      loyaltyStats: {
        itemsPurchased: 5,
        ordersCompleted: 8,
        discountsEarned: 'Rs 450',
        lifetimeValue: 'Rs 22,150'
      }
    },
    { 
      id: 'LM-004', 
      name: 'Sarah Williams', 
      tier: 'gold',
      points: 1850,
      totalOrders: 22,
      totalSpent: 'Rs 68,920',
      discountAvailable: 'Rs 3,446',
      joinDate: 'Mar 05, 2024',
      lastOrder: 'Jan 12, 2026',
      phone: '+1 234 567 893',
      email: 'sarah@example.com',
      nextReward: 'Reward available',
      loyaltyStats: {
        itemsPurchased: 18,
        ordersCompleted: 22,
        discountsEarned: 'Rs 2,580',
        lifetimeValue: 'Rs 68,920'
      }
    },
    { 
      id: 'LM-005', 
      name: 'Michael Brown', 
      tier: 'bronze',
      points: 320,
      totalOrders: 4,
      totalSpent: 'Rs 12,580',
      discountAvailable: 'Rs 0',
      joinDate: 'Dec 15, 2025',
      lastOrder: 'Jan 10, 2026',
      phone: '+1 234 567 894',
      email: 'michael@example.com',
      nextReward: 'After 6 more items',
      loyaltyStats: {
        itemsPurchased: 2,
        ordersCompleted: 4,
        discountsEarned: 'Rs 120',
        lifetimeValue: 'Rs 12,580'
      }
    },
    { 
      id: 'LM-006', 
      name: 'Emma Davis', 
      tier: 'platinum',
      points: 4150,
      totalOrders: 35,
      totalSpent: 'Rs 125,800',
      discountAvailable: 'Rs 6,290',
      joinDate: 'Aug 20, 2023',
      lastOrder: 'Jan 09, 2026',
      phone: '+1 234 567 895',
      email: 'emma@example.com',
      nextReward: 'Reward available',
      loyaltyStats: {
        itemsPurchased: 32,
        ordersCompleted: 35,
        discountsEarned: 'Rs 5,250',
        lifetimeValue: 'Rs 125,800'
      }
    },
  ];

  // Program statistics
  const programStats = {
    totalMembers: 156,
    activeMembers: 128,
    totalPointsIssued: '1,245,800',
    totalDiscountsGiven: 'Rs 89,450',
    averagePointsPerMember: 7984,
    conversionRate: '68%'
  };

  // Tier definitions
  const loyaltyTiers = [
    { 
      name: 'Bronze', 
      minPoints: 0,
      maxPoints: 999,
      color: '#D97706',
      benefits: ['5% discount after 8 items', 'Birthday reward', 'Monthly newsletter'],
      icon: <Star size={20} />
    },
    { 
      name: 'Silver', 
      minPoints: 1000,
      maxPoints: 2499,
      color: '#6B7280',
      benefits: ['All Bronze benefits', '7% discount after 6 items', 'Priority support', 'Double points on weekends'],
      icon: <Award size={20} />
    },
    { 
      name: 'Gold', 
      minPoints: 2500,
      maxPoints: 4999,
      color: '#F59E0B',
      benefits: ['All Silver benefits', '10% discount after 5 items', 'Free delivery', 'Early access to new products'],
      icon: <Crown size={20} />
    },
    { 
      name: 'Platinum', 
      minPoints: 5000,
      maxPoints: 99999,
      color: '#8B5CF6',
      benefits: ['All Gold benefits', '15% discount after 4 items', 'Personal cake advisor', 'Exclusive events', 'Annual gift'],
      icon: <Crown size={20} fill="#8B5CF6" />
    },
  ];

  const handleViewMember = (member) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const handleEditRules = () => {
    setIsEditRulesOpen(true);
  };

  const handleAddMember = () => {
    setIsAddMemberOpen(true);
  };

  const updateLoyaltyRules = (newRules) => {
    toast.success('Loyalty program rules updated successfully');
    setIsEditRulesOpen(false);
  };

  const handleAddMemberSubmit = () => {
    // Generate new member ID
    const newMemberId = `LM-${(loyaltyMembers.length + 1).toString().padStart(3, '0')}`;
    
    // Create new member object
    const memberToAdd = {
      id: newMemberId,
      name: newMember.name,
      tier: newMember.tier,
      points: parseInt(newMember.initialPoints) || 0,
      totalOrders: 0,
      totalSpent: 'Rs 0',
      discountAvailable: 'Rs 0',
      joinDate: new Date(newMember.joinDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      lastOrder: 'Never',
      phone: newMember.phone,
      email: newMember.email,
      nextReward: `After ${loyaltyRules.itemsThreshold} more items`,
      loyaltyStats: {
        itemsPurchased: parseInt(newMember.initialItems) || 0,
        ordersCompleted: 0,
        discountsEarned: 'Rs 0',
        lifetimeValue: 'Rs 0'
      }
    };

    // In a real app, you would save to backend here
    console.log('Adding new member:', memberToAdd);
    
    toast.success(`Member ${newMember.name} added successfully!`);
    setIsAddMemberOpen(false);
    
    // Reset form
    setNewMember({
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      anniversaryDate: '',
      initialPoints: '0',
      tier: 'bronze',
      joinDate: new Date().toISOString().split('T')[0],
      referralCode: '',
      notes: '',
      initialPurchase: '0',
      initialItems: '0',
      preferences: {
        email: true,
        sms: true,
        birthday: true,
        promotions: true
      }
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('preferences.')) {
      const prefName = name.split('.')[1];
      setNewMember(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefName]: checked
        }
      }));
    } else {
      setNewMember(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const getTierBadge = (tier) => {
    const tierConfig = loyaltyTiers.find(t => t.name.toLowerCase() === tier);
    return (
      <span 
        className="tier-badge"
        style={{ 
          backgroundColor: `${tierConfig.color}20`,
          color: tierConfig.color,
          border: `1px solid ${tierConfig.color}40`
        }}
      >
        {tierConfig.icon}
        <span style={{ marginLeft: '6px' }}>{tierConfig.name}</span>
      </span>
    );
  };

  const getProgressBar = (member) => {
    const tier = loyaltyTiers.find(t => t.name.toLowerCase() === member.tier);
    const nextTier = loyaltyTiers[loyaltyTiers.findIndex(t => t.name.toLowerCase() === member.tier) + 1];
    
    if (!nextTier) {
      return (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: '100%', backgroundColor: tier.color }} />
          <div className="progress-text">Max Tier Achieved</div>
        </div>
      );
    }

    const progress = ((member.points - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100;
    
    return (
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: tier.color }} />
        <div className="progress-text">
          {member.points} / {nextTier.minPoints} points to {nextTier.name}
        </div>
      </div>
    );
  };

  const getDiscountStatus = (member) => {
    const itemsNeeded = loyaltyRules.itemsThreshold - (member.loyaltyStats?.itemsPurchased || 0);
    
    if (itemsNeeded <= 0) {
      return (
        <div className="discount-status available">
          <CheckCircle size={14} />
          <span>5% discount available!</span>
        </div>
      );
    } else {
      return (
        <div className="discount-status pending">
          <Clock size={14} />
          <span>{itemsNeeded} more items for 5% discount</span>
        </div>
      );
    }
  };

  return (
    <div className="loyalty-page">
      {/* Page Header */}
      <div className="loyalty-header">
        <div className="loyalty-header-left">
          <div className="loyalty-header-icon">
            <Award size={24} />
          </div>
          <div>
            <h1>Loyalty Program</h1>
            <p className="loyalty-header-subtitle">
              Reward your loyal customers with discounts and special benefits
            </p>
          </div>
        </div>
        <div className="loyalty-header-stats">
          <div className="loyalty-stat-card">
            <div className="loyalty-stat-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
              <Users size={20} color="#8B5CF6" />
            </div>
            <div>
              <div className="loyalty-stat-label">Total Members</div>
              <div className="loyalty-stat-value">{programStats.totalMembers}</div>
            </div>
          </div>
          <div className="loyalty-stat-card">
            <div className="loyalty-stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
              <TrendingUp size={20} color="#10B981" />
            </div>
            <div>
              <div className="loyalty-stat-label">Active Members</div>
              <div className="loyalty-stat-value">{programStats.activeMembers}</div>
            </div>
          </div>
          <div className="loyalty-stat-card">
            <div className="loyalty-stat-icon" style={{ backgroundColor: 'rgba(255, 107, 139, 0.1)' }}>
              <Gift size={20} color="var(--primary)" />
            </div>
            <div>
              <div className="loyalty-stat-label">Discounts Given</div>
              <div className="loyalty-stat-value">{programStats.totalDiscountsGiven}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Program Rules Card */}
      <div className="loyalty-rules-card">
        <div className="loyalty-rules-header">
          <h3>
            <Target size={20} />
            Program Rules
          </h3>
          <button className="loyalty-btn secondary" onClick={handleEditRules}>
            <Edit size={16} />
            Edit Rules
          </button>
        </div>
        <div className="loyalty-rules-grid">
          <div className="loyalty-rule-item">
            <div className="loyalty-rule-icon">
              <ShoppingBag size={20} />
            </div>
            <div>
              <div className="loyalty-rule-label">Items Threshold</div>
              <div className="loyalty-rule-value">{loyaltyRules.itemsThreshold} items</div>
              <div className="loyalty-rule-desc">After purchasing {loyaltyRules.itemsThreshold} items</div>
            </div>
          </div>
          <div className="loyalty-rule-item">
            <div className="loyalty-rule-icon">
              <Percent size={20} />
            </div>
            <div>
              <div className="loyalty-rule-label">Discount</div>
              <div className="loyalty-rule-value">{loyaltyRules.discountPercentage}% off</div>
              <div className="loyalty-rule-desc">Discount on next purchase</div>
            </div>
          </div>
          <div className="loyalty-rule-item">
            <div className="loyalty-rule-icon">
              <Star size={20} />
            </div>
            <div>
              <div className="loyalty-rule-label">Points Rate</div>
              <div className="loyalty-rule-value">{loyaltyRules.pointsPerDollar} pts/Rs</div>
              <div className="loyalty-rule-desc">For every Rs spent</div>
            </div>
          </div>
          <div className="loyalty-rule-item">
            <div className="loyalty-rule-icon">
              <Gift size={20} />
            </div>
            <div>
              <div className="loyalty-rule-label">Birthday Bonus</div>
              <div className="loyalty-rule-value">{loyaltyRules.birthdayBonus} points</div>
              <div className="loyalty-rule-desc">On member's birthday</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="loyalty-tabs">
        <button 
          className={`loyalty-tab ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          <Users size={18} />
          Members ({programStats.totalMembers})
        </button>
        <button 
          className={`loyalty-tab ${activeTab === 'tiers' ? 'active' : ''}`}
          onClick={() => setActiveTab('tiers')}
        >
          <Crown size={18} />
          Membership Tiers
        </button>
        <button 
          className={`loyalty-tab ${activeTab === 'rewards' ? 'active' : ''}`}
          onClick={() => setActiveTab('rewards')}
        >
          <Gift size={18} />
          Reward History
        </button>
      </div>

      {/* Members Tab Content */}
      {activeTab === 'members' && (
        <div className="loyalty-content">
          {/* Toolbar */}
          <div className="loyalty-toolbar">
            <div className="loyalty-search">
              <Search size={18} />
              <input type="text" placeholder="Search members by name, email..." />
            </div>
            <div className="loyalty-actions">
              <button className="loyalty-btn secondary">
                <Filter size={16} />
                Filter
              </button>
              <button className="loyalty-btn secondary">
                <Download size={16} />
                Export
              </button>
              <select className="loyalty-btn secondary" style={{padding: '8px 16px'}}>
                <option>All Tiers</option>
                <option>Bronze</option>
                <option>Silver</option>
                <option>Gold</option>
                <option>Platinum</option>
              </select>
              <button className="loyalty-btn primary" onClick={handleAddMember}>
                <Plus size={16} />
                Add Member
              </button>
            </div>
          </div>

          {/* Members Table */}
          <div className="loyalty-table-container">
            <table className="loyalty-table">
              <thead>
                <tr>
                  <th>Member ID</th>
                  <th>Customer</th>
                  <th>Tier</th>
                  <th>Points</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Next Reward</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loyaltyMembers.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className="member-id">
                        {member.id}
                      </div>
                    </td>
                    <td>
                      <div className="member-info">
                        <div className="member-name">{member.name}</div>
                        <div className="member-contact">
                          <Phone size={12} />
                          <span>{member.phone}</span>
                          <Mail size={12} />
                          <span>{member.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {getTierBadge(member.tier)}
                      {getProgressBar(member)}
                    </td>
                    <td>
                      <div className="member-points">
                        <div className="points-value">{member.points.toLocaleString()}</div>
                        <div className="points-label">points</div>
                      </div>
                    </td>
                    <td>
                      <div className="member-orders">
                        <div className="orders-value">{member.totalOrders}</div>
                        <div className="orders-label">orders</div>
                      </div>
                    </td>
                    <td>
                      <div className="member-spent">
                        <div className="spent-value">{member.totalSpent}</div>
                        <div className="spent-label">lifetime</div>
                      </div>
                    </td>
                    <td>
                      {getDiscountStatus(member)}
                    </td>
                    <td>
                      <div className="loyalty-actions-cell">
                        <button 
                          className="loyalty-action-btn"
                          onClick={() => handleViewMember(member)}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="loyalty-action-btn secondary"
                          onClick={() => toast.success(`Points added to ${member.name}`)}
                          title="Add Points"
                        >
                          <Plus size={14} />
                        </button>
                        <button 
                          className="loyalty-action-btn danger"
                          onClick={() => {
                            if (window.confirm(`Remove ${member.name} from loyalty program?`)) {
                              toast.success('Member removed');
                            }
                          }}
                          title="Remove Member"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tiers Tab Content */}
      {activeTab === 'tiers' && (
        <div className="loyalty-content">
          <div className="tiers-container">
            {loyaltyTiers.map((tier, index) => (
              <div key={tier.name} className="tier-card">
                <div className="tier-header" style={{ backgroundColor: tier.color }}>
                  <div className="tier-icon">
                    {tier.icon}
                  </div>
                  <h3 className="tier-name">{tier.name}</h3>
                  <div className="tier-range">
                    {tier.minPoints} - {tier.maxPoints === 99999 ? '∞' : tier.maxPoints} points
                  </div>
                </div>
                <div className="tier-body">
                  <div className="tier-benefits">
                    <h4>Benefits:</h4>
                    <ul>
                      {tier.benefits.map((benefit, idx) => (
                        <li key={idx}>
                          <CheckCircle size={14} />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="tier-members">
                    <div className="tier-members-count">
                      {Math.floor(programStats.totalMembers * (0.4 - index * 0.1))} members
                    </div>
                    <div className="tier-members-percentage">
                      {Math.floor((0.4 - index * 0.1) * 100)}% of total
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rewards Tab Content */}
      {activeTab === 'rewards' && (
        <div className="loyalty-content">
          <div className="rewards-stats">
            <div className="rewards-stat">
              <div className="rewards-stat-label">Discounts Given This Month</div>
              <div className="rewards-stat-value">Rs 12,450</div>
            </div>
            <div className="rewards-stat">
              <div className="rewards-stat-label">Redemptions This Month</div>
              <div className="rewards-stat-value">48</div>
            </div>
            <div className="rewards-stat">
              <div className="rewards-stat-label">Avg. Discount Value</div>
              <div className="rewards-stat-value">Rs 259</div>
            </div>
            <div className="rewards-stat">
              <div className="rewards-stat-label">Most Popular Reward</div>
              <div className="rewards-stat-value">5% Discount</div>
            </div>
          </div>
          
          <div className="rewards-table-container">
            <h3>Recent Reward Redemptions</h3>
            <table className="rewards-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Member</th>
                  <th>Reward Type</th>
                  <th>Discount Value</th>
                  <th>Order Value</th>
                  <th>Points Used</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Jan 15, 2026</td>
                  <td>John Doe</td>
                  <td>5% Item Threshold</td>
                  <td>Rs 229</td>
                  <td>Rs 4,580</td>
                  <td>0</td>
                </tr>
                <tr>
                  <td>Jan 14, 2026</td>
                  <td>Jane Smith</td>
                  <td>Points Redemption</td>
                  <td>Rs 500</td>
                  <td>Rs 3,450</td>
                  <td>5,000</td>
                </tr>
                <tr>
                  <td>Jan 13, 2026</td>
                  <td>Robert Johnson</td>
                  <td>Birthday Bonus</td>
                  <td>Rs 100</td>
                  <td>Rs 2,255</td>
                  <td>100</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Member Details Modal */}
      {isModalOpen && selectedMember && (
        <div className="modal-overlay">
          <div className="loyalty-modal-content">
            <button onClick={() => setIsModalOpen(false)} className="modal-close">×</button>
            
            <div className="loyalty-modal-header">
              <div className="member-modal-title">
                <h2>{selectedMember.name}</h2>
                {getTierBadge(selectedMember.tier)}
              </div>
              <div className="member-points-large">
                <div className="points-large-value">{selectedMember.points.toLocaleString()}</div>
                <div className="points-large-label">Total Points</div>
              </div>
            </div>

            <div className="loyalty-modal-grid">
              {/* Customer Info */}
              <div className="loyalty-modal-section">
                <h3 className="modal-section-title">
                  <User size={18} />
                  Customer Information
                </h3>
                <div className="modal-info-grid">
                  <div className="modal-info-item">
                    <div className="modal-info-label">Member ID</div>
                    <div className="modal-info-value">{selectedMember.id}</div>
                  </div>
                  <div className="modal-info-item">
                    <div className="modal-info-label">Join Date</div>
                    <div className="modal-info-value">{selectedMember.joinDate}</div>
                  </div>
                  <div className="modal-info-item">
                    <div className="modal-info-label">Last Order</div>
                    <div className="modal-info-value">{selectedMember.lastOrder}</div>
                  </div>
                  <div className="modal-info-item">
                    <div className="modal-info-label">Contact</div>
                    <div className="modal-info-value">
                      <div>{selectedMember.phone}</div>
                      <div>{selectedMember.email}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loyalty Stats */}
              <div className="loyalty-modal-section">
                <h3 className="modal-section-title">
                  <BarChart3 size={18} />
                  Loyalty Statistics
                </h3>
                <div className="loyalty-stats-grid">
                  <div className="loyalty-stat-item">
                    <div className="loyalty-stat-label">Items Purchased</div>
                    <div className="loyalty-stat-value">
                      {selectedMember.loyaltyStats.itemsPurchased} / {loyaltyRules.itemsThreshold}
                    </div>
                    <div className="loyalty-stat-progress">
                      <div 
                        className="loyalty-stat-progress-bar"
                        style={{ 
                          width: `${(selectedMember.loyaltyStats.itemsPurchased / loyaltyRules.itemsThreshold) * 100}%`,
                          backgroundColor: selectedMember.loyaltyStats.itemsPurchased >= loyaltyRules.itemsThreshold ? '#10B981' : '#F59E0B'
                        }}
                      />
                    </div>
                  </div>
                  <div className="loyalty-stat-item">
                    <div className="loyalty-stat-label">Total Orders</div>
                    <div className="loyalty-stat-value">{selectedMember.totalOrders}</div>
                  </div>
                  <div className="loyalty-stat-item">
                    <div className="loyalty-stat-label">Lifetime Value</div>
                    <div className="loyalty-stat-value">{selectedMember.totalSpent}</div>
                  </div>
                  <div className="loyalty-stat-item">
                    <div className="loyalty-stat-label">Discounts Earned</div>
                    <div className="loyalty-stat-value" style={{ color: '#10B981' }}>
                      {selectedMember.loyaltyStats.discountsEarned}
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Discount Status */}
              <div className="loyalty-modal-section highlight">
                <h3 className="modal-section-title">
                  <Gift size={18} />
                  Current Discount Status
                </h3>
                <div className="discount-status-card">
                  {getDiscountStatus(selectedMember)}
                  <div className="discount-value">
                    Available Discount: <strong>{selectedMember.discountAvailable}</strong>
                  </div>
                  {selectedMember.loyaltyStats.itemsPurchased >= loyaltyRules.itemsThreshold && (
                    <button className="loyalty-btn primary" style={{ marginTop: '16px' }}>
                      Apply 5% Discount Now
                    </button>
                  )}
                </div>
              </div>

              {/* Points Progress */}
              <div className="loyalty-modal-section">
                <h3 className="modal-section-title">Points Progress</h3>
                {getProgressBar(selectedMember)}
              </div>
            </div>

            <div className="loyalty-modal-actions">
              <button className="loyalty-btn secondary">
                <Edit size={16} />
                Edit Member
              </button>
              <button className="loyalty-btn primary">
                <Plus size={16} />
                Add Points
              </button>
              <button className="loyalty-btn danger">
                <Trash2 size={16} />
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Rules Modal */}
      {isEditRulesOpen && (
        <div className="modal-overlay">
          <div className="loyalty-modal-content">
            <button onClick={() => setIsEditRulesOpen(false)} className="modal-close">×</button>
            
            <h2 className="loyalty-modal-title">Edit Loyalty Program Rules</h2>
            
            <div className="rules-edit-form">
              <div className="form-group">
                <label>
                  <ShoppingBag size={16} />
                  Items Threshold for Discount
                </label>
                <input 
                  type="number" 
                  defaultValue={loyaltyRules.itemsThreshold}
                  min="1"
                  max="20"
                />
                <small>Number of items to purchase for discount</small>
              </div>
              
              <div className="form-group">
                <label>
                  <Percent size={16} />
                  Discount Percentage
                </label>
                <input 
                  type="number" 
                  defaultValue={loyaltyRules.discountPercentage}
                  min="1"
                  max="50"
                />
                <small>Percentage discount after threshold</small>
              </div>
              
              <div className="form-group">
                <label>
                  <Star size={16} />
                  Points per Rupee
                </label>
                <input 
                  type="number" 
                  defaultValue={loyaltyRules.pointsPerDollar}
                  min="1"
                  max="100"
                />
                <small>Points earned for each Rupee spent</small>
              </div>
              
              <div className="form-group">
                <label>
                  <Gift size={16} />
                  Birthday Bonus Points
                </label>
                <input 
                  type="number" 
                  defaultValue={loyaltyRules.birthdayBonus}
                  min="0"
                  max="1000"
                />
                <small>Points given on member's birthday</small>
              </div>
            </div>

            <div className="loyalty-modal-actions">
              <button 
                className="loyalty-btn secondary"
                onClick={() => setIsEditRulesOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="loyalty-btn primary"
                onClick={() => updateLoyaltyRules({})}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddMemberOpen && (
        <div className="modal-overlay">
          <div className="loyalty-modal-content">
            <button onClick={() => setIsAddMemberOpen(false)} className="modal-close">×</button>
            
            <h2 className="loyalty-modal-title">Add New Loyalty Member</h2>
            
            <div className="add-member-form">
              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input 
                      type="text" 
                      name="name"
                      value={newMember.name}
                      onChange={handleInputChange}
                      placeholder="John Doe" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input 
                      type="email" 
                      name="email"
                      value={newMember.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com" 
                      required 
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input 
                      type="tel" 
                      name="phone"
                      value={newMember.phone}
                      onChange={handleInputChange}
                      placeholder="+1 234 567 8900" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input 
                      type="date" 
                      name="dateOfBirth"
                      value={newMember.dateOfBirth}
                      onChange={handleInputChange}
                    />
                    <small>For birthday bonus points</small>
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h3>Loyalty Program Setup</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Initial Points</label>
                    <input 
                      type="number" 
                      name="initialPoints"
                      value={newMember.initialPoints}
                      onChange={handleInputChange}
                      min="0"
                      max="10000"
                    />
                    <small>Bonus points for joining</small>
                  </div>
                  <div className="form-group">
                    <label>Membership Tier</label>
                    <select 
                      name="tier"
                      value={newMember.tier}
                      onChange={handleInputChange}
                    >
                      <option value="bronze">Bronze</option>
                      <option value="silver">Silver</option>
                      <option value="gold">Gold</option>
                      <option value="platinum">Platinum</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Join Date</label>
                    <input 
                      type="date" 
                      name="joinDate"
                      value={newMember.joinDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Referral Code</label>
                    <input 
                      type="text" 
                      name="referralCode"
                      value={newMember.referralCode}
                      onChange={handleInputChange}
                      placeholder="REF-12345" 
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h3>Communication Preferences</h3>
                <div className="preferences-grid">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      name="preferences.email"
                      checked={newMember.preferences.email}
                      onChange={handleInputChange}
                    />
                    <span>Email notifications</span>
                  </label>
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      name="preferences.sms"
                      checked={newMember.preferences.sms}
                      onChange={handleInputChange}
                    />
                    <span>SMS notifications</span>
                  </label>
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      name="preferences.birthday"
                      checked={newMember.preferences.birthday}
                      onChange={handleInputChange}
                    />
                    <span>Birthday offers</span>
                  </label>
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      name="preferences.promotions"
                      checked={newMember.preferences.promotions}
                      onChange={handleInputChange}
                    />
                    <span>Promotional offers</span>
                  </label>
                </div>
              </div>
              
              <div className="form-section">
                <h3>Initial Purchase (Optional)</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Initial Purchase Amount</label>
                    <input 
                      type="number" 
                      name="initialPurchase"
                      value={newMember.initialPurchase}
                      onChange={handleInputChange}
                      placeholder="0.00" 
                      min="0" 
                      step="0.01" 
                    />
                    <small>To calculate initial points</small>
                  </div>
                  <div className="form-group">
                    <label>Items Purchased</label>
                    <input 
                      type="number" 
                      name="initialItems"
                      value={newMember.initialItems}
                      onChange={handleInputChange}
                      min="0"
                      max={loyaltyRules.itemsThreshold}
                    />
                    <small>For discount threshold tracking</small>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Notes</label>
                  <textarea 
                    name="notes"
                    value={newMember.notes}
                    onChange={handleInputChange}
                    placeholder="Any special notes about this member..."
                    rows="3"
                  />
                </div>
              </div>
            </div>
            
            <div className="loyalty-modal-actions">
              <button 
                className="loyalty-btn secondary"
                onClick={() => setIsAddMemberOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="loyalty-btn primary"
                onClick={handleAddMemberSubmit}
                disabled={!newMember.name || !newMember.email}
              >
                Create Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLoyalty;