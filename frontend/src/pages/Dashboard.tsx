import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const appointments = [
    { id: 1, doctor: 'Dr. Sarah Johnson', specialty: 'Cardiologist', date: 'May 15, 2024', time: '10:00 AM', status: 'Upcoming' },
    { id: 2, doctor: 'Dr. Michael Chen', specialty: 'General Practitioner', date: 'May 10, 2024', time: '2:30 PM', status: 'Completed' },
  ];

  const doctors = [
    { id: 1, name: 'Dr. Sarah Johnson', specialty: 'Cardiologist', availability: 'Next: tomorrow' },
    { id: 2, name: 'Dr. Michael Chen', specialty: 'Pediatrician', availability: 'Next: today' },
    { id: 3, name: 'Dr. Emily White', specialty: 'Dermatologist', availability: 'Next: Mon, May 12' },
  ];

  return (
    <div className="dashboard-container">
      <header className="header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Clinic Appointment Portal</h1>
          <p style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>Welcome back, {user.fullName || 'User'}</p>
        </div>
        <button onClick={handleLogout} className="auth-link" style={{ fontSize: '0.875rem', cursor: 'pointer', background: 'none', border: 'none' }}>Logout</button>
      </header>

      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Your Appointments</h2>
        <div className="grid">
          {appointments.map((apt) => (
            <div key={apt.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span className={`badge ${apt.status === 'Upcoming' ? 'badge-blue' : 'badge-green'}`}>{apt.status}</span>
                <span style={{ color: 'var(--secondary)', fontSize: '0.75rem' }}>{apt.date}</span>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{apt.doctor}</h3>
              <p style={{ color: 'var(--secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>{apt.specialty}</p>
              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{apt.time}</div>
            </div>
          ))}
          {appointments.length === 0 && (
            <p style={{ color: 'var(--secondary)', gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>No appointments found.</p>
          )}
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Available Doctors</h2>
        <div className="grid">
          {doctors.map((doc) => (
            <div key={doc.id} className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{doc.name}</h3>
              <p style={{ color: 'var(--secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>{doc.specialty}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--accent)', marginBottom: '1.5rem' }}>{doc.availability}</p>
              <button className="button">Book Appointment</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
