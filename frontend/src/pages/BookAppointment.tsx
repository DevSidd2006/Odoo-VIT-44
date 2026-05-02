import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api/axios.instance';
import PaymentForm from '../components/PaymentForm';

const BookAppointment: React.FC = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as any;
  const rescheduleFromId = locationState?.rescheduleFromId;
  const oldAppointment = locationState?.oldAppointment;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [service, setService] = useState<any>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  
  const [bookingData, setBookingData] = useState({
    providerId: null,
    date: '',
    slotId: null,
    startTime: '',
    endTime: '',
    numPeople: 1,
    responses: {} as Record<number, string>
  });

  const [bookingRules, setBookingRules] = useState<any>(null);
  const [createdAppointment, setCreatedAppointment] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/services/${serviceId}`);
        setService(res.data.data);
        if (res.data.data.providerMappings) {
          const providerList = res.data.data.providerMappings.map((m: any) => m.provider);
          setProviders(providerList);
        }
        
        // Fetch booking rules if needed
        try {
          const rulesRes = await api.get(`/appointment-types/${serviceId}/rules`);
          if (rulesRes.data.success && rulesRes.data.rules) {
            setBookingRules(rulesRes.data.rules);
          }
        } catch (rulesErr) {
          console.warn('Booking rules not found, using defaults');
        }
      } catch (err) {
        console.error('Error fetching service:', err);
      } finally {
        setLoading(false);
      }
    };

    if (serviceId) fetchServiceData();
  }, [serviceId]);

  const fetchSlots = (date: string) => {
    if (!service || !bookingData.providerId) return;
    setSlotsLoading(true);
    api.get(`/appointments/availability`, {
      params: { providerId: bookingData.providerId, serviceId: serviceId, date }
    })
    .then(res => setSlots(res.data.data || []))
    .catch(err => console.error(err))
    .finally(() => setSlotsLoading(false));
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const confirmBooking = async () => {
    setLoading(true);
    try {
      let response;
      const combinedStartTime = new Date(`${bookingData.date}T${bookingData.startTime}`);
      const combinedEndTime = new Date(`${bookingData.date}T${bookingData.endTime}`);

      if (rescheduleFromId) {
        response = await api.post(`/appointments/${rescheduleFromId}/reschedule`, {
          newSlotId: bookingData.slotId,
          newStartTime: combinedStartTime.toISOString(),
          newEndTime: combinedEndTime.toISOString(),
        });
      } else {
        response = await api.post('/appointments/book', {
          serviceId: Number(serviceId),
          providerId: bookingData.providerId,
          slotId: bookingData.slotId,
          startTime: combinedStartTime.toISOString(),
          endTime: combinedEndTime.toISOString(),
          numPeople: bookingData.numPeople,
          responses: Object.entries(bookingData.responses).map(([qId, ans]) => ({
            questionId: Number(qId),
            answer: ans
          }))
        });
      }

      const appointment = response.data.data;
      
      if (bookingRules?.advancePayment) {
        setCreatedAppointment(appointment);
        setShowPayment(true);
      } else {
        navigate('/confirmation', { state: { appointment, service } });
      }
    } catch (err) {
      console.error(err);
      alert('Error booking appointment.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !service) return <div className="app-container">Loading service details...</div>;
  if (!service) return <div className="app-container">Service not found. <Link to="/dashboard">Back to Home</Link></div>;

  if (showPayment && createdAppointment) {
    const paymentAmount = bookingRules?.paymentPercentage
      ? Number(service.price) * (bookingRules.paymentPercentage / 100)
      : Number(service.price);

    return (
      <div className="app-container animate-fade-in">
        <PaymentForm 
          appointmentId={createdAppointment.id}
          amount={paymentAmount}
          onSuccess={() => navigate('/confirmation', { state: { appointment: createdAppointment, service } })}
          onCancel={() => setShowPayment(false)}
        />
      </div>
    );
  }

  return (
    <div className="app-container animate-fade-in">
      <nav className="nav-bar">
        <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: '0.9rem' }}>A</div>
          <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>Appointly</span>
        </Link>
      </nav>

      {/* Progress Stepper */}
      <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '400px', margin: '3rem auto', position: 'relative' }}>
         {[1, 2, 3, 4].map(s => (
           <div key={s} style={{ 
             width: '32px', 
             height: '32px', 
             borderRadius: '50%', 
             background: step >= s ? 'var(--accent)' : 'white', 
             color: step >= s ? 'white' : 'var(--text-muted)',
             border: `2px solid ${step >= s ? 'var(--accent)' : 'var(--border)'}`,
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             fontSize: '0.875rem',
             fontWeight: 800,
             zIndex: 2
           }}>
             {s}
           </div>
         ))}
         <div style={{ position: 'absolute', top: '16px', left: 0, right: 0, height: '2px', background: 'var(--border)', zIndex: 1 }}></div>
      </div>

      {step === 1 && (
        <div className="glass-card animate-slide-up" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Select Provider</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Choose who you'd like to book with for {service.name}.</p>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {providers.length > 0 ? providers.map(p => (
              <button 
                key={p.id}
                onClick={() => {
                   setBookingData(prev => ({ ...prev, providerId: p.id }));
                   nextStep();
                }}
                className="glass-card"
                style={{ textAlign: 'left', padding: '1.5rem', border: bookingData.providerId === p.id ? '2px solid var(--accent)' : '1px solid var(--border)', background: bookingData.providerId === p.id ? '#f5f3ff' : 'white', cursor: 'pointer' }}
              >
                <div style={{ fontWeight: 700 }}>{p.authIdentity.userProfile.fullName}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{p.bio || 'Professional Provider'}</div>
              </button>
            )) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                 <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>No specific providers assigned. You can proceed with general booking.</p>
                 <button className="button" onClick={() => {
                   const defaultProviderId = service.providerMappings?.[0]?.provider?.id;
                   setBookingData(prev => ({ ...prev, providerId: defaultProviderId }));
                   nextStep();
                 }}>Proceed</button>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="glass-card animate-slide-up" style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2.5rem' }}>
            {rescheduleFromId ? 'Reschedule your appointment' : 'Select Date & Time'}
          </h2>
          {rescheduleFromId && oldAppointment && (
            <div style={{ padding: '1rem', background: '#1e293b', borderRadius: '0.5rem', marginBottom: '2rem', border: '1px solid #334155' }}>
               <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Current reservation</p>
               <p style={{ fontWeight: 600 }}>{new Date(oldAppointment.startTime).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })} - {new Date(oldAppointment.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
             <div>
                <label className="label">Preferred Date</label>
                <input 
                  type="date" 
                  className="input" 
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setBookingData({ ...bookingData, date: e.target.value });
                    fetchSlots(e.target.value);
                  }}
                />
             </div>
             <div>
                <label className="label">Available Slots</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
                   {slotsLoading ? (
                     <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', gridColumn: 'span 2' }}>Loading slots...</p>
                   ) : slots.length > 0 ? slots.map(slot => (
                     <button 
                       key={slot.id}
                       disabled={!slot.isAvailable}
                       onClick={() => setBookingData(prev => ({ ...prev, slotId: slot.id, startTime: slot.startTime, endTime: slot.endTime }))}
                       style={{ 
                         padding: '0.75rem', 
                         borderRadius: '0.5rem', 
                         border: bookingData.slotId === slot.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                         background: !slot.isAvailable ? '#f9fafb' : bookingData.slotId === slot.id ? '#f5f3ff' : 'white',
                         color: !slot.isAvailable ? '#94a3b8' : 'inherit',
                         cursor: slot.isAvailable ? 'pointer' : 'not-allowed',
                         fontSize: '0.875rem',
                         fontWeight: 600
                       }}
                     >
                       {slot.startTime}
                     </button>
                   )) : bookingData.date ? (
                     <p style={{ fontSize: '0.875rem', color: '#ef4444', gridColumn: 'span 2' }}>No slots available for this date.</p>
                   ) : (
                     <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', gridColumn: 'span 2' }}>Select a date to see slots</p>
                   )}
                </div>

                {service.manageCapacity && (
                  <div>
                    <label className="label">Number of people</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <button 
                        className="button button-outline" 
                        style={{ width: '40px', padding: 0 }}
                        onClick={() => setBookingData(prev => ({ ...prev, numPeople: Math.max(1, prev.numPeople - 1) }))}
                      >-</button>
                      <span style={{ fontWeight: 600, width: '20px', textAlign: 'center' }}>{bookingData.numPeople}</span>
                      <button 
                        className="button button-outline" 
                        style={{ width: '40px', padding: 0 }}
                        onClick={() => setBookingData(prev => ({ ...prev, numPeople: Math.min(service.capacityLimit || 10, prev.numPeople + 1) }))}
                      >+</button>
                    </div>
                  </div>
                )}
             </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
            <button className="button button-outline" onClick={prevStep}>Back</button>
            <button className="button" onClick={nextStep} disabled={!bookingData.slotId}>Next Step</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="glass-card animate-slide-up" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Additional Information</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Please answer a few questions to help us prepare.</p>
          
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {service.questions?.map((q: any) => (
              <div key={q.id}>
                <label className="label">{q.questionText} {q.isRequired && '*'}</label>
                <input 
                  type="text" 
                  className="input" 
                  required={q.isRequired}
                  placeholder="Your answer..."
                  onChange={(e) => setBookingData({
                    ...bookingData,
                    responses: { ...bookingData.responses, [q.id]: e.target.value }
                  })}
                />
              </div>
            ))}
            {(!service.questions || service.questions.length === 0) && (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No additional information required for this service.</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
            <button className="button button-outline" onClick={prevStep}>Back</button>
            <button className="button" onClick={nextStep}>Review & Confirm</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
              <div className="glass-card animate-slide-up" style={{ padding: '3rem' }}>
                 <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>Payment screen</h2>
                 
                 <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Choose a payment method</h3>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                       <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', border: '2px solid var(--accent)', borderRadius: '0.5rem', background: '#f5f3ff', cursor: 'pointer' }}>
                          <input type="radio" name="paymentMethod" defaultChecked /> Credit Card
                       </label>
                       <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', cursor: 'pointer' }}>
                          <input type="radio" name="paymentMethod" /> Debit Card
                       </label>
                       <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', cursor: 'pointer' }}>
                          <input type="radio" name="paymentMethod" /> UPI Pay
                       </label>
                       <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', cursor: 'pointer' }}>
                          <input type="radio" name="paymentMethod" /> Paypal
                       </label>
                    </div>
                 </div>

                 <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div className="form-group">
                       <label className="label">Name on Card</label>
                       <input type="text" className="input" placeholder="Placeholder" />
                    </div>
                    <div className="form-group">
                       <label className="label">Card Number</label>
                       <input type="text" className="input" placeholder="....... ...... .... ....." />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div className="form-group">
                        <label className="label">Expiration Date</label>
                        <input type="text" className="input" placeholder="MM/YY" />
                      </div>
                      <div className="form-group">
                        <label className="label">Security Code (CVV)</label>
                        <input type="text" className="input" placeholder="CVV" />
                      </div>
                    </div>
                 </div>
              </div>

              <div className="glass-card animate-slide-up" style={{ padding: '2rem', height: 'fit-content' }}>
                 <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Order Summary</h2>
                 <div style={{ display: 'grid', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                       <span style={{ fontWeight: 600 }}>{service.name}</span>
                       <span>₹{service.price * bookingData.numPeople}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#64748b' }}>
                       <span>Subtotal</span>
                       <span>₹{service.price * bookingData.numPeople}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#64748b' }}>
                       <span>Taxes</span>
                       <span>₹{Math.round(service.price * bookingData.numPeople * 0.1)}</span>
                    </div>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.125rem', marginBottom: '2rem' }}>
                    <span>Total</span>
                    <span>₹{service.price * bookingData.numPeople + Math.round(service.price * bookingData.numPeople * 0.1)}</span>
                 </div>
                 <button onClick={confirmBooking} className="button" style={{ width: '100%', height: '48px' }} disabled={loading}>
                   {loading ? 'Processing...' : 'Pay Now'}
                 </button>
                 <button style={{ marginTop: '1rem', width: '100%' }} className="button button-outline" onClick={prevStep} disabled={loading}>Back</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;
