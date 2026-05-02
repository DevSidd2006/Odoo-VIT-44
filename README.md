# Management Web App Structure

This workspace is scaffolded as a clean, scalable structure for a management web application.

## Layout

```text
frontend/
  public/
  src/
    app/
    assets/
    components/
    features/
    hooks/
    layouts/
    pages/
    services/
    store/
    styles/
    utils/
  tests/

backend/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
    utils/
  tests/

shared/
  constants/
  types/

docs/
```

## Purpose

- `frontend`: user interface, screens, shared UI pieces, and client-side state.
- `backend`: API, business logic, persistence, and request handling.
- `shared`: common types and constants used by both sides.
- `docs`: project notes, API docs, and product guidance.

If you want, I can next turn this into a specific stack such as React + Node/Express, Next.js, or Vue + NestJS.
