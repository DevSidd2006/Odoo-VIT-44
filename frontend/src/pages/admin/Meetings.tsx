import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

const Meetings: React.FC = () => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:3000/api/profile/appointments')
      .then(res => setMeetings(res.data.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getMeetingsForDay = (day: number) => {
    return meetings.filter(m => {
      const date = new Date(m.startTime);
      return date.getDate() === day && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
  };

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <AdminLayout>
      <div className="meetings-header">
        <h1>Meetings</h1>
        <div className="view-toggle">
          <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>List</button>
          <button className={viewMode === 'calendar' ? 'active' : ''} onClick={() => setViewMode('calendar')}>Calendar</button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="meetings-table">
          <table className="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Appointment</th>
                <th>Booked By</th>
                <th>Resource</th>
                <th>Start</th>
                <th>End</th>
                <th>Capacity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map(m => (
                <tr key={m.id}>
                  <td>{m.service?.name?.split(' ')[0] || 'Routine'}</td>
                  <td>{m.service?.name || 'N/A'}</td>
                  <td>{m.customer?.userProfile?.fullName?.split(' ')[0] || 'Anonymous'}</td>
                  <td>{m.provider?.authIdentity?.userProfile?.fullName || '-'}</td>
                  <td>{new Date(m.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{new Date(m.endTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{m.numPeople || '-'}</td>
                  <td>
                    <span className={`badge badge-${m.status === 'CONFIRMED' ? 'success' : m.status === 'PENDING' ? 'warning' : 'error'}`}>
                      {m.status === 'PENDING' ? 'Request' : m.status === 'CONFIRMED' ? 'Booked' : m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="calendar-view">
          <div className="calendar-nav">
            <button onClick={prevMonth} className="button button-outline">←</button>
            <h3>{monthNames[currentMonth]} {currentYear}</h3>
            <button onClick={nextMonth} className="button button-outline">→</button>
          </div>
          <div className="calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="calendar-header">{d}</div>
            ))}
            {days.map((day, i) => {
              const dayMeetings = day ? getMeetingsForDay(day) : [];
              return (
                <div key={i} className={`calendar-day ${day ? '' : 'empty'} ${day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear() ? 'today' : ''}`}>
                  {day && (
                    <>
                      <span className="day-number">{day}</span>
                      <div className="day-meetings">
                        {dayMeetings.slice(0, 3).map(m => (
                          <div key={m.id} className="meeting-dot" title={m.service?.name}>
                            {new Date(m.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ))}
                        {dayMeetings.length > 3 && <div className="more-meetings">+{dayMeetings.length - 3}</div>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .meetings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .meetings-header h1 {
          font-size: 1.875rem;
        }
        .view-toggle {
          display: flex;
          gap: 0;
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }
        .view-toggle button {
          padding: 0.5rem 1rem;
          border: none;
          background: var(--bg-main);
          cursor: pointer;
          font-size: 0.875rem;
        }
        .view-toggle button.active {
          background: var(--accent);
          color: white;
        }
        .calendar-view {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
        }
        .calendar-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background: var(--border);
        }
        .calendar-header {
          background: var(--bg-subtle);
          padding: 0.75rem;
          text-align: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        .calendar-day {
          background: var(--bg-card);
          min-height: 100px;
          padding: 0.5rem;
        }
        .calendar-day.empty {
          background: var(--bg-subtle);
        }
        .calendar-day.today {
          background: #EFF6FF;
        }
        .day-number {
          font-weight: 600;
          font-size: 0.875rem;
        }
        .day-meetings {
          margin-top: 0.25rem;
        }
        .meeting-dot {
          font-size: 0.625rem;
          background: var(--accent);
          color: white;
          padding: 0.125rem 0.25rem;
          border-radius: 4px;
          margin-bottom: 0.125rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .more-meetings {
          font-size: 0.625rem;
          color: var(--text-muted);
        }
      `}</style>
    </AdminLayout>
  );
};

export default Meetings;
