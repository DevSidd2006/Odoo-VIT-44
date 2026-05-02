import React, { useState } from 'react';
import Navbar from '../components/Navbar';

const Profile: React.FC = () => {
  const [rescheduling, setRescheduling] = useState<number | null>(null);
  const appointments = [
    { id: 1, doctor: 'Dr. Sarah Johnson', service: 'Cardiology Consultation', date: 'May 15, 2024', time: '10:00 AM', status: 'Upcoming' },
    { id: 2, doctor: 'Dr. Michael Chen', service: 'General Checkup', date: 'May 10, 2024', time: '02:30 PM', status: 'Completed' },
  ];

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="dashboard-container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          {/* Profile Details */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Personal Details</h2>
            <div className="card">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="label">Full Name</label>
                  <input type="text" className="input" defaultValue="John Doe" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" className="input" defaultValue="john.doe@example.com" disabled />
                </div>
                <button className="button" style={{ marginTop: '1rem' }}>Update Profile</button>
              </div>
            </div>
          </div>

          {/* Appointment History */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>My Appointments</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {appointments.map((apt) => (
                <div key={apt.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span className={`badge ${apt.status === 'Upcoming' ? 'badge-blue' : 'badge-green'}`}>{apt.status}</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{apt.doctor}</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>{apt.service}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.5rem' }}>{apt.date} at {apt.time}</div>
                  </div>
                  {apt.status === 'Upcoming' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="auth-link" 
                        style={{ fontSize: '0.875rem' }}
                        onClick={() => setRescheduling(apt.id)}
                      >
                        Reschedule
                      </button>
                      <button style={{ color: 'var(--error)', fontSize: '0.875rem', fontWeight: 600 }}>Cancel</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rescheduling Modal Overlay */}
        {rescheduling && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Reschedule Appointment</h2>
              <div className="form-group">
                <label className="label">New Date</label>
                <input type="date" className="input" defaultValue="2024-05-20" />
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="label">New Time Slot</label>
                <select className="input">
                  <option>09:00 AM</option>
                  <option>10:00 AM</option>
                  <option>11:30 AM</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button className="button" onClick={() => setRescheduling(null)}>Confirm New Time</button>
                <button className="auth-link" onClick={() => setRescheduling(null)} style={{ color: 'var(--secondary)' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
