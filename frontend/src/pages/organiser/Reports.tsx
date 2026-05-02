import React from 'react';
import Navbar from '../../components/Navbar';

const Reports: React.FC = () => {
  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="dashboard-container">
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Reports & Insights</h1>
          <p style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>Data-driven analytics for clinic performance</p>
        </header>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="card">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>Peak Booking Hours</h2>
            <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '0.5rem', paddingBottom: '1rem' }}>
              {[30, 45, 60, 90, 100, 80, 50, 40].map((h, i) => (
                <div key={i} style={{ flex: 1, background: 'var(--primary)', height: `${h}%`, borderRadius: '4px 4px 0 0', opacity: h/100 }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--secondary)' }}>
              <span>9 AM</span>
              <span>12 PM</span>
              <span>3 PM</span>
              <span>6 PM</span>
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>Provider Utilization</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[
                { name: 'Dr. Sarah Johnson', value: 92 },
                { name: 'Dr. Michael Chen', value: 78 },
                { name: 'Dr. Emily White', value: 64 },
              ].map((p, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                    <span>{p.value}%</span>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${p.value}%`, height: '100%', background: 'var(--primary)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>Appointment Trends (Last 7 Days)</h2>
            <div style={{ height: '150px', background: '#f8fafc', borderRadius: '0.75rem', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}>
              Line Chart Visualization Placeholder
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
