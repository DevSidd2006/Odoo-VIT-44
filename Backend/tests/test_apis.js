const BASE_URL = 'http://localhost:3000/api';

async function request(path, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runTests() {
  console.log('Starting API tests...');
  
  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, message, details = null) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ PASS: ${message}`);
    } else {
      console.error(`❌ FAIL: ${message}`, details ? details : '');
    }
  }

  // 1. Reset Store
  await request('/dev/reset', 'POST');
  console.log('Store reset.');

  // 2. Auth Flow
  const signupRes = await request('/auth/signup', 'POST', {
    fullName: 'Test Customer',
    email: 'customer@example.com',
    password: 'Password123!'
  });
  assert(signupRes.status === 201, `Signup successful (Status: ${signupRes.status})`);

  const custOtpRes = await request('/dev/otp/customer@example.com');
  await request('/auth/verify-otp', 'POST', { email: 'customer@example.com', otp: custOtpRes.data.otp, type: 'signup' });
  const loginRes = await request('/auth/login', 'POST', { email: 'customer@example.com', password: 'Password123!' });
  const customerToken = loginRes.data.token;
  const customerId = loginRes.data.user.id;

  // Organiser Auth
  await request('/auth/signup', 'POST', { fullName: 'Test Organiser', email: 'organiser@example.com', password: 'Password123!' });
  const orgOtpRes = await request('/dev/otp/organiser@example.com');
  await request('/auth/verify-otp', 'POST', { email: 'organiser@example.com', otp: orgOtpRes.data.otp, type: 'signup' });
  // Promote to organiser
  await request('/dev/promote/organiser@example.com', 'POST', { role: 'organiser' });
  
  const orgLoginRes = await request('/auth/login', 'POST', { email: 'organiser@example.com', password: 'Password123!' });
  const orgToken = orgLoginRes.data.token;
  const orgId = orgLoginRes.data.user.id;

  // Admin Auth
  await request('/auth/signup', 'POST', { fullName: 'Admin User', email: 'admin@example.com', password: 'Password123!' });
  const adminOtpRes = await request('/dev/otp/admin@example.com');
  await request('/auth/verify-otp', 'POST', { email: 'admin@example.com', otp: adminOtpRes.data.otp, type: 'signup' });
  // Promote to admin
  await request('/dev/promote/admin@example.com', 'POST', { role: 'admin' });

  const adminProfile = await request('/auth/login', 'POST', { email: 'admin@example.com', password: 'Password123!' });
  const adminToken = adminProfile.data.token;

  // Test Admin Dashboard
  const getDashboardRes = await request('/admin/dashboard', 'GET', null, adminToken);
  assert(getDashboardRes.status === 200, `Admin Dashboard status: ${getDashboardRes.status}`, getDashboardRes.data);

  // Test Bookings with req.user.userId bug fix
  const appointmentsRes = await request('/users/me/appointments', 'GET', null, customerToken);
  assert(appointmentsRes.status === 200, 'Customer Appointments fetch successful', appointmentsRes.data);

  console.log(`\nTests completed: ${passedTests}/${totalTests} passed.`);
}

runTests().catch(console.error);
