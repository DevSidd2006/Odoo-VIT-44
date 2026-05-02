import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const doctors = [
    { id: 1, name: 'Dr. Sarah Johnson', specialty: 'Cardiologist', availability: 'Next: tomorrow', image: 'SJ' },
    { id: 2, name: 'Dr. Michael Chen', specialty: 'Pediatrician', availability: 'Next: today', image: 'MC' },
    { id: 3, name: 'Dr. Emily White', specialty: 'Dermatologist', availability: 'Next: Mon, May 12', image: 'EW' },
  ];

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="dashboard-container">
        <header style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
            Find your specialist
          </h1>
          <p style={{ color: 'var(--secondary)', fontSize: '1.125rem' }}>
            Book clinical appointments with the best doctors in your area.
          </p>
        </header>

        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Featured Doctors
            <span style={{ fontSize: '0.75rem', fontWeight: 500, background: '#fef3c7', color: '#92400e', padding: '0.125rem 0.5rem', borderRadius: '4px' }}>Top Rated</span>
          </h2>
          <div className="grid">
            {doctors.map((doc) => (
              <div key={doc.id} className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '3.5rem',
                    height: '3.5rem',
                    borderRadius: '1rem',
                    background: 'var(--background)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    border: '1px solid var(--border)'
                  }}>
                    {doc.image}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{doc.name}</h3>
                    <p style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>{doc.specialty}</p>
                  </div>
                </div>
                <div style={{ marginTop: 'auto' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 0',
                    borderTop: '1px solid var(--border)',
                    marginBottom: '1rem'
                  }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>Availability</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--success)' }}>{doc.availability}</span>
                  </div>
                  <button className="button" onClick={() => navigate('/book')}>Book Appointment</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div style={{ background: 'var(--primary)', padding: '3rem', borderRadius: '1.5rem', color: 'white', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Need help finding a specialist?</h2>
            <p style={{ opacity: 0.9, marginBottom: '2rem' }}>Our healthcare assistants are available 24/7 to guide you.</p>
            <button style={{ background: 'white', color: 'var(--primary)', padding: '0.75rem 2rem', borderRadius: '0.75rem', fontWeight: 700 }}>
              Chat with Assistant
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
