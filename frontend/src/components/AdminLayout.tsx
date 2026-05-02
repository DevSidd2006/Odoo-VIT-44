import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Appointments', path: '/admin/dashboard', icon: '📅' },
    { name: 'Meetings', path: '/admin/meetings', icon: '👥' },
    { name: 'Settings', path: '/admin/settings', icon: '⚙️' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', color: '#f8fafc' }}>
      {/* Sidebar */}
      <div style={{ width: '260px', borderRight: '1px solid #1e293b', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ padding: '0.5rem', background: '#3b82f6', borderRadius: '0.5rem' }}>A</span>
          Appointly Admin
        </div>
        
        <nav style={{ flexGrow: 1 }}>
          {menuItems.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                padding: '0.75rem 1rem', 
                borderRadius: '0.5rem', 
                textDecoration: 'none', 
                color: location.pathname === item.path ? '#fff' : '#94a3b8',
                background: location.pathname === item.path ? '#1e293b' : 'transparent',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              <span>{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        <button 
          onClick={() => navigate('/login')}
          style={{ 
            marginTop: 'auto', 
            background: 'none', 
            border: 'none', 
            color: '#ef4444', 
            cursor: 'pointer', 
            textAlign: 'left', 
            padding: '1rem',
            fontSize: '0.875rem'
          }}
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flexGrow: 1, padding: '2rem', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
