# Backend API Documentation

This document provides a comprehensive summary of all APIs available in the backend, including their expected inputs and outputs.

## Base URL
All endpoints are prefixed with `/api`.

---

## 1. Authentication APIs (`/api/auth`)

### `POST /api/auth/signup`
Creates a new user account and sends an OTP to their email.
- **Input (Body):**
  - `fullName` (string): User's full name.
  - `email` (string): Valid email address.
  - `password` (string): Strong password (min 8 chars, 1 uppercase, 1 lowercase, 1 special).
- **Output:**
  - `201 Created`: `{ "success": true, "message": "OTP sent to email", "userId": "uuid" }`

### `POST /api/auth/verify-otp`
Verifies OTP for signup or password reset.
- **Input (Body):**
  - `email` (string): Registered email address.
  - `otp` (string): 6-digit OTP code.
  - `type` (string): `'signup'` or `'reset'`.
- **Output:**
  - `200 OK`: `{ "success": true, "message": "Verified successfully" }`

### `POST /api/auth/login`
Authenticates a user and returns a JWT token.
- **Input (Body):**
  - `email` (string): Registered email address.
  - `password` (string): User password.
- **Output:**
  - `200 OK`: `{ "success": true, "token": "jwt_token", "user": { "id": "...", "fullName": "...", "email": "...", "role": "..." } }`

### `POST /api/auth/forgot-password`
Initiates password reset by sending an OTP.
- **Input (Body):**
  - `email` (string): Registered email address.
- **Output:**
  - `200 OK`: `{ "success": true, "message": "Reset OTP sent if email exists" }`

### `POST /api/auth/reset-password`
Resets the user's password using an OTP.
- **Input (Body):**
  - `email` (string): Registered email address.
  - `otp` (string): 6-digit OTP code.
  - `newPassword` (string): New strong password.
- **Output:**
  - `200 OK`: `{ "success": true, "message": "Password reset successful" }`

### `POST /api/auth/resend-otp`
Resends the OTP for the given type.
- **Input (Body):**
  - `email` (string): Registered email address.
  - `type` (string): `'signup'` or `'reset'`.
- **Output:**
  - `200 OK`: `{ "success": true, "message": "OTP resent" }`

---

## 2. Admin APIs (`/api/admin`)

### `GET /api/admin/dashboard`
Fetches global dashboard statistics for admin.
- **Input:** None
- **Output:**
  - `200 OK`: `{ "success": true, "stats": { "totalUsers": 0, "totalOrganisers": 0, "totalBookings": 0, ... } }`

### `GET /api/admin/users`
Lists all users with optional filtering.
- **Input (Query Options):**
  - `role` (string): `'customer'`, `'organiser'`, or `'admin'`.
  - `isActive` (boolean): `true` or `false`.
  - `search` (string): Search query for name or email.
- **Output:**
  - `200 OK`: `{ "success": true, "total": 1, "users": [{ "id": "...", "fullName": "...", "email": "...", "role": "...", "isActive": true, "createdAt": "..." }] }`

### `PUT /api/admin/users/:id/status`
Activates or deactivates a user account.
- **Input (Params/Body):**
  - `id` (param): User ID.
  - `isActive` (boolean): Target status.
- **Output:**
  - `200 OK`: `{ "success": true, "message": "Account status updated", "user": { ... } }`

### `PUT /api/admin/users/:id/role`
Updates a user's role.
- **Input (Params/Body):**
  - `id` (param): User ID.
  - `role` (string): `'customer'`, `'organiser'`, or `'admin'`.
- **Output:**
  - `200 OK`: `{ "success": true, "message": "Role updated", "user": { ... } }`

---

## 3. Appointment Types APIs (`/api/appointment-types`)

### `POST /api/appointment-types`
Creates a new appointment type.
- **Input (Body):** Standard appointment type fields (e.g., `title`, `description`, `type`, `location`).
- **Output:** `{ "success": true, "appointmentType": { ... } }`

### `GET /api/appointment-types`
Lists available appointment types.
- **Input:** None
- **Output:** `{ "success": true, "appointmentTypes": [...] }`

### `GET /api/appointment-types/:id`
Gets a specific appointment type's details.
- **Input (Param):** `id` (string)
- **Output:** `{ "success": true, "appointmentType": { ... } }`

### `PUT /api/appointment-types/:id`
Updates an appointment type.
- **Input (Param/Body):** `id` (string), Update payload.
- **Output:** `{ "success": true, "appointmentType": { ... } }`

### `PUT /api/appointment-types/:id/schedule`
Upserts a schedule for the appointment type.
- **Input (Param/Body):** `id` (string), Schedule object.
- **Output:** `{ "success": true, "message": "Schedule updated successfully" }`

### `GET /api/appointment-types/:id/schedule`
Retrieves schedule of an appointment type.
- **Input (Param):** `id` (string)
- **Output:** `{ "success": true, "schedule": { ... } }`

### `PUT /api/appointment-types/:id/rules`
Upserts booking rules.
- **Input (Param/Body):** `id` (string), Booking Rules object.
- **Output:** `{ "success": true, "rules": { ... } }`

### `GET /api/appointment-types/:id/rules`
Retrieves booking rules.
- **Input (Param):** `id` (string)
- **Output:** `{ "success": true, "rules": { ... } }`

### `GET /api/appointment-types/:id/slots`
Generates and lists available slots for a specific date.
- **Input (Param/Query):** `id` (string), `date` (YYYY-MM-DD).
- **Output:** `{ "success": true, "date": "YYYY-MM-DD", "slots": [...] }`

### `POST /api/appointment-types/:id/slots`
Creates a manual slot for the given appointment type.
- **Input (Param/Body):** `id` (string), `{ date, startTime, endTime, capacity, resourceId, userId }`.
- **Output:** `{ "success": true, "slot": { ... } }`

### `POST /api/appointment-types/:id/questions`
Adds a custom question to the appointment type.
- **Input (Param/Body):** `id` (string), Question payload.
- **Output:** `{ "success": true, "question": { ... } }`

### `GET /api/appointment-types/:id/questions`
Lists all questions for the appointment type.
- **Input (Param):** `id` (string)
- **Output:** `{ "success": true, "questions": [...] }`

### `PUT /api/appointment-types/:id/questions/:qid`
Updates a question.
- **Input (Params/Body):** `id`, `qid`, Question updates.
- **Output:** `{ "success": true, "question": { ... } }`

### `DELETE /api/appointment-types/:id/questions/:qid`
Deletes a question.
- **Input (Params):** `id`, `qid`
- **Output:** `{ "success": true, "message": "Question deleted successfully" }`

### `DELETE /api/appointment-types/:id`
Deletes an appointment type.
- **Input (Param):** `id` (string)
- **Output:** `{ "success": true, "message": "Appointment type deleted successfully" }`

### `POST /api/appointment-types/:id/publish`
Publishes an appointment type to make it public.
- **Input (Param):** `id` (string)
- **Output:** `{ "success": true, "message": "Published successfully" }`

### `POST /api/appointment-types/:id/unpublish`
Unpublishes an appointment type.
- **Input (Param):** `id` (string)
- **Output:** `{ "success": true, "message": "Unpublished successfully" }`

### `GET /api/appointment-types/:id/share-link`
Gets the shareable link for an appointment type.
- **Input (Param):** `id` (string)
- **Output:** `{ "success": true, "link": "..." }`

### `GET /api/appointment-types/:id/preview`
Gets the preview metadata for an appointment type.
- **Input (Param):** `id` (string)
- **Output:** `{ "success": true, "preview": { ... } }`

---

## 4. User APIs (`/api/users`)

### `GET /api/users/me`
Fetches the currently authenticated user's profile.
- **Input:** None
- **Output:**
  - `200 OK`: `{ "success": true, "user": { "id": "...", "fullName": "...", "email": "...", "role": "...", "isActive": true, "createdAt": "..." } }`

### `PUT /api/users/me`
Updates the authenticated user's profile.
- **Input (Body):**
  - `fullName` (string): New full name.
- **Output:**
  - `200 OK`: `{ "success": true, "user": { ...updated profile } }`

### `GET /api/users/me/appointments`
Fetches user's appointments (bookings).
- **Input (Query):**
  - `status` (string, optional): `'upcoming'`, `'past'`, or `'all'`.
- **Output:**
  - `200 OK`: `{ "success": true, "upcoming": [...], "past": [...] }`

---

## 5. Resources APIs (`/api/resources`)

### `POST /api/resources`
Creates a new resource.
- **Input (Body):** Resource details (e.g., name, capacity, type).
- **Output:** `{ "success": true, "resource": { ... } }`

### `GET /api/resources`
Lists all resources.
- **Input:** None
- **Output:** `{ "success": true, "resources": [...] }`

### `GET /api/resources/:id`
Retrieves a specific resource.
- **Input (Param):** `id` (string)
- **Output:** `{ "success": true, "resource": { ... } }`

### `PUT /api/resources/:id`
Updates a resource.
- **Input (Param/Body):** `id` (string), Resource updates.
- **Output:** `{ "success": true, "resource": { ... } }`

### `DELETE /api/resources/:id`
Deletes a resource.
- **Input (Param):** `id` (string)
- **Output:** `{ "success": true, "message": "Resource deleted successfully" }`

---

## 6. Bookings APIs (`/api/bookings`)

### `POST /api/bookings`
Creates a new booking.
- **Input (Body):** Booking payload (appointmentTypeId, date, time slot, etc.)
- **Output:** `{ "success": true, "booking": { ... } }`

### `GET /api/bookings`
Lists bookings (accessible by organisers for their types, and admin for all).
- **Input:** None
- **Output:** `{ "success": true, "bookings": [...] }`

### `GET /api/bookings/my`
Gets the authenticated customer's bookings.
- **Input:** None
- **Output:** `{ "success": true, "bookings": [...] }`

### `GET /api/bookings/:id`
Retrieves a specific booking by ID.
- **Input (Param):** `id` (string)
- **Output:** `{ "success": true, "booking": { ... } }`

### `PUT /api/bookings/:id/reschedule`
Reschedules a booking to a new time.
- **Input (Param/Body):** `id` (string), Reschedule payload.
- **Output:** `{ "success": true, "message": "Booking rescheduled successfully", "booking": { ... } }`

### `PUT /api/bookings/:id/cancel`
Cancels an existing booking.
- **Input (Param):** `id` (string)
- **Output:** `{ "success": true, "message": "Booking cancelled successfully", "booking": { ... } }`

### `PUT /api/bookings/:id/confirm`
Confirms a pending booking (Organiser/Admin).
- **Input (Param):** `id` (string)
- **Output:** `{ "success": true, "message": "Booking confirmed successfully", "booking": { ... } }`

---

## 7. Reports APIs (`/api/reports`)

### `GET /api/reports/total-appointments`
Fetches the total appointments report.
- **Input:** Query parameters for date range/filters.
- **Output:** `{ "success": true, "report": [...] }`

### `GET /api/reports/peak-hours`
Fetches the peak hours report.
- **Input:** Query parameters for date range/filters.
- **Output:** `{ "success": true, "report": [...] }`

### `GET /api/reports/provider-utilization`
Fetches provider utilization report.
- **Input:** Query parameters.
- **Output:** `{ "success": true, "report": [...] }`

---

## 8. Dev/Testing APIs (`/api/dev`)
*These routes are only available when `NODE_ENV !== 'production'`.*

### `POST /api/dev/reset`
Resets the entire in-memory store.
- **Input:** None
- **Output:** `{ "success": true, "message": "Store reset" }`

### `GET /api/dev/otp/:email`
Fetches the latest OTP for an email address (used for testing flow).
- **Input (Param):** `email` (string)
- **Output:** `{ "success": true, "otp": "123456", "type": "signup" }`
