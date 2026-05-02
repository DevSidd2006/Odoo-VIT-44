# Architecture Overview - Appointly

## Core Principles
The system is built on a modular architecture separating concerns between the database (ORM), business logic (Controllers), and API exposure (Routes).

## Backend Design
### 1. Slot Management System
The most complex part of the system is the **Availability Engine**.
- **Templates**: `ScheduleSlot` acts as a template (e.g., "Mondays at 09:00").
- **Resolution**: When a user queries a specific date, the `getAvailability` controller calculates the actual availability by:
  - Fetching slots for that day of the week.
  - Querying the `Appointment` table for any records matching that specific date and time.
  - Comparing the `bookedCount` against the slot's `capacity`.

### 2. Appointment Lifecycle
- **PENDING**: Created immediately after the user selects a slot.
- **CONFIRMED**: Promoted automatically after a successful payment or manual admin approval.
- **CANCELLED**: Marks the slot as available again for that specific date.

### 3. Database Layer
Using **Prisma** allows for:
- Type-safe queries across the entire codebase.
- Easy schema migrations as the project evolves.
- Optimized joins for fetching complex relations (e.g., Service -> Provider -> User Profile).

## Frontend Design
### 1. Multi-Step Flow Control
Managed via a central state in `BookAppointment.tsx`. Each step validates its own data before allowing the user to proceed:
- **Step 1**: Provider selection ensures a valid `providerId`.
- **Step 2**: Date selection triggers the `fetchSlots` API call.
- **Step 3**: Dynamic question rendering based on the `service.questions` array.
- **Step 4**: Payment summary with real-time tax calculation.

### 2. State Persistence
The flow uses `React.useState` for ephemeral booking data and `location.state` for passing context between different parts of the application (like rescheduling).

## Security
- **Authentication**: JWT-based stateless authentication.
- **Data Integrity**: Backend validation on every booking attempt to prevent invalid dates or overbooking.
- **Transaction Safety**: Payments are linked directly to unique `Appointment` IDs.
