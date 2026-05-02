# Appointment App — Backend Plan & GitHub Copilot Prompt Guide

> **Senior Engineer Design** | Node.js + Express | In-Memory Store | JWT Auth
> **Total APIs: 47** across 13 modules | One-at-a-time execution flow

---

## Tech Stack Decision

| Layer | Choice | Reason |
|---|---|---|
| Runtime | Node.js 20+ | Fast I/O, non-blocking, great for booking concurrency |
| Framework | Express.js | Lightweight, flexible routing |
| Auth | JWT + bcrypt | Stateless, scalable |
| Data Store | In-memory JS Map | No DB setup; swappable to DB later |
| Validation | express-validator | Schema-based input validation |
| OTP | Custom 6-digit in-memory | Mimics real OTP service |
| Test Runner | Node built-in + axios scripts | Single result file for review |

---

## Project Structure

```
appointment-backend/
├── src/
│   ├── server.js                    # App entry point
│   ├── app.js                       # Express app config
│   ├── store/
│   │   └── index.js                 # In-memory data store (all tables)
│   ├── middleware/
│   │   ├── auth.middleware.js        # JWT verify
│   │   └── role.middleware.js        # Role-based access (customer/organiser/admin)
│   ├── utils/
│   │   ├── jwt.utils.js
│   │   ├── otp.utils.js
│   │   └── slot.utils.js            # Real-time slot generation engine
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── appointment-type.routes.js
│   │   ├── resource.routes.js
│   │   ├── schedule.routes.js
│   │   ├── question.routes.js
│   │   ├── booking-rules.routes.js
│   │   ├── slot.routes.js
│   │   ├── booking.routes.js
│   │   ├── admin.routes.js
│   │   └── report.routes.js
│   ├── controllers/                 # One controller per route file
│   └── services/                    # Business logic layer
├── tests/
│   ├── runner.js                    # Master test runner
│   └── results.json                 # ALL test results (auto-generated)
├── package.json
└── .env.example
```

---

## Data Models (In-Memory Store Schema)

```
users[]           → id, fullName, email, password(hashed), role, isActive, isVerified, createdAt
otps[]            → email, otp, expiresAt, type (signup|reset)
appointmentTypes[]→ id, organiserId, title, duration, location, type(user|resource),
                    assignment(auto|by_visitor), manageCapacity, capacityLimit,
                    isPublished, shareToken, introMessage, confirmMessage,
                    bookingRules{}, createdAt
resources[]       → id, organiserId, name, capacity, linkedResourceIds[]
schedules[]       → appointmentTypeId, scheduleType(weekly|flexible),
                    slots[{day, from, to}]
questions[]       → id, appointmentTypeId, question, answerType, mandatory, order
bookingRules{}    → appointmentTypeId, maxPerSlot, advancePayment, paymentFee,
                    manualConfirmation, cancellationHours, slotCreationType
slots[]           → id, appointmentTypeId, resourceId, userId, date, startTime,
                    endTime, capacity, bookedCount (computed)
bookings[]        → id, appointmentTypeId, customerId, resourceId, userId,
                    date, startTime, endTime, status(pending|confirmed|cancelled),
                    answers[], paymentStatus, createdAt
```

---

## API Index (47 APIs across 13 Modules)

### MODULE 1 — Project Setup (No APIs — Foundation Only)
### MODULE 2 — Auth APIs (6 APIs)
- `POST /api/auth/signup`
- `POST /api/auth/verify-otp`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/resend-otp`

### MODULE 3 — User / Profile APIs (3 APIs)
- `GET  /api/users/me`
- `PUT  /api/users/me`
- `GET  /api/users/me/appointments`

### MODULE 4 — Admin User Management APIs (3 APIs)
- `GET  /api/admin/users`
- `PUT  /api/admin/users/:id/status`
- `PUT  /api/admin/users/:id/role`

### MODULE 5 — Appointment Type APIs (9 APIs)
- `POST /api/appointment-types`
- `GET  /api/appointment-types`
- `GET  /api/appointment-types/:id`
- `PUT  /api/appointment-types/:id`
- `DELETE /api/appointment-types/:id`
- `POST /api/appointment-types/:id/publish`
- `POST /api/appointment-types/:id/unpublish`
- `GET  /api/appointment-types/:id/share-link`
- `GET  /api/appointment-types/:id/preview`

### MODULE 6 — Resource Management APIs (5 APIs)
- `POST /api/resources`
- `GET  /api/resources`
- `GET  /api/resources/:id`
- `PUT  /api/resources/:id`
- `DELETE /api/resources/:id`

### MODULE 7 — Schedule APIs (2 APIs)
- `PUT  /api/appointment-types/:id/schedule`
- `GET  /api/appointment-types/:id/schedule`

### MODULE 8 — Question APIs (4 APIs)
- `POST /api/appointment-types/:id/questions`
- `GET  /api/appointment-types/:id/questions`
- `PUT  /api/appointment-types/:id/questions/:qid`
- `DELETE /api/appointment-types/:id/questions/:qid`

### MODULE 9 — Booking Rules APIs (2 APIs)
- `PUT  /api/appointment-types/:id/rules`
- `GET  /api/appointment-types/:id/rules`

### MODULE 10 — Slot APIs (2 APIs)
- `GET  /api/appointment-types/:id/slots?date=YYYY-MM-DD`
- `POST /api/appointment-types/:id/slots`

### MODULE 11 — Booking APIs (7 APIs)
- `POST /api/bookings`
- `GET  /api/bookings` (organiser/admin)
- `GET  /api/bookings/my` (customer)
- `GET  /api/bookings/:id`
- `PUT  /api/bookings/:id/reschedule`
- `PUT  /api/bookings/:id/cancel`
- `PUT  /api/bookings/:id/confirm`

### MODULE 12 — Admin Dashboard APIs (1 API)
- `GET  /api/admin/dashboard`

### MODULE 13 — Reports APIs (3 APIs)
- `GET  /api/reports/total-appointments`
- `GET  /api/reports/peak-hours`
- `GET  /api/reports/provider-utilization`

---

## ════════════════════════════════════════════
## MODULE 1 — COPILOT PROMPT: PROJECT SETUP
## ════════════════════════════════════════════

```
You are building the backend for an Appointment Booking System using Node.js and Express.
No database is used — all data lives in an in-memory store (plain JS Maps/Arrays).

Task: Set up the complete project foundation.

1. Create package.json with these dependencies:
   - express, bcryptjs, jsonwebtoken, express-validator, cors, dotenv, uuid

2. Create src/app.js:
   - Express app with JSON body parser, CORS, /api base prefix
   - Global error handler middleware (catches thrown errors, returns { success: false, message })

3. Create src/server.js:
   - Loads .env, starts app on PORT (default 3000), logs startup message

4. Create src/store/index.js:
   - Export a single `store` object with these in-memory arrays (all start empty):
     users, otps, appointmentTypes, resources, schedules, questions, bookingRules, slots, bookings
   - Each array stores plain JS objects

5. Create src/utils/jwt.utils.js:
   - generateToken(payload) → signs JWT with 7d expiry using JWT_SECRET from env
   - verifyToken(token) → returns decoded payload or throws

6. Create src/utils/otp.utils.js:
   - generateOTP() → returns random 6-digit string
   - storeOTP(email, otp, type) → saves to store.otps with 10-minute expiry
   - verifyOTP(email, otp, type) → validates and removes from store
   - For local dev, console.log the OTP as "OTP for <email>: <otp>"

7. Create src/middleware/auth.middleware.js:
   - authenticate: reads Bearer token from Authorization header, verifies JWT,
     attaches decoded user to req.user, returns 401 if invalid

8. Create src/middleware/role.middleware.js:
   - authorize(...roles): middleware factory that checks req.user.role
     is in the allowed roles array, returns 403 if not

9. Create .env.example:
   PORT=3000
   JWT_SECRET=your_secret_key_here

All code must be clean ES modules (require/CommonJS style).
Add JSDoc comments on all exported functions.
Do not create any routes yet — only the foundation.
```

---

## ════════════════════════════════════════════
## MODULE 2 — COPILOT PROMPT: AUTH APIs
## ════════════════════════════════════════════

```
Continue the Appointment Booking System backend.
Foundation (store, JWT utils, OTP utils, middleware) already exists.

Task: Build all 6 Auth APIs.

Create src/routes/auth.routes.js and src/controllers/auth.controller.js.
Register router in app.js at /api/auth.

--- API 1: POST /api/auth/signup ---
Body: { fullName, email, password }
Logic:
  - Validate: fullName required, valid email, password must have min 8 chars,
    at least one uppercase, one lowercase, one special character
  - Check email not already in store.users
  - Hash password with bcrypt (salt 10)
  - Create user: { id: uuid(), fullName, email, password: hashed, role: 'customer',
    isActive: true, isVerified: false, createdAt: new Date() }
  - Generate and store OTP (type: 'signup'), console.log it
  - Return 201: { success: true, message: 'OTP sent to email', userId }

--- API 2: POST /api/auth/verify-otp ---
Body: { email, otp, type }
Logic:
  - Find user by email
  - Call verifyOTP(email, otp, type)
  - If type === 'signup': set user.isVerified = true
  - Return 200: { success: true, message: 'Verified successfully' }

--- API 3: POST /api/auth/login ---
Body: { email, password }
Logic:
  - Find user by email; if not found → 401 "Invalid email or password"
  - Compare password with bcrypt
  - If not match → 401 "Invalid email or password"
  - If isVerified === false → 403 "Please verify your email first"
  - If isActive === false → 403 "Account deactivated"
  - Generate JWT with { userId: user.id, email: user.email, role: user.role }
  - Return 200: { success: true, token, user: { id, fullName, email, role } }

--- API 4: POST /api/auth/forgot-password ---
Body: { email }
Logic:
  - Find user by email; if not found → still return success (security best practice)
  - Generate and store OTP (type: 'reset'), console.log it
  - Return 200: { success: true, message: 'Reset OTP sent if email exists' }

--- API 5: POST /api/auth/reset-password ---
Body: { email, otp, newPassword }
Logic:
  - Validate newPassword strength (same rules as signup)
  - verifyOTP(email, otp, 'reset')
  - Hash newPassword, update user.password
  - Return 200: { success: true, message: 'Password reset successful' }

--- API 6: POST /api/auth/resend-otp ---
Body: { email, type }
Logic:
  - Remove any existing OTP for this email+type from store.otps
  - Generate new OTP, store it, console.log it
  - Return 200: { success: true, message: 'OTP resent' }

All errors use: { success: false, message: '...' } with appropriate HTTP status.
Use express-validator for all input validation.
```

---

## ════════════════════════════════════════════
## MODULE 3 — COPILOT PROMPT: USER/PROFILE APIs
## ════════════════════════════════════════════

```
Continue the Appointment Booking System backend.
Auth APIs and foundation are complete.

Task: Build 3 User/Profile APIs.

Create src/routes/user.routes.js and src/controllers/user.controller.js.
Register at /api/users. All routes require authenticate middleware.

--- API 7: GET /api/users/me ---
Logic:
  - Find user by req.user.userId in store.users
  - Return user object WITHOUT password field
  - Response: { success: true, user: { id, fullName, email, role, isActive, createdAt } }

--- API 8: PUT /api/users/me ---
Body: { fullName } (only fullName is editable by the user themselves)
Logic:
  - Validate fullName is non-empty string if provided
  - Update user.fullName in store
  - Return updated user (without password)

--- API 9: GET /api/users/me/appointments ---
Query params: ?status=upcoming|past|all (default: all)
Logic:
  - Find all bookings in store.bookings where customerId === req.user.userId
  - Join with appointmentTypes to get title, location, duration
  - Filter by status:
      upcoming: booking.date >= today AND booking.status !== 'cancelled'
      past: booking.date < today OR booking.status === 'cancelled'
  - Sort upcoming ASC by date, past DESC by date
  - Return: { success: true, upcoming: [...], past: [...] }
    Each booking: { id, appointmentTitle, date, startTime, endTime,
                    status, location, providerName }
```

---

## ════════════════════════════════════════════
## MODULE 4 — COPILOT PROMPT: ADMIN USER MANAGEMENT APIs
## ════════════════════════════════════════════

```
Continue the Appointment Booking System backend.

Task: Build 3 Admin User Management APIs.

Create src/routes/admin.routes.js (or add to existing).
Register at /api/admin. All routes require authenticate + authorize('admin').

--- API 10: GET /api/admin/users ---
Query: ?role=customer|organiser|admin, ?isActive=true|false, ?search=string
Logic:
  - Return all users from store.users (without passwords)
  - Apply optional filters: role, isActive
  - If search provided: filter by fullName or email containing the search string (case-insensitive)
  - Return: { success: true, total: N, users: [...] }

--- API 11: PUT /api/admin/users/:id/status ---
Body: { isActive: boolean }
Logic:
  - Find user by id; 404 if not found
  - Prevent admin from deactivating themselves
  - Update user.isActive
  - Return: { success: true, message: 'Account status updated', user }

--- API 12: PUT /api/admin/users/:id/role ---
Body: { role: 'customer' | 'organiser' | 'admin' }
Logic:
  - Validate role is one of the three allowed values
  - Find user by id; 404 if not found
  - Prevent admin from changing their own role
  - Update user.role
  - Return: { success: true, message: 'Role updated', user }
```

---

## ════════════════════════════════════════════
## MODULE 5 — COPILOT PROMPT: APPOINTMENT TYPE APIs
## ════════════════════════════════════════════

```
Continue the Appointment Booking System backend.

Task: Build 9 Appointment Type APIs.

Create src/routes/appointment-type.routes.js and src/controllers/appointment-type.controller.js.
Register at /api/appointment-types.

--- API 13: POST /api/appointment-types ---
Auth: authenticate + authorize('organiser', 'admin')
Body: { title, durationMinutes, location, type: 'user'|'resource',
        assignment: 'auto'|'by_visitor', manageCapacity: boolean,
        capacityLimit: number, introMessage, confirmMessage }
Logic:
  - Validate: title required, durationMinutes must be positive integer,
    type must be 'user' or 'resource', assignment must be 'auto' or 'by_visitor'
  - If location is not provided, set it to null (treat as online)
  - Create appointmentType: { id: uuid(), organiserId: req.user.userId,
    title, durationMinutes, location: location||null, type, assignment,
    manageCapacity: manageCapacity||false, capacityLimit: capacityLimit||1,
    isPublished: false, shareToken: uuid(), introMessage: introMessage||'',
    confirmMessage: confirmMessage||'', createdAt: new Date() }
  - Push to store.appointmentTypes
  - Return 201: { success: true, appointmentType }

--- API 14: GET /api/appointment-types ---
Auth: authenticate
Logic:
  - If role === 'admin': return all appointment types
  - If role === 'organiser': return only where organiserId === req.user.userId
  - If role === 'customer': return only where isPublished === true
  - For each, include: upcomingBookingsCount (count of future bookings for that type)
  - Return: { success: true, total: N, appointmentTypes: [...] }

--- API 15: GET /api/appointment-types/:id ---
Auth: authenticate
Logic:
  - Find by id
  - Customer can only access if isPublished === true
  - Organiser can only access their own
  - Admin can access any
  - Return full appointmentType object
  - 404 if not found or not accessible

--- API 16: PUT /api/appointment-types/:id ---
Auth: authenticate + authorize('organiser', 'admin')
Body: any subset of appointmentType fields (partial update)
Logic:
  - Organiser can only update their own
  - Admin can update any
  - Do not allow updating: id, organiserId, shareToken, isPublished, createdAt
  - Merge provided fields into existing record
  - Return updated appointmentType

--- API 17: DELETE /api/appointment-types/:id ---
Auth: authenticate + authorize('organiser', 'admin')
Logic:
  - Organiser can only delete their own
  - Check there are no upcoming (future) confirmed bookings for this type
  - If there are → 409 "Cannot delete: active bookings exist"
  - Remove from store.appointmentTypes
  - Also remove associated: schedules, questions, bookingRules, slots
  - Return: { success: true, message: 'Appointment type deleted' }

--- API 18: POST /api/appointment-types/:id/publish ---
Auth: authenticate + authorize('organiser', 'admin')
Logic:
  - Organiser can only publish their own
  - Check that at least one schedule exists for this appointmentType
  - Set isPublished = true
  - Return: { success: true, message: 'Published', appointmentType }

--- API 19: POST /api/appointment-types/:id/unpublish ---
Auth: authenticate + authorize('organiser', 'admin')
Logic:
  - Set isPublished = false
  - Return: { success: true, message: 'Unpublished', appointmentType }

--- API 20: GET /api/appointment-types/:id/share-link ---
Auth: authenticate + authorize('organiser', 'admin')
Logic:
  - Find appointmentType (organiser: own only)
  - Return: { success: true, shareLink: "/book/<shareToken>", shareToken }

--- API 21: GET /api/appointment-types/:id/preview ---
Auth: authenticate + authorize('organiser', 'admin')
Logic:
  - Return the appointmentType as a customer would see it
  - Include: title, durationMinutes, location, introMessage, confirmMessage,
    type, assignment, manageCapacity, capacityLimit
  - Include schedule (working hours)
  - Include questions list
  - Return: { success: true, preview: { ...appointmentData, schedule, questions } }
```

---

## ════════════════════════════════════════════
## MODULE 6 — COPILOT PROMPT: RESOURCE MANAGEMENT APIs
## ════════════════════════════════════════════

```
Continue the Appointment Booking System backend.

Task: Build 5 Resource Management APIs.

Create src/routes/resource.routes.js and src/controllers/resource.controller.js.
Register at /api/resources.
Auth: authenticate + authorize('organiser', 'admin') for all write operations.
GET operations: authenticate only.

Note from design: Resources have a name, capacity number, and can be linked
to other resources (e.g., Tennis Court 1 links to Court 2, etc.)

--- API 22: POST /api/resources ---
Body: { name, capacity: number, linkedResourceIds: [uuid, ...] (optional) }
Logic:
  - Validate: name required, capacity must be positive integer
  - Validate linkedResourceIds are valid existing resource IDs if provided
  - Create resource: { id: uuid(), organiserId: req.user.userId,
    name, capacity, linkedResourceIds: linkedResourceIds||[], createdAt: new Date() }
  - Return 201: { success: true, resource }

--- API 23: GET /api/resources ---
Auth: authenticate
Logic:
  - Organiser: only their own resources
  - Admin: all resources
  - Optionally filter by ?search=name
  - Return: { success: true, total: N, resources: [...] }

--- API 24: GET /api/resources/:id ---
Logic:
  - Find resource; organiser can only access their own
  - Return: { success: true, resource }

--- API 25: PUT /api/resources/:id ---
Body: { name, capacity, linkedResourceIds }
Logic:
  - Partial update; organiser can only update their own
  - Return updated resource

--- API 26: DELETE /api/resources/:id ---
Logic:
  - Check no upcoming bookings use this resource
  - If so → 409 "Resource in use by active bookings"
  - Remove from store.resources
  - Remove this resourceId from any appointmentType that references it
  - Return: { success: true, message: 'Resource deleted' }
```

---

## ════════════════════════════════════════════
## MODULE 7 — COPILOT PROMPT: SCHEDULE APIs
## ════════════════════════════════════════════

```
Continue the Appointment Booking System backend.

Task: Build 2 Schedule APIs.

Add to src/routes/appointment-type.routes.js or create separate schedule routes.
Register at /api/appointment-types/:id/schedule.
Auth: authenticate. Write: authorize('organiser', 'admin').

Note from design: Schedules can be weekly (Mon-Fri with from/to pairs)
or flexible (individual dates with from/to).
The Excalidraw shows:
  - Day selector: Monday/Tuesday/Wednesday/Thursday/Friday
  - Each day has: From time and To time (e.g., 9:00 to 12:00, 14:00 to 17:00)
  - "Add a Line" means multiple time windows per day are supported

--- API 27: PUT /api/appointment-types/:id/schedule ---
Body:
{
  scheduleType: 'weekly' | 'flexible',
  slots: [
    {
      day: 'monday' | 'tuesday' | ... | 'sunday',  // for weekly
      date: 'YYYY-MM-DD',                           // for flexible
      windows: [{ from: 'HH:MM', to: 'HH:MM' }, ...]
    }
  ]
}
Logic:
  - Validate: appointmentType exists and belongs to organiser
  - Validate: each window from < to, no overlapping windows within same day
  - Upsert schedule in store.schedules (replace if exists)
  - Return: { success: true, schedule }

--- API 28: GET /api/appointment-types/:id/schedule ---
Logic:
  - Find schedule for this appointmentType
  - Return: { success: true, schedule } or 404 if none set yet
```

---

## ════════════════════════════════════════════
## MODULE 8 — COPILOT PROMPT: QUESTION APIs
## ════════════════════════════════════════════

```
Continue the Appointment Booking System backend.

Task: Build 4 Question APIs.

Register at /api/appointment-types/:id/questions.
Auth: Write operations → authenticate + authorize('organiser', 'admin').
Read operations → authenticate.

Note from Excalidraw design:
Answer types available: 'single_line_text', 'multi_line_text', 'phone_number',
'radio', 'checkboxes'

--- API 29: POST /api/appointment-types/:id/questions ---
Body: { question, answerType, mandatory: boolean }
Logic:
  - Validate: question non-empty, answerType in allowed types, mandatory is boolean
  - Get current max order for this appointmentType's questions
  - Create: { id: uuid(), appointmentTypeId, question, answerType,
    mandatory: mandatory||false, order: maxOrder + 1, createdAt: new Date() }
  - Return 201: { success: true, question }

--- API 30: GET /api/appointment-types/:id/questions ---
Logic:
  - Return all questions for this appointmentType sorted by order ASC
  - Customer can only access if appointmentType is published
  - Return: { success: true, questions: [...] }

--- API 31: PUT /api/appointment-types/:id/questions/:qid ---
Body: { question, answerType, mandatory, order }
Logic:
  - Find question by qid and appointmentTypeId
  - Partial update allowed fields
  - If order changes: shift other questions' order to maintain sequence
  - Return updated question

--- API 32: DELETE /api/appointment-types/:id/questions/:qid ---
Logic:
  - Find and remove question
  - Reorder remaining questions to fill the gap
  - Return: { success: true, message: 'Question deleted' }
```

---

## ════════════════════════════════════════════
## MODULE 9 — COPILOT PROMPT: BOOKING RULES APIs
## ════════════════════════════════════════════

```
Continue the Appointment Booking System backend.

Task: Build 2 Booking Rules APIs.

Register at /api/appointment-types/:id/rules.
Auth: Write → authenticate + authorize('organiser', 'admin').

Note from Excalidraw (Misc/Options tab):
  - Manual confirmation toggle
  - Paid Booking toggle + Booking Fees amount + "up to X% of capacity"
  - Slot Creation type
  - Cancellation → "up to HH:MM hour(s) before the booking"

--- API 33: PUT /api/appointment-types/:id/rules ---
Body:
{
  maxBookingsPerSlot: number,
  manualConfirmation: boolean,
  advancePayment: boolean,
  paymentFee: number,            // in rupees
  paymentCapacityPercent: number, // e.g., 50 means up to 50% of capacity
  slotCreationType: 'auto' | 'manual',
  cancellationCutoffHours: number  // decimal, e.g., 1.0 = 1 hour before
}
Logic:
  - Validate appointmentType exists and belongs to organiser
  - Validate all numeric fields are positive
  - Upsert rules in store.bookingRules
  - Return: { success: true, rules }

--- API 34: GET /api/appointment-types/:id/rules ---
Logic:
  - Return booking rules for this appointmentType
  - If no rules set, return defaults:
    { maxBookingsPerSlot: 1, manualConfirmation: false, advancePayment: false,
      paymentFee: 0, paymentCapacityPercent: 100, slotCreationType: 'auto',
      cancellationCutoffHours: 0 }
```

---

## ════════════════════════════════════════════
## MODULE 10 — COPILOT PROMPT: SLOT APIs
## ════════════════════════════════════════════

```
Continue the Appointment Booking System backend.

Task: Build 2 Slot APIs + the core slot generation engine.

Create src/utils/slot.utils.js (the slot generation engine).

Register slot routes at /api/appointment-types/:id/slots.

--- SLOT GENERATION ENGINE (slot.utils.js) ---
Function: generateAvailableSlots(appointmentTypeId, date)
Algorithm:
  1. Load appointmentType, schedule, bookingRules from store
  2. Find the schedule windows for that date:
     - weekly schedule: look up windows for the day of week
     - flexible: look up windows for exact date
  3. For each window, generate slots of appointmentType.durationMinutes size
     e.g., window 9:00–12:00 with 30min duration → [9:00, 9:30, 10:00, 10:30, 11:00, 11:30]
  4. For each generated slot:
     - Count confirmed/pending bookings overlapping that slot time
     - Calculate remaining capacity = maxBookingsPerSlot - bookedCount
     - Mark slot as available if remaining > 0
  5. Return array of slots: [{ startTime, endTime, availableCapacity, isAvailable }]

--- API 35: GET /api/appointment-types/:id/slots ---
Auth: authenticate
Query: ?date=YYYY-MM-DD (required)
Logic:
  - Validate date is a valid future date (not in the past)
  - If type === 'resource': also return which resources are available per slot
  - If type === 'user' and assignment === 'by_visitor': include available users per slot
  - Call generateAvailableSlots(id, date)
  - Return: { success: true, date, slots: [
      { startTime, endTime, availableCapacity, isAvailable, resources?, users? }
    ]}

--- API 36: POST /api/appointment-types/:id/slots ---
Auth: authenticate + authorize('organiser', 'admin')
Body: { date: 'YYYY-MM-DD', startTime: 'HH:MM', endTime: 'HH:MM',
        capacity: number, resourceId?: uuid, userId?: uuid }
Logic:
  - Only allowed when slotCreationType === 'manual' in bookingRules
  - Validate no overlapping manual slot for same resource/user on same date
  - Create slot in store.slots
  - Return 201: { success: true, slot }
```

---

## ════════════════════════════════════════════
## MODULE 11 — COPILOT PROMPT: BOOKING APIs
## ════════════════════════════════════════════

```
Continue the Appointment Booking System backend.

Task: Build 7 Booking APIs — the core transaction engine.

Create src/routes/booking.routes.js and src/controllers/booking.controller.js.
Register at /api/bookings.

--- API 37: POST /api/bookings ---
Auth: authenticate + authorize('customer')
Body: {
  appointmentTypeId, date, startTime, endTime,
  resourceId?: uuid,    // required if type === 'resource' and assignment === 'by_visitor'
  userId?: uuid,        // required if type === 'user' and assignment === 'by_visitor'
  capacity?: number,    // required if manageCapacity === true
  answers: [{ questionId, answer }]
}
Logic:
  - Load appointmentType; must be published
  - Re-validate slot availability using generateAvailableSlots (prevent double booking)
    → Use atomic check: count current bookings for this slot BEFORE inserting
    → If slot full → 409 "Slot fully booked"
  - Validate all mandatory questions have answers
  - Determine initial status:
      manualConfirmation === true → 'pending'
      otherwise → 'confirmed'
  - Determine paymentStatus:
      advancePayment === false → 'not_required'
      otherwise → 'pending_payment'
  - Auto-assign resource/user if assignment === 'auto':
      Find resource/user with fewest bookings on that date
  - Create booking: { id: uuid(), appointmentTypeId, customerId: req.user.userId,
    resourceId, userId, date, startTime, endTime, capacity: capacity||1,
    status, paymentStatus, answers, createdAt: new Date() }
  - Return 201: { success: true, booking, confirmationMessage }

--- API 38: GET /api/bookings ---
Auth: authenticate + authorize('organiser', 'admin')
Query: ?appointmentTypeId, ?status, ?date, ?page=1, ?limit=20
Logic:
  - Organiser: only bookings for their appointmentTypes
  - Admin: all bookings
  - Join with appointmentType, customer user info
  - Return paginated: { success: true, total, page, limit, bookings: [
      { id, appointmentTitle, customerName, date, startTime, endTime,
        status, paymentStatus, resourceName?, userName? }
    ]}

--- API 39: GET /api/bookings/my ---
Auth: authenticate + authorize('customer')
Query: ?status=upcoming|past|all
Logic:
  - Return all bookings for req.user.userId
  - Join with appointmentType for title, location
  - Return: { success: true, bookings: [...] }

--- API 40: GET /api/bookings/:id ---
Auth: authenticate
Logic:
  - Customer: can only access their own booking
  - Organiser: can only access bookings for their appointment types
  - Admin: can access any
  - Return full booking detail including answers, appointmentType info
  - Return: { success: true, booking }

--- API 41: PUT /api/bookings/:id/reschedule ---
Auth: authenticate + authorize('customer')
Body: { date, startTime, endTime }
Logic:
  - Find booking; must belong to customer
  - Status must not be 'cancelled'
  - Check cancellation cutoff: cannot reschedule within cutoffHours of original booking
  - Re-validate new slot availability
  - Update booking: date, startTime, endTime, status to original value
  - Return: { success: true, booking }

--- API 42: PUT /api/bookings/:id/cancel ---
Auth: authenticate
Body: {} (empty)
Logic:
  - Customer: can only cancel their own, check cancellation cutoff
  - Organiser: can cancel any booking in their appointment types
  - Admin: can cancel any
  - Set status = 'cancelled'
  - If paymentStatus === 'paid' → set paymentStatus = 'refund_pending'
  - Return: { success: true, message: 'Booking cancelled', booking }

--- API 43: PUT /api/bookings/:id/confirm ---
Auth: authenticate + authorize('organiser', 'admin')
Logic:
  - Find booking; must be in 'pending' status
  - Organiser: must own the appointmentType
  - Set status = 'confirmed'
  - Return: { success: true, message: 'Booking confirmed', booking }
```

---

## ════════════════════════════════════════════
## MODULE 12 — COPILOT PROMPT: ADMIN DASHBOARD API
## ════════════════════════════════════════════

```
Continue the Appointment Booking System backend.

Task: Build 1 Admin Dashboard API.

Add to src/routes/admin.routes.js.
Auth: authenticate + authorize('admin').

--- API 44: GET /api/admin/dashboard ---
Logic:
  - Compute from in-memory store:
    totalUsers: store.users.length
    totalOrganisers: users with role === 'organiser'
    totalCustomers: users with role === 'customer'
    totalAppointmentTypes: store.appointmentTypes.length
    publishedAppointmentTypes: appointmentTypes where isPublished === true
    totalBookings: store.bookings.length
    pendingBookings: bookings where status === 'pending'
    confirmedBookings: bookings where status === 'confirmed'
    cancelledBookings: bookings where status === 'cancelled'
    todayBookings: bookings where date === today's date
    totalResources: store.resources.length
  - Return: { success: true, stats: { ...all above } }
```

---

## ════════════════════════════════════════════
## MODULE 13 — COPILOT PROMPT: REPORTS APIs
## ════════════════════════════════════════════

```
Continue the Appointment Booking System backend.

Task: Build 3 Reports APIs.

Create src/routes/report.routes.js and src/controllers/report.controller.js.
Register at /api/reports.
Auth: authenticate + authorize('organiser', 'admin').

--- API 45: GET /api/reports/total-appointments ---
Query: ?from=YYYY-MM-DD, ?to=YYYY-MM-DD, ?appointmentTypeId
Logic:
  - Organiser: filter by their appointmentTypes only
  - Admin: all
  - Apply date range filter if provided
  - Return: { success: true, report: {
      total, confirmed, pending, cancelled,
      byAppointmentType: [{ title, count }],
      dailyBreakdown: [{ date, count }]
    }}

--- API 46: GET /api/reports/peak-hours ---
Query: ?from, ?to, ?appointmentTypeId
Logic:
  - Group all bookings by startTime hour (0–23)
  - Count bookings per hour
  - Return sorted by count descending
  - Return: { success: true, peakHours: [
      { hour: '09:00', bookingCount: 45 },
      ...
    ]}

--- API 47: GET /api/reports/provider-utilization ---
Query: ?from, ?to
Logic:
  - For each organiser (role === 'organiser'):
      Calculate total appointment types, total bookings across their types,
      confirmed rate (confirmed/total * 100)
  - For resource-type appointments: also compute per-resource utilization
  - Return: { success: true, utilization: [
      { providerId, providerName, totalAppointmentTypes,
        totalBookings, confirmedRate, resources: [...] }
    ]}
```

---

## ════════════════════════════════════════════
## TEST RUNNER — COPILOT PROMPT
## ════════════════════════════════════════════

```
Continue the Appointment Booking System backend.
All 47 APIs are implemented. Now build the test runner.

Task: Create a comprehensive API test runner that tests ALL 47 APIs
and saves results to tests/results.json.

Create tests/runner.js (Node.js script, no test framework needed, use native fetch).

Test Flow:
  The runner must execute tests IN ORDER because later tests depend on
  data created by earlier ones. Use a shared state object to carry
  tokens, IDs etc. between test cases.

Structure each test as:
{
  module: 'MODULE_NAME',
  name: 'POST /api/auth/signup',
  method, url, headers, body,
  expectedStatus,
  result: { status, body, passed, error, durationMs }
}

Shared state to track:
  - customerToken, organiserToken, adminToken
  - createdUserId, createdOrganiserId
  - appointmentTypeId, resourceId, scheduleId
  - questionId, bookingId, slotDate

Seed data before tests:
  - Create 3 users (1 customer, 1 organiser, 1 admin) via signup + verify + login
  - For admin: manually set role via the admin API after login as first admin
    (seed one admin directly in store before tests start by calling POST /api/auth/signup
     then patching role in a setup step)

For each API test:
  1. Make HTTP request
  2. Compare response status vs expected
  3. Validate key fields in response body
  4. Store duration in milliseconds
  5. Mark passed: true/false

After all tests:
  - Write full results array to tests/results.json
  - Print summary to console:
    "PASSED: X / FAILED: Y / TOTAL: Z"
    List all failed tests with name + actual vs expected status

The results.json format:
{
  "runAt": "ISO timestamp",
  "summary": { "total": 47, "passed": N, "failed": N },
  "modules": [
    {
      "name": "Auth APIs",
      "tests": [ { ...testObject } ]
    }
  ]
}
```

---

## Execution Checklist

| # | Module | APIs | Status |
|---|--------|------|--------|
| 1 | Project Setup | Foundation | ⬜ |
| 2 | Auth APIs | 6 | ⬜ |
| 3 | User/Profile APIs | 3 | ⬜ |
| 4 | Admin User Management | 3 | ⬜ |
| 5 | Appointment Type APIs | 9 | ⬜ |
| 6 | Resource Management | 5 | ⬜ |
| 7 | Schedule APIs | 2 | ⬜ |
| 8 | Question APIs | 4 | ⬜ |
| 9 | Booking Rules APIs | 2 | ⬜ |
| 10 | Slot APIs | 2 | ⬜ |
| 11 | Booking APIs | 7 | ⬜ |
| 12 | Admin Dashboard | 1 | ⬜ |
| 13 | Reports APIs | 3 | ⬜ |
| — | Test Runner | All 47 | ⬜ |

**Total: 47 APIs**

---

*Plan authored by Senior Engineer | Strictly derived from PDF spec + Excalidraw mockup.*
*No extra features added. In-memory store used throughout — swap for DB by replacing store/index.js.*
