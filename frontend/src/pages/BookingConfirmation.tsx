import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const BookingConfirmation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { appointment, service, paymentComplete } = location.state || {};
  const [, setCancelling] = useState(false);

  if (!appointment) {
    return (
      <div className="app-container" style={{ textAlign: 'center' }}>
        <h2>No booking found</h2>
        <Link to="/dashboard" className="button" style={{ marginTop: '1rem' }}>Back to Home</Link>
      </div>
    );
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    setCancelling(true);
    try {
      await axios.post(`http://localhost:3000/api/appointments/${appointment.id}/cancel`);
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to cancel appointment');
    } finally {
      setCancelling(false);
    }
  };

  const handleReschedule = () => {
    navigate(`/book/${appointment.serviceId}`, { state: { rescheduleFromId: appointment.id, oldAppointment: appointment } });
  };

  const addToGoogleCalendar = () => {
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    const format = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(service?.title || 'Appointment')}&dates=${format(start)}/${format(end)}&details=${encodeURIComponent('Booked via Appointly')}`;
    window.open(url, '_blank');
  };

  const addToOutlook = () => {
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    const url = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(service?.title || 'Appointment')}&startdt=${start.toISOString()}&enddt=${end.toISOString()}&body=${encodeURIComponent('Booked via Appointly')}`;
    window.open(url, '_blank');
  };

  const startTime = new Date(appointment.startTime);
  const endTime = new Date(appointment.endTime);
  const isManual = service?.manualConfirmation;

  return (
    <div className="app-container animate-fade-in" style={{ maxWidth: '600px' }}>
      <nav className="nav-bar">
        <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="nav-brand-icon" style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white' }}>A</div>
          <span className="nav-brand" style={{ fontWeight: 700 }}>Appointly</span>
        </Link>
      </nav>

      <div className="confirmation-card">
        <div className="confirmation-icon">{isManual ? '⏳' : '✓'}</div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: 800 }}>
          {isManual ? 'Appointment Reserved' : (paymentComplete ? 'Payment Successful!' : 'Appointment Confirmed')}
        </h1>
        <p className="confirmation-message" style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          {isManual 
            ? 'You will get a mail when organiser confirms your booking.' 
            : (service?.confirmMessage || 'Thank you for your trust we look forward to meeting you')}
        </p>

        <div className="booking-details" style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'left', border: '1px solid #334155' }}>
          <div className="detail-item" style={{ padding: '0.75rem 0', borderBottom: '1px solid #334155' }}>
            <span className="detail-label" style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Time</span>
            <span className="detail-value" style={{ fontWeight: 500 }}>{startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div className="detail-item" style={{ padding: '0.75rem 0', borderBottom: '1px solid #334155' }}>
            <span className="detail-label" style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Duration</span>
            <span className="detail-value" style={{ fontWeight: 500 }}>{Math.round((endTime.getTime() - startTime.getTime()) / 60000)} min</span>
          </div>

          {service?.manageCapacity && appointment.numPeople && (
            <div className="detail-item" style={{ padding: '0.75rem 0', borderBottom: '1px solid #334155' }}>
              <span className="detail-label" style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>No of people</span>
              <span className="detail-value" style={{ fontWeight: 500 }}>{appointment.numPeople}</span>
            </div>
          )}

          {service?.location && (
            <div className="detail-item" style={{ padding: '0.75rem 0', borderBottom: '1px solid #334155' }}>
              <span className="detail-label" style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Venue</span>
              <span className="detail-value" style={{ fontWeight: 500 }}>{service.location}</span>
            </div>
          )}
        </div>

        {!isManual && (
          <div className="calendar-buttons" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <button onClick={addToGoogleCalendar} className="button button-outline" style={{ flex: 1, padding: '0.75rem' }}>
              Google Calendar
            </button>
            <button onClick={addToOutlook} className="button button-outline" style={{ flex: 1, padding: '0.75rem' }}>
              Outlook Calendar
            </button>
          </div>
        )}

        <div className="action-buttons" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button onClick={handleReschedule} className="button" style={{ flex: 1 }}>Reschedule</button>
          <button onClick={handleCancel} className="button button-outline" style={{ flex: 1, color: '#ef4444', borderColor: '#ef4444' }}>cancel</button>
        </div>

        <div className="secondary-actions" style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.875rem' }}>Back to Home</button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
