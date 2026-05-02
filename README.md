# Appointly - Modern Appointment Booking System

Appointly is a high-performance, full-stack appointment scheduling platform designed for seamless interaction between service providers and customers. It features a robust multi-step booking workflow, real-time availability management, and integrated payment processing.

## 🚀 Key Features

- **Multi-Step Booking Workflow**: Smooth transition from Provider selection to Date/Time selection and Additional Info collection.
- **Real-time Availability**: Intelligent slot management that checks capacity and existing bookings to prevent double-booking.
- **Payment Integration**: Secure mock payment flow with support for partial/full payments based on booking rules.
- **Admin Dashboard**: Comprehensive tools for service providers to manage their schedules, services, and appointment history.
- **Automated OTP Verification**: Secure signup and password reset flow using OTPs.
- **Responsive Design**: Premium, modern UI with dark mode support and smooth animations.

## 🛠️ Tech Stack

### Frontend
- **React (TypeScript)**: For building a type-safe, component-based UI.
- **Vite**: Ultra-fast build tool and development server.
- **React Router**: For seamless single-page application navigation.
- **Axios**: For reliable API communication.
- **CSS3 (Vanilla)**: Custom, high-performance styling with modern variables.

### Backend
- **Node.js & Express**: Scalable server-side logic and RESTful API.
- **Prisma ORM**: Modern database access and schema management.
- **PostgreSQL**: Production-ready relational database.
- **JWT**: Secure session-based authentication.

---

## 📂 Project Structure

```text
├── Backend/
│   ├── prisma/            # Database schema and migrations
│   ├── src/
│   │   ├── controllers/   # Business logic
│   │   ├── routes/        # API endpoints
│   │   ├── utils/         # Helper functions (slots, etc.)
│   │   └── app.js         # Express configuration
│   └── .env.example       # Environment template
└── frontend/
    ├── src/
    │   ├── api/           # API services (axios instances)
    │   ├── components/    # Reusable UI components
    │   ├── pages/         # Page-level components
    │   └── assets/        # Styles and static files
    └── package.json
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL

### 1. Clone the Repository
```bash
git clone https://github.com/DevSidd2006/Odoo-VIT-44.git
cd Odoo-VIT-44
```

### 2. Backend Setup
```bash
cd Backend
npm install
cp .env.example .env
```
Update `.env` with your `DATABASE_URL` and `JWT_SECRET`.

**Initialize Database:**
```bash
npx prisma migrate dev --name init
npx prisma generate
```

**Start Server:**
```bash
npm start
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

---

## 📖 API Documentation

### Authentication
- `POST /api/auth/signup`: Register a new user.
- `POST /api/auth/login`: Authenticate and receive JWT.
- `POST /api/auth/verify-otp`: Verify account via OTP.

### Services
- `GET /api/services`: List all published services.
- `GET /api/services/:id`: Get detailed service info.

### Appointments
- `GET /api/appointments/availability`: Fetch available slots for a date/provider.
- `POST /api/appointments/book`: Create a new appointment (PENDING).
- `POST /api/appointments/:id/reschedule`: Change appointment time.

### Payments
- `POST /api/payments/create`: Generate a payment record for an appointment.
- `POST /api/payments/:id/complete`: Confirm payment and set appointment to CONFIRMED.

---

## 🗄️ Database Schema

The core schema includes:
- **User**: Unified table for Admins, Customers, and Providers.
- **Service**: Service definitions with pricing and configuration.
- **ScheduleSlot**: Reusable time slots for providers.
- **Appointment**: The central record linking all entities.
- **Payment**: Financial records linked to bookings.

---

## 🎨 Design System

Appointly uses a custom CSS variables-based design system:
- **Primary Color**: `#6366f1` (Indigo/Accent)
- **Background**: `#0f172a` (Deep Navy)
- **Cards**: Glassmorphism effect with subtle borders.
- **Animations**: `animate-fade-in` and `animate-slide-up` for premium feel.

---

## 🤝 Contributing
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
