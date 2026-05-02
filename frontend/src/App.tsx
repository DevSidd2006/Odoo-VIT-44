import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import BookingFlow from './pages/BookingFlow';
import Profile from './pages/Profile';
import OrganiserDashboard from './pages/OrganiserDashboard';
import Services from './pages/organiser/Services';
import Calendar from './pages/organiser/Calendar';
import Reports from './pages/organiser/Reports';
import Users from './pages/admin/Users';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/book" element={<BookingFlow />} />
        <Route path="/profile" element={<Profile />} />
        
        {/* Organiser Routes */}
        <Route path="/organiser" element={<OrganiserDashboard />} />
        <Route path="/organiser/services" element={<Services />} />
        <Route path="/organiser/calendar" element={<Calendar />} />
        <Route path="/organiser/reports" element={<Reports />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<OrganiserDashboard />} /> {/* Admin uses same dashboard for stats */}
        <Route path="/admin/users" element={<Users />} />

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
