import React from 'react';
import Navbar from '../../components/Navbar';

const Calendar: React.FC = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dates = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="dashboard-container">
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Visual Calendar</h1>
            <p style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>View and manage all appointments in a timeline</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="input" style={{ width: 'auto', padding: '0.5rem 1rem' }}>Today</button>
            <div style={{ display: 'flex', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
              <button style={{ padding: '0.5rem 1rem', borderRight: '1px solid var(--border)', fontSize: '0.875rem' }}>Month</button>
              <button style={{ padding: '0.5rem 1rem', borderRight: '1px solid var(--border)', fontSize: '0.875rem', background: '#f8fafc' }}>Week</button>
              <button style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Day</button>
            </div>
          </div>
        </header>

        <div className="card" style={{ padding: '0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
            {days.map(day => (
              <div key={day} style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase' }}>
                {day}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {dates.map(date => (
              <div key={date} style={{ 
                height: '120px', 
                padding: '0.75rem', 
                borderRight: '1px solid var(--border)', 
                borderBottom: '1px solid var(--border)',
                position: 'relative'
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: date === 15 ? 'var(--primary)' : 'inherit' }}>{date}</span>
                
                {date === 15 && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    background: '#dbeafe', 
                    color: '#1e40af', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.65rem', 
                    fontWeight: 700 
                  }}>
                    10:00 AM - Cardiology
                  </div>
                )}
                {date === 18 && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    background: '#fef3c7', 
                    color: '#92400e', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.65rem', 
                    fontWeight: 700 
                  }}>
                    02:30 PM - General
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
