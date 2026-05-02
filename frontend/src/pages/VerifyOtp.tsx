import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../api/auth.service';

const VerifyOtp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email') || '';
  const type = queryParams.get('type') || 'signup';

  useEffect(() => {
    if (!email) {
      // If no email, redirect back to signup or login
      navigate('/signup');
    }
  }, [email, navigate]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    setError('');
    setLoading(true);
    try {
      await authService.verifyOtp({ email, otp: otpValue, type });
      if (type === 'reset') {
        // Since there's no ResetPassword page yet, we just go to login
        // In a real app, you'd navigate to /reset-password
        alert('Verified! Please use the reset link or contact support (Reset UI pending).');
        navigate('/login');
      } else {
        alert('Email verified successfully!');
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authService.resendOtp({ email, type });
      alert('New OTP sent to your email.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to resend OTP.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        <div className="auth-header">
          <h1 className="auth-title">Verify Email</h1>
          <p className="auth-subtitle">We've sent a 6-digit code to <strong>{email}</strong></p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="otp-inputs">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                className="otp-input"
                value={digit}
                ref={(el) => (inputRefs.current[index] = el)}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                required
                disabled={loading}
              />
            ))}
          </div>

          <button type="submit" className="button" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <div className="auth-footer">
          Didn't receive the code?
          <button className="auth-link" onClick={handleResend} disabled={loading}>
            Resend
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
