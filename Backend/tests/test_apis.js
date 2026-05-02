import axios from 'axios';

const BASE = 'http://127.0.0.1:3000/api';

async function test() {
  console.log('\n=== API Tests ===\n');

  // 1. Services list
  try {
    const r1 = await axios.get(`${BASE}/services`);
    console.log('1. GET /services:', r1.data.success ? '✅' : '❌', r1.data.data?.length + ' categories');
  } catch (e) { console.log('1. GET /services:', '❌', e.message); }

  // 2. Service detail
  try {
    const r2 = await axios.get(`${BASE}/services/1`);
    console.log('2. GET /services/1:', r2.data.success ? '✅' : '❌', r2.data.data?.name);
  } catch (e) { console.log('2. GET /services/1:', '❌', e.message); }

  // 3. Availability
  try {
    const r3 = await axios.get(`${BASE}/appointments/availability`, { params: { serviceId: 1, date: '2026-05-10' } });
    console.log('3. GET /availability:', r3.data.success ? '✅' : '❌', r3.data.data?.length + ' slots');
  } catch (e) { 
    console.log('3. GET /availability:', '❌', e.response?.data?.message || e.message); 
  }

  // 4. Signup
  try {
    const r4 = await axios.post(`${BASE}/auth/signup`, {
      fullName: 'Test User',
      email: 'testapi3@example.com',
      password: 'Test@123'
    });
    console.log('4. POST /signup:', r4.data.success ? '✅' : '❌', r4.data.message);
  } catch (e) { console.log('4. POST /signup:', '❌', e.response?.data?.message || e.message); }

  console.log('\n=== Done ===');
}

test();