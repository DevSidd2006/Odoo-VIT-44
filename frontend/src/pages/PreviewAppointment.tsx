import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const PreviewAppointment: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios.get(`http://localhost:3000/api/appointment-types/${id}/preview`)
      .then(res => {
        if (res.data.success) {
          setAppointment(res.data.data);
        } else {
          setError(res.data.message);
        }
      })
      .catch(() => setError('Failed to load preview'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="app-container">Loading preview...</div>;
  if (error) return (
    <div className="app-container">
      <p className="text-error">{error}</p>
      <Link to="/admin/services" className="button button-secondary">Back to Services</Link>
    </div>
  );

  return (
    <div className="app-container animate-fade-in" style={{ maxWidth: '800px' }}>
      <nav className="nav-bar">
        <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="nav-brand-icon">A</div>
          <span className="nav-brand">Appointly</span>
        </Link>
      </nav>

      <div className="preview-container">
        <div className="preview-header">
          <span className="badge badge-info">Preview Mode</span>
          <h1>{appointment?.title}</h1>
        </div>

        {appointment?.introMessage && (
          <div className="preview-section">
            <p>{appointment.introMessage}</p>
          </div>
        )}

        <div className="preview-details">
          <div className="detail-row">
            <span className="detail-label">Duration</span>
            <span className="detail-value">{appointment?.durationMinutes} minutes</span>
          </div>
          
          {appointment?.location && (
            <div className="detail-row">
              <span className="detail-label">Location</span>
              <span className="detail-value">{appointment.location}</span>
            </div>
          )}

          {appointment?.manageCapacity && (
            <div className="detail-row">
              <span className="detail-label">Capacity</span>
              <span className="detail-value">{appointment.capacityLimit} people</span>
            </div>
          )}

          <div className="detail-row">
            <span className="detail-label">Type</span>
            <span className="detail-value">{appointment?.type === 'resource' ? 'Resource-based' : 'User-based'}</span>
          </div>
        </div>

        <div className="preview-actions">
          <Link to={`/book/${id}`} className="button">Book Now</Link>
          <button onClick={() => navigate(-1)} className="button button-outline">Close Preview</button>
        </div>
      </div>

      <style>{`
        .preview-container {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 2rem;
        }
        .preview-header {
          margin-bottom: 1.5rem;
        }
        .preview-header h1 {
          margin-top: 0.75rem;
          font-size: 1.75rem;
        }
        .preview-section {
          background: var(--bg-subtle);
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }
        .preview-section p {
          margin: 0;
          line-height: 1.6;
        }
        .preview-details {
          margin-bottom: 2rem;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border);
        }
        .detail-label {
          color: var(--text-muted);
        }
        .detail-value {
          font-weight: 500;
        }
        .preview-actions {
          display: flex;
          gap: 1rem;
        }
        .text-error {
          color: #991B1B;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
};

export default PreviewAppointment;
