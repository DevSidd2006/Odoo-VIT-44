import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

const Meetings: React.FC = () => {
  const [meetings, setMeetings] = useState<any[]>([]);

  useEffect(() => {
    // We'll reuse the profile/appointments endpoint or create a new admin one
    axios.get('http://localhost:3000/api/profile/appointments')
      .then(res => setMeetings(res.data.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <AdminLayout>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '2rem' }}>Meetings / Reporting</h1>

      <div style={{ background: '#1e293b', borderRadius: '0.75rem', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              <th style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Subject</th>
              <th style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Booked By</th>
              <th style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Resource</th>
              <th style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Start Time</th>
              <th style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {meetings.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '1rem' }}>{m.service.name}</td>
                <td style={{ padding: '1rem' }}>{m.customer.userProfile?.fullName || 'Anonymous'}</td>
                <td style={{ padding: '1rem' }}>{m.provider.authIdentity.userProfile.fullName}</td>
                <td style={{ padding: '1rem' }}>{new Date(m.startTime).toLocaleString()}</td>
                <td style={{ padding: '1rem' }}>
                   <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '0.25rem', 
                    fontSize: '0.75rem', 
                    background: m.status === 'CONFIRMED' ? '#065f46' : '#1e293b', 
                    color: m.status === 'CONFIRMED' ? '#34d399' : '#94a3b8' 
                  }}>
                    {m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default Meetings;
