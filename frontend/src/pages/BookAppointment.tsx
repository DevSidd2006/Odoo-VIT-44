import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const BookAppointment: React.FC = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [service, setService] = useState<any>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  
  const [bookingData, setBookingData] = useState({
    providerId: null,
    date: '',
    slotId: null,
    startTime: '',
    endTime: '',
    responses: {} as Record<number, string>
  });

  useEffect(() => {
    axios.get(`http://localhost:3000/api/services/${serviceId}`)
      .then(res => {
        setService(res.data.data);
        const providerList = res.data.data.providerMappings.map((m: any) => m.provider);
        setProviders(providerList);
      })
      .catch(err => console.error(err));
  }, [serviceId]);

  const fetchSlots = (date: string) => {
    if (!bookingData.providerId) return;
    axios.get(`http://localhost:3000/api/appointments/availability`, {
      params: { providerId: bookingData.providerId, date }
    })
    .then(res => setSlots(res.data.data))
    .catch(err => console.error(err));
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const confirmBooking = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/api/appointments/book', {
        serviceId: Number(serviceId),
        providerId: bookingData.providerId,
        slotId: bookingData.slotId,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        responses: Object.entries(bookingData.responses).map(([qId, ans]) => ({
          questionId: Number(qId),
          answer: ans
        }))
      });
      navigate('/confirmation', { state: { appointment: response.data.data } });
    } catch (err) {
      console.error(err);
      alert('Error booking appointment.');
    } finally {
      setLoading(false);
    }
  };

  if (!service) return <div className="app-container">Loading...</div>;

  return (
    <div className="app-container animate-fade-in" style={{ maxWidth: '800px' }}>
      <nav className="nav-bar">
        <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '30px', height: '30px', background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>A</div>
          <span style={{ fontSize: '1rem', fontWeight: 700 }}>Appointly</span>
        </Link>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Step {step} of 4</span>
      </nav>

      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Book {service.name}</h1>
        <p style={{ color: 'var(--text-muted)' }}>{service.description}</p>
      </header>

      {/* Progress Bar */}
      <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', marginBottom: '3rem', overflow: 'hidden' }}>
        <div style={{ width: `${(step / 4) * 100}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s ease' }} />
      </div>

      {step === 1 && (
        <div className="animate-fade-in">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Select a Professional</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {providers.map(p => (
              <div key={p.id} className="glass-card" style={{ cursor: 'pointer', borderColor: bookingData.providerId === p.id ? 'var(--accent)' : undefined }} onClick={() => {
                setBookingData({ ...bookingData, providerId: p.id });
                nextStep();
              }}>
                <h3 style={{ fontSize: '1.1rem' }}>{p.authIdentity.userProfile.fullName}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{p.bio}</p>
              </div>
            ))}
          </div>
          <button style={{ marginTop: '2rem' }} className="button button-outline" onClick={() => navigate('/dashboard')}>Cancel</button>
        </div>
      )}

      {step === 2 && (
        <div className="animate-fade-in">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Choose Date & Time</h2>
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
             <label className="label">Select Date</label>
             <input type="date" className="input" onChange={(e) => {
               setBookingData({ ...bookingData, date: e.target.value });
               fetchSlots(e.target.value);
             }} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {slots.map(slot => (
              <button 
                key={slot.id} 
                className={`button ${slot.isAvailable ? '' : 'button-outline'}`}
                disabled={!slot.isAvailable}
                style={{ opacity: slot.isAvailable ? 1 : 0.5 }}
                onClick={() => {
                  setBookingData({ 
                    ...bookingData, 
                    slotId: slot.id, 
                    startTime: `${bookingData.date}T${slot.startTime}:00Z`,
                    endTime: `${bookingData.date}T${slot.endTime}:00Z`
                  });
                  nextStep();
                }}
              >
                {slot.startTime} - {slot.endTime} {!slot.isAvailable && '(Full)'}
              </button>
            ))}
          </div>
          <button style={{ marginTop: '2rem' }} className="button button-outline" onClick={prevStep}>Back</button>
        </div>
      )}

      {step === 3 && (
        <div className="animate-fade-in">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Additional Information</h2>
          <div className="glass-card">
            {service.questions.map((q: any) => (
              <div key={q.id} className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="label">{q.label} {q.isRequired && '*'}</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Your answer..."
                  required={q.isRequired}
                  onChange={(e) => setBookingData({
                    ...bookingData,
                    responses: { ...bookingData.responses, [q.id]: e.target.value }
                  })}
                />
              </div>
            ))}
            <button className="button" style={{ width: '100%' }} onClick={nextStep}>Review Booking</button>
          </div>
          <button style={{ marginTop: '1.5rem' }} className="button button-outline" onClick={prevStep}>Back</button>
        </div>
      )}

      {step === 4 && (
        <div className="animate-fade-in">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Review & Confirm</h2>
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div><label className="label">Service</label><div style={{ fontWeight: 600 }}>{service.name}</div></div>
              <div><label className="label">Provider</label><div style={{ fontWeight: 600 }}>{providers.find(p => p.id === bookingData.providerId)?.authIdentity.userProfile.fullName}</div></div>
              <div><label className="label">Time</label><div style={{ fontWeight: 600 }}>{new Date(bookingData.startTime).toLocaleString()}</div></div>
              <div><label className="label">Total Price</label><div style={{ fontSize: '1.5rem', fontWeight: 800 }}>${service.price}</div></div>
            </div>
          </div>
          
          <button className="button" style={{ width: '100%' }} onClick={confirmBooking} disabled={loading}>
            {loading ? 'Processing...' : 'Confirm & Schedule'}
          </button>
          <button style={{ marginTop: '1rem', width: '100%' }} className="button button-outline" onClick={prevStep} disabled={loading}>Back</button>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;
