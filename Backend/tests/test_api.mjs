import http from 'http';

function request(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api' + path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve({ raw: data }); }
      });
    });
    
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  console.log('\n=== API Tests ===\n');
  
  // 1. Services list
  try {
    const r = await request('/services');
    console.log('1. GET /services:', r.success ? '✅' : '❌', r.data?.length + ' categories');
  } catch (e) { console.log('1. GET /services:', '❌', e.message); }
  
  // 2. Service detail
  try {
    const r = await request('/services/1');
    console.log('2. GET /services/1:', r.success ? '✅' : '❌', r.data?.name);
  } catch (e) { console.log('2. GET /services/1:', '❌'); }
  
  // 3. Availability
  try {
    const r = await request('/appointments/availability?serviceId=1&date=2026-05-10');
    console.log('3. GET /availability:', r.success ? '✅' : '❌', r.data?.length + ' slots');
  } catch (e) { console.log('3. GET /availability:', '❌'); }
  
  // 4. Signup
  try {
    const r = await request('/auth/signup', 'POST', {
      fullName: 'Test User',
      email: 'testapi' + Date.now() + '@example.com',
      password: 'Test@123'
    });
    console.log('4. POST /signup:', r.success ? '✅' : '❌', r.message);
  } catch (e) { console.log('4. POST /signup:', '❌'); }
  
  console.log('\n=== Tests Complete ===');
}

test();