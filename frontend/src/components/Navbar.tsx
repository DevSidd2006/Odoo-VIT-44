import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav style={{
      background: 'var(--card)',
      borderBottom: '1px solid var(--border)',
      padding: '0.75rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
        <Link to="/dashboard" style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          color: 'var(--primary)',
          letterSpacing: '-0.025em',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>🗓️</span> Appointly
        </Link>
        
        {/* View Switcher for Testing */}
        <div style={{ 
          display: 'flex', 
          background: '#f1f5f9', 
          padding: '0.25rem', 
          borderRadius: '0.75rem',
          border: '1px solid var(--border)'
        }}>
          {[
            { label: 'Patient', path: '/dashboard' },
            { label: 'Organiser', path: '/organiser' },
            { label: 'Admin', path: '/admin' }
          ].map((view) => (
            <Link 
              key={view.path}
              to={view.path} 
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.4rem 1rem',
                borderRadius: '0.5rem',
                color: location.pathname.startsWith(view.path) ? 'white' : 'var(--secondary)',
                background: location.pathname.startsWith(view.path) ? 'var(--primary)' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              {view.label}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {location.pathname.startsWith('/organiser') ? (
            <>
              <Link to="/organiser/services" style={{ fontSize: '0.875rem', fontWeight: 500, color: isActive('/organiser/services') ? 'var(--primary)' : 'var(--secondary)' }}>Services</Link>
              <Link to="/organiser/calendar" style={{ fontSize: '0.875rem', fontWeight: 500, color: isActive('/organiser/calendar') ? 'var(--primary)' : 'var(--secondary)' }}>Calendar</Link>
              <Link to="/organiser/reports" style={{ fontSize: '0.875rem', fontWeight: 500, color: isActive('/organiser/reports') ? 'var(--primary)' : 'var(--secondary)' }}>Reports</Link>
            </>
          ) : location.pathname.startsWith('/admin') ? (
            <>
              <Link to="/admin/users" style={{ fontSize: '0.875rem', fontWeight: 500, color: isActive('/admin/users') ? 'var(--primary)' : 'var(--secondary)' }}>User Management</Link>
              <Link to="/admin/settings" style={{ fontSize: '0.875rem', fontWeight: 500, color: isActive('/admin/settings') ? 'var(--primary)' : 'var(--secondary)' }}>Settings</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" style={{ fontSize: '0.875rem', fontWeight: 500, color: isActive('/dashboard') ? 'var(--primary)' : 'var(--secondary)' }}>Home</Link>
              <Link to="/profile" style={{ fontSize: '0.875rem', fontWeight: 500, color: isActive('/profile') ? 'var(--primary)' : 'var(--secondary)' }}>My Appointments</Link>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button onClick={() => window.location.href = '/login'} style={{ fontSize: '0.875rem', color: 'var(--secondary)', fontWeight: 500 }}>Logout</button>
        <div style={{
          width: '2.25rem',
          height: '2.25rem',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          border: '2px solid white',
          boxShadow: 'var(--shadow)'
        }} />
      </div>
    </nav>
  );
};

export default Navbar;
