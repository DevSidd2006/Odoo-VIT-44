import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const fetchAppointments = () => {
    setLoading(true);
    axios.get('http://localhost:3000/api/profile/appointments')
      .then(res => setAppointments(res.data.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchAppointments();
  }, []);

  const handleCancel = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await axios.post(`http://localhost:3000/api/appointments/${id}/cancel`);
      alert('Appointment cancelled.');
      fetchAppointments();
    } catch (err) {
      console.error(err);
      alert('Failed to cancel.');
    }
  };

  return (
    <div className="app-container animate-fade-in">
       {/* Premium Navbar */}
       <nav className="nav-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--accent)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>A</div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>Appointly</span>
          </Link>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={() => navigate('/dashboard')} className="button button-outline" style={{ fontSize: '0.875rem' }}>Back to Dashboard</button>
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <header style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Account Settings</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your profile and track your bookings</p>
        </header>
        
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
          <button 
            style={{ padding: '1rem 0', fontWeight: activeTab === 'appointments' ? 600 : 400, border: 'none', background: 'none', cursor: 'pointer', color: activeTab === 'appointments' ? '#fff' : 'var(--text-muted)', borderBottom: activeTab === 'appointments' ? '2px solid var(--accent)' : 'none' }} 
            onClick={() => setActiveTab('appointments')}
          >
            My Appointments
          </button>
          <button 
            style={{ padding: '1rem 0', fontWeight: activeTab === 'details' ? 600 : 400, border: 'none', background: 'none', cursor: 'pointer', color: activeTab === 'details' ? '#fff' : 'var(--text-muted)', borderBottom: activeTab === 'details' ? '2px solid var(--accent)' : 'none' }} 
            onClick={() => setActiveTab('details')}
          >
            Personal Details
          </button>
        </div>

        {activeTab === 'appointments' && (
          <div className="animate-fade-in">
            {loading ? <p>Loading your appointments...</p> : appointments.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', borderStyle: 'dashed' }}>
                <p style={{ color: 'var(--text-muted)' }}>No appointments found. Start by booking a service!</p>
                <button onClick={() => navigate('/dashboard')} className="button" style={{ marginTop: '1.5rem' }}>Explore Services</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {appointments.map((appt: any) => (
                  <div key={appt.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '0.25rem', 
                        fontSize: '0.7rem', 
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: appt.status === 'CONFIRMED' ? '#065f46' : appt.status === 'PENDING' ? '#1e3a8a' : '#450a0a', 
                        color: appt.status === 'CONFIRMED' ? '#34d399' : appt.status === 'PENDING' ? '#60a5fa' : '#f87171',
                        marginBottom: '0.5rem',
                        display: 'inline-block'
                      }}>
                        {appt.status}
                      </span>
                      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{appt.service.name}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>With {appt.provider.authIdentity.userProfile.fullName}</p>
                      <p style={{ marginTop: '0.75rem', fontWeight: 600, fontSize: '0.9rem' }}>📅 {new Date(appt.startTime).toLocaleString()}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {appt.status !== 'CANCELLED' && (
                        <button onClick={() => handleCancel(appt.id)} className="button" style={{ background: 'transparent', border: '1px solid #ef4444', color: '#f87171' }}>Cancel</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="glass-card animate-fade-in" style={{ maxWidth: '600px' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Update Personal Information</h3>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="label">Full Name</label>
              <input type="text" className="input" defaultValue={user?.fullName} />
            </div>
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="label">Phone Number</label>
              <input type="text" className="input" placeholder="+91 98765 43210" />
            </div>
            <button className="button">Save Changes</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
