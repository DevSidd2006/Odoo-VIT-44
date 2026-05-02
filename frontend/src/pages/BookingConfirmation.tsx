import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const BookingConfirmation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { appointment } = location.state || {};

  if (!appointment) {
    return (
      <div className="app-container" style={{ textAlign: 'center' }}>
        <h2>No booking found</h2>
        <Link to="/dashboard" className="button" style={{ marginTop: '1rem' }}>Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="app-container animate-fade-in" style={{ maxWidth: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>✨</div>
        <h1 className="text-gradient" style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>You're all set!</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Your appointment has been successfully scheduled and added to your calendar.</p>

        <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)', marginBottom: '2.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="label">Scheduled Time</label>
            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{new Date(appointment.startTime).toLocaleString()}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
             <div>
               <label className="label">Service ID</label>
               <div style={{ fontWeight: 600 }}>#{appointment.serviceId}</div>
             </div>
             <div>
               <label className="label">Status</label>
               <div style={{ fontWeight: 600, color: '#34d399' }}>{appointment.status}</div>
             </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <button onClick={() => navigate('/dashboard')} className="button">
            Return Home
          </button>
          <button onClick={() => navigate('/profile')} className="button button-outline">
            View My Appointments
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
