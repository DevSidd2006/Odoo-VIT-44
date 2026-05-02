import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Requesting password reset for:', email);
    setSubmitted(true);
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        {!submitted ? (
          <>
            <div className="auth-header">
              <h1 className="auth-title">Forgot Password</h1>
              <p className="auth-subtitle">Enter your email and we'll send you reset instructions</p>
            </div>

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
                />
              </div>

              <button type="submit" className="button">
                Send Instructions
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div className="auth-header">
              <h1 className="auth-title">Check Your Email</h1>
              <p className="auth-subtitle">We've sent password reset instructions to <strong>{email}</strong></p>
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
