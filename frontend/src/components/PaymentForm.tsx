import React, { useState } from 'react';
import { paymentService } from '../api/payment.service';

interface PaymentFormProps {
  appointmentId: number;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ appointmentId, amount, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const createResult = await paymentService.createPayment(appointmentId, amount);
      if (!createResult.success) {
        setError(createResult.message || 'Failed to create payment');
        setLoading(false);
        return;
      }

      const completeResult = await paymentService.completePayment(createResult.data.paymentId);
      if (completeResult.success) {
        onSuccess();
      } else {
        setError(completeResult.message || 'Payment failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-form">
      <h3>Payment Details</h3>
      <p className="amount">Amount: ${amount.toFixed(2)}</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Card Number (mock)</label>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="4242 4242 4242 4242"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Expiry</label>
            <input
              type="text"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              placeholder="MM/YY"
              required
            />
          </div>

          <div className="form-group">
            <label>CVV</label>
            <input
              type="text"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              placeholder="123"
              required
            />
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="buttons">
          <button type="button" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className="primary">
            {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
          </button>
        </div>

        <p className="mock-note">
          <small>This is a mock payment. Any card details will work for testing.</small>
        </p>
      </form>
    </div>
  );
};

export default PaymentForm;
