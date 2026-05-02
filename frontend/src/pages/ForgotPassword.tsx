import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../api/auth.service';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword({ email });
      setSubmitted(true);
      // Redirect to OTP verification after a short delay
      setTimeout(() => {
        navigate(`/verify-otp?email=${encodeURIComponent(email)}&type=reset`);
      }, 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        {!submitted ? (
          <>
            <div className="auth-header">
              <h1 className="auth-title">Forgot Password</h1>
              <p className="auth-subtitle">Enter your email and we'll send you a reset code</p>
            </div>

            {error && (
              <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label">Email Address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <button type="submit" className="button" disabled={loading}>
                {loading ? 'Sending Code...' : 'Send Reset Code'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div className="auth-header">
              <h1 className="auth-title">Check Your Email</h1>
              <p className="auth-subtitle">We've sent a password reset code to <strong>{email}</strong></p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '1rem' }}>Redirecting to verification page...</p>
            </div>
            <button onClick={() => setSubmitted(false)} className="button">
              Try another email
            </button>
          </div>
        )}

        <div className="auth-footer">
          Back to
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
