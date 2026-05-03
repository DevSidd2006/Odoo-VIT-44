import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';

const ServiceEditor: React.FC = () => {
  const params = useParams();
  const id = params.id;
  void id; // Used in API calls
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('schedule');
  const [scheduleType, setScheduleType] = useState('weekly');
  const [bookType, setBookType] = useState('user');

  const [formData, setFormData] = useState({
    name: 'Dental care',
    duration: '00:30',
    location: "Doctor's Office",
    assignment: 'Automatically',
    manageCapacity: true,
    capacity: 1,
    manualConfirmation: true,
    paidBooking: true,
    bookingFee: 200,
    cancellationCutoff: 1,
    introMessage: 'Schedule your visit today and experience expert dental care brought right to your doorstep.',
    confirmMessage: 'Thank you for your trust we look forward to meeting you',
  });

  const tabs = [
    { id: 'schedule', name: 'Schedule' },
    { id: 'question', name: 'Question' },
    { id: 'options', name: 'Options' },
    { id: 'misc', name: 'Misc' },
  ];

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <button onClick={() => navigate('/admin/dashboard')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', marginBottom: '0.5rem', display: 'block', fontSize: '0.875rem' }}>New &gt; Meetings</button>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Appointment Form View</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="button" style={{ background: '#334155', width: 'auto' }}>Preview</button>
          <button className="button" style={{ width: 'auto' }}>Publish</button>
        </div>
      </div>

      <div className="auth-card" style={{ background: '#1e293b', border: 'none', padding: '2rem' }}>
        {/* Top Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* Left Panel */}
          <div>
            <div className="form-group">
              <label className="label">Appointment title</label>
              <input type="text" className="input" style={{ fontSize: '1.5rem', fontWeight: 600, background: 'transparent', borderBottom: '1px solid #334155', borderRadius: 0 }} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            
            <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', alignItems: 'flex-start' }}>
              <div style={{ border: '2px dashed #334155', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100px', height: '100px', position: 'relative' }}>
                <span style={{ fontSize: '2rem' }}>🖼️</span>
                <button style={{ position: 'absolute', top: 5, right: 5, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ flex: 1, display: 'grid', gap: '1rem' }}>
                <div className="form-group">
                  <label className="label">Duration (Hours)</label>
                  <input type="text" className="input" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="label">Location</label>
                  <input type="text" className="input" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '0.25rem', display: 'block' }}>If Location is not set, consider it an Online Appointment</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Panel */}
          <div style={{ borderLeft: '1px solid #334155', paddingLeft: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid #334155', marginBottom: '1rem' }}>
                <span style={{ marginRight: '1rem', color: '#94a3b8' }}>Book</span>
                <button onClick={() => setBookType('user')} style={{ background: 'none', border: 'none', borderBottom: bookType === 'user' ? '2px solid #3b82f6' : 'none', color: bookType === 'user' ? 'white' : '#94a3b8', padding: '0.5rem', cursor: 'pointer' }}>User</button>
                <button onClick={() => setBookType('resources')} style={{ background: 'none', border: 'none', borderBottom: bookType === 'resources' ? '2px solid #3b82f6' : 'none', color: bookType === 'resources' ? 'white' : '#94a3b8', padding: '0.5rem', cursor: 'pointer' }}>Resources</button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {bookType === 'user' ? (
                  <>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>A1</div>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>A2</div>
                  </>
                ) : (
                  <>
                    <div style={{ width: '32px', height: '32px', borderRadius: '0.25rem', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>R1</div>
                    <div style={{ width: '32px', height: '32px', borderRadius: '0.25rem', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>R2</div>
                  </>
                )}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="label">Assignment</label>
              <select className="input" value={formData.assignment} onChange={(e) => setFormData({...formData, assignment: e.target.value})}>
                <option>Automatically</option>
                <option>By visitor</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                <input type="checkbox" checked={formData.manageCapacity} onChange={(e) => setFormData({...formData, manageCapacity: e.target.checked})} />
                Manage capacity
              </label>
              {formData.manageCapacity && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>
                  Allow <input type="number" className="input" style={{ width: '60px', padding: '0.25rem', textAlign: 'center' }} value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})} /> Simultaneous Appointment(s) per user
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Configuration Tabs */}
        <div style={{ borderBottom: '1px solid #334155', display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ 
                padding: '1rem 0', 
                background: 'none', 
                border: 'none', 
                color: activeTab === tab.id ? '#3b82f6' : '#94a3b8', 
                borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : 'none',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {activeTab === 'schedule' && (
          <div className="animate-fade-in" style={{ padding: '1rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <label className="label" style={{ margin: 0 }}>Schedule</label>
              <select className="input" style={{ width: 'auto' }} value={scheduleType} onChange={(e) => setScheduleType(e.target.value)}>
                <option value="weekly">Weekly</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
            
            {scheduleType === 'weekly' ? (
              <>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', textAlign: 'center', color: '#94a3b8' }}>schedule = Weekly</h3>
                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>(only applicable for weekly schedule)</p>
                <table style={{ width: '100%', color: '#94a3b8' }}>
                  <tbody>
                    {['Monday', 'Monday', 'Tuesday', 'Tuesday', 'Wednesday', 'Wednesday', 'Thursday', 'Thursday', 'Friday', 'Friday'].map((day, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '0.75rem 0', color: '#cbd5e1', width: '150px' }}>{day}</td>
                        <td style={{ padding: '0.75rem 0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input type="text" className="input" style={{ width: '100px' }} defaultValue={i % 2 === 0 ? "9:00" : "14:00"} />
                            <span>→</span>
                            <input type="text" className="input" style={{ width: '100px' }} defaultValue={i % 2 === 0 ? "12:00" : "17:00"} />
                            <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button style={{ marginTop: '1rem', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.875rem' }}>+ Add a Line</button>
              </>
            ) : (
              <>
                 <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', textAlign: 'center', color: '#94a3b8' }}>schedule = flexible</h3>
                 <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#334155', padding: '1rem', borderRadius: '0.5rem' }}>
                       <input type="text" className="input" defaultValue="Apr 28, 11:00 AM" style={{ width: '200px' }} />
                       <span>→</span>
                       <input type="text" className="input" defaultValue="Apr 30, 12:00 PM" style={{ width: '200px' }} />
                       <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>🗑️</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#334155', padding: '1rem', borderRadius: '0.5rem' }}>
                       <input type="text" className="input" defaultValue="Dec 12, 11:00 AM" style={{ width: '200px' }} />
                       <span>→</span>
                       <input type="text" className="input" defaultValue="Dec 15, 12:00 PM" style={{ width: '200px' }} />
                       <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>🗑️</button>
                    </div>
                 </div>
                 <button style={{ marginTop: '1rem', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.875rem' }}>+ Add Date Range</button>
              </>
            )}
          </div>
        )}

        {activeTab === 'question' && (
          <div className="animate-fade-in" style={{ padding: '1rem 0' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '0.875rem' }}>
                  <th style={{ padding: '1rem 0' }}>Question</th>
                  <th style={{ padding: '1rem 0' }}>Answer type</th>
                  <th style={{ padding: '1rem 0' }}>Answer</th>
                  <th style={{ padding: '1rem 0', textAlign: 'center' }}>mandatory</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '1rem 0', color: '#cbd5e1' }}>Name</td>
                  <td style={{ padding: '1rem 0', color: '#94a3b8' }}>Single line text</td>
                  <td style={{ padding: '1rem 0', color: '#94a3b8' }}>Vipin jindal</td>
                  <td style={{ padding: '1rem 0', textAlign: 'center', color: '#94a3b8' }}>✕</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '1rem 0', color: '#cbd5e1' }}>Phone</td>
                  <td style={{ padding: '1rem 0', color: '#94a3b8' }}>Phone number</td>
                  <td style={{ padding: '1rem 0', color: '#94a3b8' }}>9874563210</td>
                  <td style={{ padding: '1rem 0', textAlign: 'center', color: '#94a3b8' }}>✕</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '1rem 0', color: '#cbd5e1' }}>Symptoms</td>
                  <td style={{ padding: '1rem 0', color: '#94a3b8' }}>Single line text</td>
                  <td style={{ padding: '1rem 0', color: '#94a3b8' }}>Cough</td>
                  <td style={{ padding: '1rem 0', textAlign: 'center', color: '#94a3b8' }}>✕</td>
                </tr>
              </tbody>
            </table>
            
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#334155', borderRadius: '0.5rem' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Add a question</h4>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <input type="text" className="input" placeholder="Anything else we should know?" />
                <select className="input">
                  <option>Single line text</option>
                  <option>Multi-line text</option>
                  <option>Phone Number</option>
                  <option>Radio(One Answer)</option>
                  <option>Checkboxes(Multiple Answers)</option>
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1' }}>
                  <input type="checkbox" /> Mandatory Answer
                </label>
                <button className="button" style={{ width: 'auto', alignSelf: 'flex-start' }}>Save Question</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'misc' && (
          <div className="animate-fade-in" style={{ padding: '1rem 0' }}>
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="label">Introduction page message</label>
              <textarea 
                className="input" 
                rows={4} 
                value={formData.introMessage} 
                onChange={(e) => setFormData({...formData, introMessage: e.target.value})}
              ></textarea>
            </div>
            <div className="form-group">
              <label className="label">Confirmation page message</label>
              <textarea 
                className="input" 
                rows={4} 
                value={formData.confirmMessage}
                onChange={(e) => setFormData({...formData, confirmMessage: e.target.value})}
              ></textarea>
            </div>
          </div>
        )}

        {activeTab === 'options' && (
          <div className="animate-fade-in" style={{ padding: '1rem 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
            <div>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '1rem', marginBottom: '0.5rem' }}>
                  <input type="checkbox" checked={formData.manualConfirmation} onChange={(e) => setFormData({...formData, manualConfirmation: e.target.checked})} />
                  Manual confirmation
                </label>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginLeft: '1.5rem' }}>Up to 50% of capacity</p>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '1rem', marginBottom: '0.5rem' }}>
                  <input type="checkbox" checked={formData.paidBooking} onChange={(e) => setFormData({...formData, paidBooking: e.target.checked})} />
                  Paid Booking
                </label>
                <div style={{ marginLeft: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                  Booking Fees (Rs <input type="number" className="input" style={{ width: '80px', padding: '0.25rem' }} value={formData.bookingFee} onChange={(e) => setFormData({...formData, bookingFee: parseInt(e.target.value)})} /> Per booking)
                </div>
              </div>
            </div>
            
            <div>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="label">Create Slot</label>
                <select className="input">
                  <option>Automatically</option>
                  <option>Manually</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Cancellation</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                  up to <input type="number" className="input" style={{ width: '60px', padding: '0.25rem' }} value={formData.cancellationCutoff} onChange={(e) => setFormData({...formData, cancellationCutoff: parseInt(e.target.value)})} /> hour(s) before the booking
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ServiceEditor;