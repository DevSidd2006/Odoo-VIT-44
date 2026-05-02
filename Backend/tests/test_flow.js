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
  console.log('--- Starting Comprehensive API Tests ---');
  
  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, message, details = null) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ PASS: ${message}`);
    } else {
      console.error(`❌ FAIL: ${message}`, details ? JSON.stringify(details) : '');
    }
  }

  // 1. PUBLIC APIs
  const servicesRes = await request('/services');
  assert(servicesRes.status === 200, 'Public Services list works');
  const serviceId = servicesRes.data.data[0].services[0].id;

  const serviceDetailRes = await request(`/services/${serviceId}`);
  assert(serviceDetailRes.status === 200, `Public Service detail for ID ${serviceId} works`);

  // 2. AUTHENTICATION (Seeded Admin)
  const loginRes = await request('/auth/login', 'POST', {
    email: 'admin@appointly.in',
    password: 'Admin@123'
  });
  assert(loginRes.status === 200, 'Admin Login works');
  const adminToken = loginRes.data.token;

  // 3. ADMIN APIs
  const dashboardRes = await request('/admin/dashboard', 'GET', null, adminToken);
  assert(dashboardRes.status === 200, 'Admin Dashboard stats works');
  assert(dashboardRes.data.stats.totalUsers > 0, 'Admin Dashboard returns users count');

  const usersRes = await request('/admin/users', 'GET', null, adminToken);
  assert(usersRes.status === 200, 'Admin Users list works');
  assert(usersRes.data.users.length > 0, 'Admin Users returns seeded users');

  // 4. ORGANISER (Appointment Types) APIs
  const apptTypesRes = await request('/appointment-types', 'GET', null, adminToken);
  assert(apptTypesRes.status === 200, 'Organiser Appointment Types list works');

  const newServiceRes = await request('/appointment-types', 'POST', {
    name: 'Test Test Service'
  }, adminToken);
  assert(newServiceRes.status === 201, 'Create New Appointment Type works');
  const newId = newServiceRes.data.appointmentType.id;

  const updateServiceRes = await request(`/appointment-types/${newId}`, 'PUT', {
    location: 'Cyber Hub, Gurgaon',
    price: 999
  }, adminToken);
  assert(updateServiceRes.status === 200, 'Update Appointment Type works');

  // 5. PROFILE APIs
  const profileRes = await request('/profile', 'GET', null, adminToken);
  assert(profileRes.status === 200, 'Get Profile works');
  
  const updateProfileRes = await request('/profile', 'PUT', {
    fullName: 'Arjun Sharma Updated',
    phone: '9999999999'
  }, adminToken);
  assert(updateProfileRes.status === 200, 'Update Profile works');

  // 6. REPORTS
  const reportRes = await request('/reports/total-appointments', 'GET', null, adminToken);
  assert(reportRes.status === 200, 'Reports Total Appointments works');

  console.log(`\n--- Test Summary: ${passedTests}/${totalTests} Passed ---`);
}

runTests().catch(console.error);
