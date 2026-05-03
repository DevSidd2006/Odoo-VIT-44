import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { paymentService } from '../api/payment.service';

const PaymentPage: React.FC = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [method, setMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Card form state
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    paymentService.getPaymentByAppointment(Number(appointmentId))
      .then(res => {
        if (res.success) {
          if (res.data) {
            setPaymentData(res.data);
          } else {
            // Create new payment if none exists
            return paymentService.createPayment(Number(appointmentId), 0);
          }
        }
        return null;
      })
      .then(data => {
        if (data?.data) setPaymentData(data.data);
      })
      .catch(() => setError('Failed to load payment'))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  const handlePayment = async () => {
    setProcessing(true);
    setError(null);
    try {
      const result = await paymentService.completePayment(paymentData.paymentId);
      if (result.success) {
        navigate('/confirmation', { state: { paymentComplete: true } });
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="app-container">Loading...</div>;

  const amount = paymentData?.amount || 1000;

  return (
    <div className="app-container animate-fade-in" style={{ maxWidth: '600px' }}>
      <nav className="nav-bar">
        <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="nav-brand-icon">A</div>
          <span className="nav-brand">Appointly</span>
        </Link>
      </nav>

      <div className="payment-page">
        <h2>Payment</h2>
        
        <div className="payment-methods">
          <label className={method === 'card' ? 'active' : ''}>
            <input type="radio" checked={method === 'card'} onChange={() => setMethod('card')} />
            Credit / Debit Card
          </label>
          <label className={method === 'upi' ? 'active' : ''}>
            <input type="radio" checked={method === 'upi'} onChange={() => setMethod('upi')} />
            UPI Pay
          </label>
          <label className={method === 'paypal' ? 'active' : ''}>
            <input type="radio" checked={method === 'paypal'} onChange={() => setMethod('paypal')} />
            PayPal
          </label>
        </div>

        {method === 'card' && (
          <div className="card-form">
            <div className="form-group">
              <label>Name on Card</label>
              <input type="text" className="input" placeholder="John Doe" value={cardName} onChange={e => setCardName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Card Number</label>
              <input type="text" className="input" placeholder="...... ...... .... ...." value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Expiration Date</label>
                <input type="text" className="input" placeholder="MM/YY" value={expiry} onChange={e => setExpiry(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Security Code (CVV)</label>
                <input type="text" className="input" placeholder="123" value={cvv} onChange={e => setCvv(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {method === 'upi' && (
          <div className="upi-form">
            <div className="form-group">
              <label>UPI ID</label>
              <input type="text" className="input" placeholder="yourname@upi" />
            </div>
          </div>
        )}

        {method === 'paypal' && (
          <div className="paypal-note">
            <p>You will be redirected to PayPal to complete payment.</p>
          </div>
        )}

        <div className="order-summary">
          <h4>Order Summary</h4>
          <div className="summary-row">
            <span>Dental care</span>
            <span>₹{amount}</span>
          </div>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{amount}</span>
          </div>
          <div className="summary-row">
            <span>Taxes</span>
            <span>₹{Math.round(amount * 0.1)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>₹{amount + Math.round(amount * 0.1)}</span>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button className="button w-full" onClick={handlePayment} disabled={processing}>
          {processing ? 'Processing...' : `Pay ₹${amount + Math.round(amount * 0.1)}`}
        </button>

        <p className="mock-note">This is a mock payment. Any details will work.</p>
      </div>

      <style>{`
        .payment-page {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 2rem;
        }
        .payment-page h2 {
          margin-bottom: 1.5rem;
        }
        .payment-methods {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .payment-methods label {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
        }
        .payment-methods label.active {
          border-color: var(--accent);
          background: var(--bg-subtle);
        }
        .payment-methods input {
          margin-right: 0.5rem;
        }
        .card-form, .upi-form {
          margin-bottom: 1.5rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .order-summary {
          background: var(--bg-subtle);
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }
        .order-summary h4 {
          margin-bottom: 0.75rem;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
        }
        .summary-row.total {
          border-top: 1px solid var(--border);
          font-weight: 600;
          font-size: 1.125rem;
          margin-top: 0.5rem;
          padding-top: 0.75rem;
        }
        .error-message {
          background: #FEF2F2;
          color: #991B1B;
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }
        .mock-note {
          text-align: center;
          margin-top: 1rem;
          color: var(--text-muted);
          font-size: 0.75rem;
        }
        .paypal-note {
          text-align: center;
          padding: 2rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};

export default PaymentPage;
