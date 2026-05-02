import React, { useState } from 'react';
import Navbar from '../../components/Navbar';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Customer', status: 'Active' },
    { id: 2, name: 'Dr. Sarah Johnson', email: 'sarah@clinic.com', role: 'Provider', status: 'Active' },
    { id: 3, name: 'Admin User', email: 'admin@appointly.com', role: 'Admin', status: 'Active' },
    { id: 4, name: 'Inactive User', email: 'old@example.com', role: 'Customer', status: 'Inactive' },
  ]);

  const toggleStatus = (id: number) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u));
  };

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="dashboard-container">
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>User & Role Management</h1>
          <p style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>Global control over system users and access levels</p>
        </header>

        <div className="card" style={{ padding: '0' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem' }}>
            <input type="text" className="input" placeholder="Search users by name or email..." style={{ maxWidth: '400px' }} />
            <select className="input" style={{ maxWidth: '200px' }}>
              <option>All Roles</option>
              <option>Customer</option>
              <option>Provider</option>
              <option>Admin</option>
            </select>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase' }}>User</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase' }}>Role</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{u.role}</span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span className={`badge ${u.status === 'Active' ? 'badge-green' : 'badge-blue'}`} style={{ opacity: u.status === 'Active' ? 1 : 0.6 }}>
                      {u.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => toggleStatus(u.id)}
                      style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        color: u.status === 'Active' ? 'var(--error)' : 'var(--success)',
                        marginRight: '1rem'
                      }}
                    >
                      {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>Edit Role</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
