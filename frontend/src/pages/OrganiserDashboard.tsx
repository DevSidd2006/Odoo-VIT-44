import React from 'react';
import Navbar from '../components/Navbar';

const OrganiserDashboard: React.FC = () => {
  const stats = [
    { label: 'Total Appointments', value: '124', change: '+12%', color: 'var(--primary)' },
    { label: 'Active Providers', value: '8', change: 'Stable', color: 'var(--success)' },
    { label: 'Avg. Utilization', value: '82%', change: '+5%', color: 'var(--accent)' },
  ];

  const recentBookings = [
    { id: 1, customer: 'Alice Freeman', service: 'Cardiology', provider: 'Dr. Sarah Johnson', time: '10:30 AM', status: 'Confirmed' },
    { id: 2, customer: 'Bob Smith', service: 'General Checkup', provider: 'Dr. Michael Chen', time: '11:15 AM', status: 'Pending' },
    { id: 3, customer: 'Charlie Brown', service: 'Dermatology', provider: 'Dr. Emily White', time: '12:00 PM', status: 'Confirmed' },
  ];

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="dashboard-container">
        <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Organiser Command Center</h1>
            <p style={{ color: 'var(--secondary)' }}>System-level monitoring and configuration</p>
          </div>
          <button className="button" style={{ width: 'auto', padding: '0.75rem 1.5rem' }}>
            + Create Appointment Type
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid" style={{ marginBottom: '3rem' }}>
          {stats.map((stat, i) => (
            <div key={i} className="card" style={{ borderLeft: `4px solid ${stat.color}` }}>
              <div style={{ color: 'var(--secondary)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>{stat.label}</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>{stat.value}</div>
              <div style={{ fontSize: '0.75rem', color: stat.change.includes('+') ? 'var(--success)' : 'var(--secondary)', fontWeight: 600 }}>
                {stat.change} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>vs last month</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Recent Bookings Table */}
          <div className="card" style={{ padding: '0' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Recent Bookings</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase' }}>Customer</th>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase' }}>Service</th>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase' }}>Provider</th>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase' }}>Time</th>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>{b.customer}</td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>{b.service}</td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--secondary)' }}>{b.provider}</td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 500 }}>{b.time}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span className={`badge ${b.status === 'Confirmed' ? 'badge-green' : 'badge-blue'}`}>{b.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Config Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem' }}>Resources</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem' }}>Dr. Sarah Johnson</span>
                  <span className="badge badge-green">Online</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem' }}>Dr. Michael Chen</span>
                  <span className="badge badge-blue">On Leave</span>
                </div>
                <button className="auth-link" style={{ fontSize: '0.875rem', textAlign: 'left', marginTop: '0.5rem' }}>Manage all resources →</button>
              </div>
            </div>

            <div className="card" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', color: 'white' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.75rem' }}>System Health</h2>
              <p style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '1.25rem' }}>All services are operational. SMS and Email gateways are active.</p>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}>
                <div style={{ width: '100%', height: '100%', background: 'white', borderRadius: '2px' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganiserDashboard;
