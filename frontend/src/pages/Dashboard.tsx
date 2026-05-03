import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    // 1. Get user from local storage
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));

    // 2. Fetch services
    axios.get('http://localhost:3000/api/services')
      .then(res => setCategories(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const filteredCategories = categories.map(cat => ({
    ...cat,
    services: cat.services.filter((service: any) => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'All' ? true : (typeFilter === 'Free' ? Number(service.price) === 0 : Number(service.price) > 0);
      return matchesSearch && matchesType;
    })
  })).filter(cat => cat.services.length > 0);

  return (
    <div className="app-container animate-fade-in">
      {/* Premium Navbar */}
      <nav className="nav-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--accent)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>A</div>
          <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>Appointly</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/profile" className="button button-outline" style={{ fontSize: '0.875rem' }}>My Profile</Link>
          <button onClick={handleLogout} className="button" style={{ background: '#ef4444', fontSize: '0.875rem' }}>Logout</button>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem' }} className="text-gradient">
          Book your next <br /> appointment in seconds.
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>
          Welcome back, {user?.fullName || 'User'}. Explore our professional services and schedule your visit with ease.
        </p>
      </header>

      {/* Services Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Sidebar/Filter */}
        <div className="glass-card" style={{ padding: '1.5rem', position: 'sticky', top: '2rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>Filters</h3>
          
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="label">Search</label>
            <input 
              type="text" 
              className="input" 
              placeholder="e.g., Dental care" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="label">Type</label>
            <select 
              className="input"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Appointments</option>
              <option value="Free">Free</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem' }}>Our Services</h2>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{filteredCategories.reduce((acc, cat) => acc + cat.services.length, 0)} Services Available</div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>Loading services...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', borderStyle: 'dashed' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <h3 style={{ marginBottom: '0.5rem' }}>No services found</h3>
              <p style={{ color: 'var(--text-muted)' }}>Adjust your filters or search term to find appointments.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
              {filteredCategories.map(category => (
                category.services.map((service: any) => (
                  <div key={service.id} className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {category.name}
                      </span>
                      <h3 style={{ fontSize: '1.25rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>{service.name}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', minHeight: '3rem' }}>{service.description}</p>
                      
                      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                           <span style={{ background: '#3b82f6', color: 'white', padding: '0.1rem 0.25rem', borderRadius: '0.25rem' }}>A1</span>
                           <span style={{ background: '#3b82f6', color: 'white', padding: '0.1rem 0.25rem', borderRadius: '0.25rem' }}>A2</span>
                        </span>
                        <span>•</span>
                        <span>Location: {service.location || 'Online'}</span>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                      <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{Number(service.price) === 0 ? 'Free' : `₹${service.price}`}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{service.duration} mins</div>
                      </div>
                      <button onClick={() => navigate(`/book/${service.id}`)} className="button">
                        Book Now
                      </button>
                    </div>
                  </div>
                ))
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
