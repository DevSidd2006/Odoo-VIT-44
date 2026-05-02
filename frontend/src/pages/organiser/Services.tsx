import React, { useState } from 'react';
import Navbar from '../../components/Navbar';

const ServiceManagement: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [services, setServices] = useState([
    { id: 1, name: 'Cardiology Consultation', duration: '30 min', type: 'Specialist', status: 'Published', rules: 'Manual Confirmation' },
    { id: 2, name: 'General Checkup', duration: '15 min', type: 'General', status: 'Published', rules: 'Auto-confirm' },
  ]);

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="dashboard-container">
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Service Configuration</h1>
            <p style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>Define and manage your appointment types</p>
          </div>
          <button className="button" style={{ width: 'auto' }} onClick={() => setShowForm(true)}>+ New Service</button>
        </header>

        {showForm ? (
          <div className="card animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Create Appointment Type</h2>
              <button onClick={() => setShowForm(false)} style={{ color: 'var(--secondary)' }}>Cancel</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="label">Service Name</label>
                <input type="text" className="input" placeholder="e.g. Dental Cleaning" />
              </div>
              <div className="form-group">
                <label className="label">Duration</label>
                <select className="input">
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                  <option>45 minutes</option>
                  <option>1 hour</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Appointment Type</label>
                <select className="input">
                  <option>In-Person</option>
                  <option>Video Call</option>
                  <option>Phone Call</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Booking Rules</label>
                <select className="input">
                  <option>Auto-confirm</option>
                  <option>Manual Confirmation Required</option>
                </select>
              </div>
              
              {/* Working Hours Section */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="label">Working Hours & Availability</label>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                    <div key={day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{day}</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" className="input" defaultValue="09:00" style={{ width: '80px', padding: '0.25rem' }} />
                        <span style={{ color: 'var(--muted)' }}>to</span>
                        <input type="text" className="input" defaultValue="17:00" style={{ width: '80px', padding: '0.25rem' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="label">Questions for Patient</label>
                <textarea className="input" placeholder="Add questions separated by new lines..." style={{ minHeight: '100px' }}></textarea>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <input type="checkbox" /> Require Advance Payment
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <input type="checkbox" /> Manage Capacity (Multi-booking per slot)
                  </label>
                </div>
              </div>
            </div>
            <button className="button" style={{ marginTop: '2rem' }} onClick={() => setShowForm(false)}>Save Service</button>
          </div>
        ) : (
          <div className="grid">
            {services.map((s) => (
              <div key={s.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span className="badge badge-green">{s.status}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>ID: {s.id}</span>
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>{s.name}</h3>
                <div style={{ fontSize: '0.875rem', color: 'var(--secondary)', marginBottom: '1.5rem' }}>
                  {s.duration} • {s.type} • {s.rules}
                </div>
                <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <button className="auth-link" style={{ fontSize: '0.875rem' }} onClick={() => {
                    alert('Link copied to clipboard: http://localhost:5174/book/' + s.id);
                  }}>Copy Link</button>
                  <button className="auth-link" style={{ fontSize: '0.875rem' }}>Edit</button>
                  <button className="auth-link" style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>Unpublish</button>
                  <button className="auth-link" style={{ fontSize: '0.875rem', color: 'var(--error)' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceManagement;
