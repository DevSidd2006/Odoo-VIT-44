import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    // Fetch all services for admin
    axios.get('http://localhost:3000/api/services')
      .then(res => {
        // Flattening services from categories for simple list view
        const all = res.data.data.flatMap((c: any) => c.services.map((s: any) => ({ ...s, categoryName: c.name })));
        setServices(all);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Appointments View</h1>
        <button className="button" style={{ width: 'auto', padding: '0.75rem 1.5rem' }} onClick={() => navigate('/admin/service/new')}>
          + New Service
        </button>
      </div>

      <div style={{ background: '#1e293b', borderRadius: '0.75rem', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              <th style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Service Name</th>
              <th style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Duration</th>
              <th style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Category</th>
              <th style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '1rem', fontWeight: 500 }}>{s.name}</td>
                <td style={{ padding: '1rem' }}>{s.duration} mins</td>
                <td style={{ padding: '1rem' }}>{s.categoryName}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '0.25rem', 
                    fontSize: '0.75rem', 
                    background: s.isPublished ? '#065f46' : '#450a0a', 
                    color: s.isPublished ? '#34d399' : '#f87171' 
                  }}>
                    {s.isPublished ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <button 
                    onClick={() => navigate(`/admin/service/${s.id}`)}
                    style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', marginRight: '1rem' }}
                  >
                    Edit
                  </button>
                  <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                    Share
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
