import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';

const ServiceEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('schedule');

  const [formData, setFormData] = useState({
    name: 'Dental care',
    duration: '00:30',
    location: "Doctor's Office",
    bookType: 'User',
    assignment: 'Automatically',
    capacity: 1,
  });

  const tabs = [
    { id: 'schedule', name: 'Schedule' },
    { id: 'question', name: 'Question' },
    { id: 'options', name: 'Options' },
    { id: 'msg', name: 'Msg' },
  ];

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <button onClick={() => navigate('/admin/dashboard')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', marginBottom: '0.5rem', display: 'block' }}>← Back</button>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>{id === 'new' ? 'New Service' : 'Edit Service'}</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="button" style={{ background: '#334155', width: 'auto' }}>Preview</button>
          <button className="button" style={{ width: 'auto' }}>Publish</button>
        </div>
      </div>

      <div className="auth-card" style={{ background: '#1e293b', border: 'none' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <div className="form-group">
              <label className="label">Appointment Title</label>
              <input type="text" className="input" style={{ fontSize: '1.5rem', fontWeight: 600, background: 'transparent', borderBottom: '1px solid #334155', borderRadius: 0 }} value={formData.name} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
              <div className="form-group">
                <label className="label">Duration (hours)</label>
                <input type="text" className="input" value={formData.duration} />
              </div>
              <div className="form-group">
                <label className="label">Location</label>
                <input type="text" className="input" value={formData.location} />
              </div>
            </div>
          </div>
          
          <div style={{ border: '2px dashed #334155', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <span style={{ fontSize: '2rem' }}>🖼️</span>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>Add Picture</p>
          </div>
        </div>

        {/* Configuration Tabs */}
        <div style={{ borderBottom: '1px solid #334155', display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ 
                padding: '1rem 0', 
                background: 'none', 
                border: 'none', 
                color: activeTab === tab.id ? '#3b82f6' : '#94a3b8', 
                borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : 'none',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {activeTab === 'schedule' && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', textAlign: 'center' }}>schedule = Weekly</h3>
            <table style={{ width: '100%', color: '#94a3b8' }}>
              <tbody>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <tr key={day}>
                    <td style={{ padding: '0.5rem 0', color: '#cbd5e1' }}>{day}</td>
                    <td style={{ padding: '0.5rem 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="text" className="input" style={{ width: '80px', padding: '0.25rem' }} placeholder="9:00" />
                        <span>→</span>
                        <input type="text" className="input" style={{ width: '80px', padding: '0.25rem' }} placeholder="17:00" />
                        <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✖</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button style={{ marginTop: '1rem', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.875rem' }}>+ Add a line</button>
          </div>
        )}

        {activeTab === 'question' && (
          <div className="animate-fade-in">
            <h3 style={{ marginBottom: '1rem' }}>Booking Questions</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ padding: '1rem', border: '1px solid #334155', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Full Name</span>
                <span style={{ color: '#94a3b8' }}>Single line text</span>
              </div>
              <div style={{ padding: '1rem', border: '1px solid #334155', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Phone</span>
                <span style={{ color: '#94a3b8' }}>Phone number</span>
              </div>
            </div>
            <button className="button" style={{ marginTop: '1.5rem', width: 'auto' }}>+ Add Question</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ServiceEditor;
