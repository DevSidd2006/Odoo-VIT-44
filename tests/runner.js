#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE = 'http://localhost:3000/api';
const RESULTS_FILE = path.join(__dirname, 'results.json');

// Shared state across all tests
const state = {
  customerToken: null,
  organiserToken: null,
  adminToken: null,
  customerId: null,
  organiserId: null,
  adminId: null,
  appointmentTypeId: null,
  resourceId: null,
  questionId: null,
  bookingId: null,
  slotDate: null,
  slotStartTime: null,
  slotEndTime: null,
};

let totalDuration = 0;
let testResults = [];

// ════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function api(method, path, body = null, token = null) {
  const startTime = Date.now();
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const options = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE}${path}`, options);
    const responseBody = await response.json().catch(() => ({}));
    const durationMs = Date.now() - startTime;

    return {
      status: response.status,
      body: responseBody,
      durationMs,
    };
  } catch (error) {
    console.error(`API call failed: ${method} ${path}`, error.message);
    return {
      status: 0,
      body: { error: error.message },
      durationMs: Date.now() - startTime,
    };
  }
}

async function test(module, name, fn, expectedStatus) {
  // Handle array of acceptable statuses
  const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];

  try {
    const result = await fn();
    const passed = expectedStatuses.includes(result.status);

    testResults.push({
      module,
      name,
      expectedStatus,
      actualStatus: result.status,
      passed,
      durationMs: result.durationMs,
      response: result.body,
    });

    totalDuration += result.durationMs;

    if (!passed) {
      console.error(
        `  ✗ [${module}] ${name} → expected [${expectedStatuses.join(',')}] got ${result.status}`
      );
    } else {
      console.log(`  ✓ [${module}] ${name}`);
    }

    return result;
  } catch (error) {
    console.error(`  ✗ [${module}] ${name} → ${error.message}`);
    testResults.push({
      module,
      name,
      expectedStatus,
      actualStatus: 0,
      passed: false,
      durationMs: 0,
      response: { error: error.message },
    });
    return { status: 0, body: { error: error.message }, durationMs: 0 };
  }
}

function getNextMonday() {
  const today = new Date();
  const day = today.getDay();
  const diff = (1 - day + 7) % 7 || 7;
  const nextMonday = new Date(today.getTime() + diff * 24 * 60 * 60 * 1000);
  return nextMonday.toISOString().split('T')[0];
}

// ════════════════════════════════════════════════════════════════
// SETUP PHASE
// ════════════════════════════════════════════════════════════════

async function setupPhase() {
  console.log('\n═════ SETUP PHASE ═════\n');

  // Step 1: Reset store
  console.log('• Resetting store...');
  let res = await api('POST', '/dev/reset', null, null);
  if (res.status !== 200) {
    console.error('✗ Failed to reset store');
    process.exit(1);
  }
  console.log('✓ Store reset\n');

  // Create Customer
  console.log('• Setting up customer user...');
  res = await api('POST', '/auth/signup', {
    fullName: 'Test Customer',
    email: 'customer@test.com',
    password: 'Customer@123',
  });
  if (res.status !== 201) {
    console.error('✗ Customer signup failed:', res.body);
    process.exit(1);
  }
  state.customerId = res.body.userId;
  console.log(`  ✓ Customer signed up (ID: ${state.customerId})`);

  res = await api('GET', '/dev/otp/customer@test.com');
  if (res.status !== 200) {
    console.error('✗ Failed to get customer OTP');
    process.exit(1);
  }
  const customerOtp = res.body.otp;

  res = await api('POST', '/auth/verify-otp', {
    email: 'customer@test.com',
    otp: customerOtp,
    type: 'signup',
  });
  if (res.status !== 200) {
    console.error('✗ Customer OTP verification failed');
    process.exit(1);
  }
  console.log('  ✓ Customer OTP verified');

  res = await api('POST', '/auth/login', {
    email: 'customer@test.com',
    password: 'Customer@123',
  });
  if (res.status !== 200) {
    console.error('✗ Customer login failed');
    process.exit(1);
  }
  state.customerToken = res.body.token;
  console.log('  ✓ Customer logged in\n');

  // Create Organiser
  console.log('• Setting up organiser user...');
  res = await api('POST', '/auth/signup', {
    fullName: 'Test Organiser',
    email: 'organiser@test.com',
    password: 'Organiser@123',
  });
  if (res.status !== 201) {
    console.error('✗ Organiser signup failed');
    process.exit(1);
  }
  state.organiserId = res.body.userId;

  res = await api('GET', '/dev/otp/organiser@test.com');
  if (res.status !== 200) {
    console.error('✗ Failed to get organiser OTP');
    process.exit(1);
  }
  const organiserOtp = res.body.otp;

  res = await api('POST', '/auth/verify-otp', {
    email: 'organiser@test.com',
    otp: organiserOtp,
    type: 'signup',
  });
  if (res.status !== 200) {
    console.error('✗ Organiser OTP verification failed');
    process.exit(1);
  }

  res = await api('POST', '/auth/login', {
    email: 'organiser@test.com',
    password: 'Organiser@123',
  });
  if (res.status !== 200) {
    console.error('✗ Organiser login failed');
    process.exit(1);
  }
  state.organiserToken = res.body.token;
  console.log('  ✓ Organiser logged in\n');

  // Create Admin
  console.log('• Setting up admin user...');
  res = await api('POST', '/auth/signup', {
    fullName: 'Test Admin',
    email: 'admin@test.com',
    password: 'Admin@123',
  });
  if (res.status !== 201) {
    console.error('✗ Admin signup failed');
    process.exit(1);
  }
  state.adminId = res.body.userId;

  res = await api('GET', '/dev/otp/admin@test.com');
  if (res.status !== 200) {
    console.error('✗ Failed to get admin OTP');
    process.exit(1);
  }
  const adminOtp = res.body.otp;

  res = await api('POST', '/auth/verify-otp', {
    email: 'admin@test.com',
    otp: adminOtp,
    type: 'signup',
  });
  if (res.status !== 200) {
    console.error('✗ Admin OTP verification failed');
    process.exit(1);
  }

  res = await api('POST', '/auth/login', {
    email: 'admin@test.com',
    password: 'Admin@123',
  });
  if (res.status !== 200) {
    console.error('✗ Admin login failed');
    process.exit(1);
  }
  state.adminToken = res.body.token;
  console.log('  ✓ Admin logged in\n');

  // Promote Admin Role
  console.log('• Promoting admin role...');
  res = await api('PUT', `/admin/users/${state.adminId}/role`, { role: 'admin' }, state.adminToken);
  if (res.status !== 200) {
    console.error('✗ Failed to promote admin role');
    process.exit(1);
  }

  res = await api('POST', '/auth/login', {
    email: 'admin@test.com',
    password: 'Admin@123',
  });
  state.adminToken = res.body.token;
  console.log('  ✓ Admin role promoted\n');

  // Promote Organiser Role
  console.log('• Promoting organiser role...');
  res = await api('PUT', `/admin/users/${state.organiserId}/role`, { role: 'organiser' }, state.adminToken);
  if (res.status !== 200) {
    console.error('✗ Failed to promote organiser role');
    process.exit(1);
  }

  res = await api('POST', '/auth/login', {
    email: 'organiser@test.com',
    password: 'Organiser@123',
  });
  state.organiserToken = res.body.token;
  console.log('  ✓ Organiser role promoted\n');

  console.log('═════ SETUP COMPLETE ═════\n');
}

// ════════════════════════════════════════════════════════════════
// TEST PHASE - 47 TESTS
// ════════════════════════════════════════════════════════════════

async function runTests() {
  console.log('\n═════ TEST PHASE (47 Tests) ═════\n');

  // MODULE: Auth (6 tests)
  console.log('AUTH (6 tests)');
  await test('Auth', 'POST /auth/signup duplicate', () =>
    api('POST', '/auth/signup', {
      fullName: 'Dup',
      email: 'customer@test.com',
      password: 'Pass@123',
    }), 409);

  await test('Auth', 'POST /auth/verify-otp wrong OTP', () =>
    api('POST', '/auth/verify-otp', {
      email: 'customer@test.com',
      otp: '000000',
      type: 'signup',
    }), 400);

  await test('Auth', 'POST /auth/login valid', () =>
    api('POST', '/auth/login', {
      email: 'customer@test.com',
      password: 'Customer@123',
    }), 200);

  await test('Auth', 'POST /auth/forgot-password', () =>
    api('POST', '/auth/forgot-password', {
      email: 'customer@test.com',
    }), 200);

  await test('Auth', 'POST /auth/reset-password wrong OTP', () =>
    api('POST', '/auth/reset-password', {
      email: 'customer@test.com',
      otp: '000000',
      newPassword: 'New@123',
    }), 400);

  await test('Auth', 'POST /auth/resend-otp', () =>
    api('POST', '/auth/resend-otp', {
      email: 'customer@test.com',
      type: 'signup',
    }), 200);

  // MODULE: User (3 tests)
  console.log('\nUSER (3 tests)');
  await test('User', 'GET /users/me', () =>
    api('GET', '/users/me', null, state.customerToken), 200);

  await test('User', 'PUT /users/me', () =>
    api('PUT', '/users/me', { fullName: 'Updated' }, state.customerToken), 200);

  await test('User', 'GET /users/me/appointments', () =>
    api('GET', '/users/me/appointments?status=all', null, state.customerToken), 200);

  // MODULE: Admin (4 tests)
  console.log('\nADMIN (4 tests)');
  await test('Admin', 'GET /admin/users', () =>
    api('GET', '/admin/users', null, state.adminToken), 200);

  await test('Admin', 'GET /admin/dashboard', () =>
    api('GET', '/admin/dashboard', null, state.adminToken), 200);

  await test('Admin', 'PUT /admin/users/:id/status', () =>
    api('PUT', `/admin/users/${state.customerId}/status`, { isActive: true }, state.adminToken), 200);

  await test('Admin', 'PUT /admin/users/:id/role', () =>
    api('PUT', `/admin/users/${state.customerId}/role`, { role: 'customer' }, state.adminToken), 200);

  // MODULE: AppointmentType (9 tests)
  console.log('\nAPPOINTMENT TYPE (9 tests)');
  let createRes = await test('AppointmentType', 'POST /appointment-types create', () =>
    api('POST', '/appointment-types', {
      title: 'Dental Care',
      durationMinutes: 30,
      location: "Doctor's Office",
      type: 'user',
      assignment: 'auto',
      manageCapacity: true,
      capacityLimit: 5,
      introMessage: 'Welcome',
      confirmMessage: 'Confirmed',
    }, state.organiserToken), 201);
  state.appointmentTypeId = createRes.body.id;

  await test('AppointmentType', 'GET /appointment-types list', () =>
    api('GET', '/appointment-types', null, state.organiserToken), 200);

  await test('AppointmentType', 'GET /appointment-types/:id', () =>
    api('GET', `/appointment-types/${state.appointmentTypeId}`, null, state.organiserToken), 200);

  await test('AppointmentType', 'PUT /appointment-types/:id update', () =>
    api('PUT', `/appointment-types/${state.appointmentTypeId}`, { title: 'Updated' }, state.organiserToken), 200);

  await test('AppointmentType', 'POST /appointment-types/:id/publish', () =>
    api('POST', `/appointment-types/${state.appointmentTypeId}/publish`, {}, state.organiserToken), [200, 400]);

  await test('AppointmentType', 'POST /appointment-types/:id/unpublish', () =>
    api('POST', `/appointment-types/${state.appointmentTypeId}/unpublish`, {}, state.organiserToken), 200);

  await test('AppointmentType', 'GET /appointment-types/:id/share-link', () =>
    api('GET', `/appointment-types/${state.appointmentTypeId}/share-link`, null, state.organiserToken), 200);

  await test('AppointmentType', 'GET /appointment-types/:id/preview', () =>
    api('GET', `/appointment-types/${state.appointmentTypeId}/preview`, null, state.organiserToken), 200);

  // MODULE: Resource (5 tests)
  console.log('\nRESOURCE (5 tests)');
  let resourceRes = await test('Resource', 'POST /resources create', () =>
    api('POST', '/resources', { name: 'Court 1', capacity: 4 }, state.organiserToken), 201);
  state.resourceId = resourceRes.body.id;

  await test('Resource', 'GET /resources list', () =>
    api('GET', '/resources', null, state.organiserToken), 200);

  await test('Resource', 'GET /resources/:id', () =>
    api('GET', `/resources/${state.resourceId}`, null, state.organiserToken), 200);

  await test('Resource', 'PUT /resources/:id update', () =>
    api('PUT', `/resources/${state.resourceId}`, { name: 'Updated' }, state.organiserToken), 200);

  let delRes = await api('POST', '/resources', { name: 'Delete Me', capacity: 1 }, state.organiserToken);
  await test('Resource', 'DELETE /resources/:id', () =>
    api('DELETE', `/resources/${delRes.body.id}`, null, state.organiserToken), 200);

  // MODULE: Schedule (2 tests)
  console.log('\nSCHEDULE (2 tests)');
  await test('Schedule', 'PUT /appointment-types/:id/schedule', () =>
    api('PUT', `/appointment-types/${state.appointmentTypeId}/schedule`, {
      scheduleType: 'weekly',
      slots: [
        { day: 'monday', windows: [{ from: '09:00', to: '12:00' }, { from: '14:00', to: '17:00' }] },
        { day: 'tuesday', windows: [{ from: '09:00', to: '12:00' }] },
      ],
    }, state.organiserToken), 200);

  await test('Schedule', 'GET /appointment-types/:id/schedule', () =>
    api('GET', `/appointment-types/${state.appointmentTypeId}/schedule`, null, state.organiserToken), 200);

  // Retry publish
  await api('POST', `/appointment-types/${state.appointmentTypeId}/publish`, {}, state.organiserToken);

  // MODULE: Question (4 tests)
  console.log('\nQUESTION (4 tests)');
  let qRes = await test('Question', 'POST /appointment-types/:id/questions', () =>
    api('POST', `/appointment-types/${state.appointmentTypeId}/questions`, {
      question: 'What is your name?',
      answerType: 'single_line_text',
      mandatory: true,
    }, state.organiserToken), 201);
  state.questionId = qRes.body.id;

  await test('Question', 'GET /appointment-types/:id/questions', () =>
    api('GET', `/appointment-types/${state.appointmentTypeId}/questions`, null, state.organiserToken), 200);

  await test('Question', 'PUT /appointment-types/:id/questions/:qId', () =>
    api('PUT', `/appointment-types/${state.appointmentTypeId}/questions/${state.questionId}`, {
      question: 'Updated?',
    }, state.organiserToken), 200);

  let delQRes = await api('POST', `/appointment-types/${state.appointmentTypeId}/questions`, {
    question: 'Delete me',
    answerType: 'single_line_text',
    mandatory: false,
  }, state.organiserToken);
  await test('Question', 'DELETE /appointment-types/:id/questions/:qId', () =>
    api('DELETE', `/appointment-types/${state.appointmentTypeId}/questions/${delQRes.body.id}`, null, state.organiserToken), 200);

  // MODULE: BookingRules (2 tests)
  console.log('\nBOOKING RULES (2 tests)');
  await test('BookingRules', 'PUT /appointment-types/:id/rules', () =>
    api('PUT', `/appointment-types/${state.appointmentTypeId}/rules`, {
      maxBookingsPerSlot: 5,
      manualConfirmation: false,
      advancePayment: false,
      paymentFee: 0,
      paymentCapacityPercent: 100,
      slotCreationType: 'auto',
      cancellationCutoffHours: 1,
    }, state.organiserToken), 200);

  await test('BookingRules', 'GET /appointment-types/:id/rules', () =>
    api('GET', `/appointment-types/${state.appointmentTypeId}/rules`, null, state.organiserToken), 200);

  // MODULE: Slot (2 tests)
  console.log('\nSLOT (2 tests)');
  state.slotDate = getNextMonday();

  let slotsRes = await test('Slot', 'GET /appointment-types/:id/slots', () =>
    api('GET', `/appointment-types/${state.appointmentTypeId}/slots?date=${state.slotDate}`, null, state.customerToken), 200);

  if (slotsRes.body.slots && slotsRes.body.slots.length > 0) {
    state.slotStartTime = slotsRes.body.slots[0].startTime;
    state.slotEndTime = slotsRes.body.slots[0].endTime;
  }

  await test('Slot', 'POST /appointment-types/:id/slots', () =>
    api('POST', `/appointment-types/${state.appointmentTypeId}/slots`, {
      date: state.slotDate,
      startTime: '10:00',
      endTime: '10:30',
    }, state.organiserToken), [400, 403]);

  // MODULE: Booking (7 tests)
  console.log('\nBOOKING (7 tests)');
  let bookRes = await test('Booking', 'POST /bookings create', () =>
    api('POST', '/bookings', {
      appointmentTypeId: state.appointmentTypeId,
      date: state.slotDate,
      startTime: state.slotStartTime,
      endTime: state.slotEndTime,
      capacity: 1,
      answers: [{ questionId: state.questionId, answer: 'John Doe' }],
    }, state.customerToken), 201);
  state.bookingId = bookRes.body.id;

  await test('Booking', 'GET /bookings list', () =>
    api('GET', '/bookings', null, state.organiserToken), 200);

  await test('Booking', 'GET /bookings/my', () =>
    api('GET', '/bookings/my', null, state.customerToken), 200);

  await test('Booking', 'GET /bookings/:id', () =>
    api('GET', `/bookings/${state.bookingId}`, null, state.customerToken), 200);

  await test('Booking', 'PUT /bookings/:id/confirm', () =>
    api('PUT', `/bookings/${state.bookingId}/confirm`, {}, state.organiserToken), 200);

  await test('Booking', 'PUT /bookings/:id/reschedule', () =>
    api('PUT', `/bookings/${state.bookingId}/reschedule`, {
      date: state.slotDate,
      startTime: state.slotStartTime,
      endTime: state.slotEndTime,
    }, state.customerToken), [200, 400]);

  await test('Booking', 'PUT /bookings/:id/cancel', () =>
    api('PUT', `/bookings/${state.bookingId}/cancel`, {}, state.organiserToken), 200);

  // MODULE: Reports (3 tests)
  console.log('\nREPORTS (3 tests)');
  await test('Reports', 'GET /reports/total-appointments', () =>
    api('GET', '/reports/total-appointments', null, state.organiserToken), 200);

  await test('Reports', 'GET /reports/peak-hours', () =>
    api('GET', '/reports/peak-hours', null, state.organiserToken), 200);

  await test('Reports', 'GET /reports/provider-utilization', () =>
    api('GET', '/reports/provider-utilization', null, state.organiserToken), 200);

  // MODULE: Cleanup (1 test)
  console.log('\nCLEANUP (1 test)');
  await test('Cleanup', 'DELETE /appointment-types/:id', () =>
    api('DELETE', `/appointment-types/${state.appointmentTypeId}`, null, state.organiserToken), 200);
}

// ════════════════════════════════════════════════════════════════
// WRITE RESULTS & SUMMARY
// ════════════════════════════════════════════════════════════════

function writeResults() {
  const passed = testResults.filter(t => t.passed).length;
  const failed = testResults.filter(t => !t.passed).length;

  const modules = {};
  testResults.forEach(result => {
    if (!modules[result.module]) {
      modules[result.module] = {
        name: result.module,
        passed: 0,
        failed: 0,
        tests: [],
      };
    }
    modules[result.module].tests.push({
      name: result.name,
      expectedStatus: result.expectedStatus,
      actualStatus: result.actualStatus,
      passed: result.passed,
      durationMs: result.durationMs,
      response: result.response,
    });
    if (result.passed) {
      modules[result.module].passed += 1;
    } else {
      modules[result.module].failed += 1;
    }
  });

  const results = {
    runAt: new Date().toISOString(),
    totalDuration: totalDuration,
    summary: {
      total: testResults.length,
      passed,
      failed,
    },
    modules: Object.values(modules),
  };

  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
}

// ════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   Appointment Booking System - 47 API Test Runner     ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  try {
    await setupPhase();
    await runTests();
  } catch (error) {
    console.error('\n✗ Fatal error:', error.message);
    process.exit(1);
  }

  const passed = testResults.filter(t => t.passed).length;
  const failed = testResults.filter(t => !t.passed).length;

  console.log('\n═════ SUMMARY ═════\n');
  console.log(`✓ PASSED: ${passed}`);
  console.log(`✗ FAILED: ${failed}`);
  console.log(`TOTAL: ${testResults.length}`);

  if (failed > 0) {
    console.log('\n📋 Failed Tests:');
    testResults
      .filter(t => !t.passed)
      .forEach(t => {
        const exp = Array.isArray(t.expectedStatus) ? `[${t.expectedStatus.join(',')}]` : t.expectedStatus;
        console.log(`  - [${t.module}] ${t.name} → expected ${exp} got ${t.actualStatus}`);
      });
  }

  writeResults();
  console.log(`\n✓ Results written to ${RESULTS_FILE}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
