import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const BookingFlow: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    service: '',
    doctor: '',
    date: '',
    time: '',
    questions: {
      reason: '',
      history: ''
    }
  });

  const services = [
    { id: '1', name: 'General Consultation', duration: '30 min', price: '$50' },
    { id: '2', name: 'Specialist Visit', duration: '45 min', price: '$120' },
    { id: '3', name: 'Follow-up Checkup', duration: '15 min', price: '$30' },
  ];

  const doctors = [
    { id: '1', name: 'Dr. Sarah Johnson', specialty: 'Cardiologist' },
    { id: '2', name: 'Dr. Michael Chen', specialty: 'Pediatrician' },
    { id: '3', name: 'Dr. Emily White', specialty: 'Dermatologist' },
  ];

  const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleFinish = () => {
    alert('Booking Confirmed!');
    navigate('/profile');
  };

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="dashboard-container" style={{ maxWidth: '600px' }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            {[1, 2, 3, 4].map((s) => (
              <div key={s} style={{
                width: '2rem',
                height: '0.25rem',
                borderRadius: '9999px',
                background: s <= step ? 'var(--primary)' : 'var(--border)'
              }} />
            ))}
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {step === 1 && 'Select a Service'}
            {step === 2 && 'Choose a Doctor'}
            {step === 3 && 'Pick Date & Time'}
            {step === 4 && 'Complete Details'}
          </h1>
        </div>

        <div className="card animate-fade-in" style={{ padding: '2rem' }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setBookingData({ ...bookingData, service: s.name }); nextStep(); }}
                  style={{
                    padding: '1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.75rem',
                    textAlign: 'left',
                    background: bookingData.service === s.name ? '#f0f7ff' : 'white',
                    borderColor: bookingData.service === s.name ? 'var(--primary)' : 'var(--border)'
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>{s.duration} • {s.price}</div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {doctors.map((d) => (
                <button
                  key={d.id}
                  onClick={() => { setBookingData({ ...bookingData, doctor: d.name }); nextStep(); }}
                  style={{
                    padding: '1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.75rem',
                    textAlign: 'left',
                    background: bookingData.doctor === d.name ? '#f0f7ff' : 'white',
                    borderColor: bookingData.doctor === d.name ? 'var(--primary)' : 'var(--border)'
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{d.name}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>{d.specialty}</div>
                </button>
              ))}
              <button onClick={prevStep} style={{ marginTop: '1rem', color: 'var(--secondary)', fontSize: '0.875rem' }}>Back</button>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="form-group">
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input"
                  onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                />
              </div>
              <label className="label">Available Slots</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {timeSlots.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setBookingData({ ...bookingData, time: t }); nextStep(); }}
                    style={{
                      padding: '0.75rem',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      background: bookingData.time === t ? '#f0f7ff' : 'white',
                      borderColor: bookingData.time === t ? 'var(--primary)' : 'var(--border)'
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button onClick={prevStep} style={{ marginTop: '1.5rem', color: 'var(--secondary)', fontSize: '0.875rem', display: 'block', margin: '1.5rem auto 0' }}>Back</button>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="label">Number of People</label>
                <input type="number" className="input" defaultValue="1" min="1" max="10" style={{ maxWidth: '100px' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem', display: 'block' }}>Select capacity if group booking is enabled.</span>
              </div>
              <div className="form-group">
                <label className="label">Reason for Visit</label>
                <textarea
                  className="input"
                  style={{ minHeight: '100px', paddingTop: '0.75rem' }}
                  placeholder="Tell us why you're booking this appointment..."
                  onChange={(e) => setBookingData({ ...bookingData, questions: { ...bookingData.questions, reason: e.target.value } })}
                />
              </div>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--secondary)', fontWeight: 700, marginBottom: '0.5rem' }}>Summary</div>
                <div style={{ fontSize: '0.875rem' }}>
                  <strong>{bookingData.service}</strong> with <strong>{bookingData.doctor}</strong><br />
                  {bookingData.date} at {bookingData.time}
                </div>
              </div>
              <button className="button" onClick={handleFinish}>Confirm Appointment</button>
              <button onClick={prevStep} style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>Back</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingFlow;
