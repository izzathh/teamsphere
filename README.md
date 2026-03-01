# TeamSphere

> Multi-Tenant SaaS Project Management System

A full-stack application built with a **React 18 + Vite + Tailwind CSS + Zustand** frontend and a **Node.js + Express + MongoDB** backend, featuring strict multi-tenant data isolation, JWT authentication with silent refresh, role-based access control, and a polished UI.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Architecture & Design Decisions](#architecture--design-decisions)
- [Authentication Flow](#authentication-flow)
- [Multi-Tenant Implementation](#multi-tenant-implementation)
- [Role-Based Access Control](#role-based-access-control)
- [MongoDB Schema Design](#mongodb-schema-design)
- [Security Measures](#security-measures)
- [State Management](#state-management)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Assumptions](#assumptions)

---

## Features

### Core
- **Tenant Registration** — Atomic creation of a new organization + Admin user
- **JWT Auth** — Access token (15 min) + Refresh token (7 days) with silent refresh
- **Multi-Tenant Isolation** — Every query scoped to `tenantId`, enforced by middleware and `X-Tenant-ID` header
- **Dashboard** — Aggregated stats via MongoDB `$group` pipeline, visualised with Recharts (bar chart, pie chart, overdue count)
- **Projects Module** — CRUD with pagination, filtering, and member management
- **Tasks Module** — Full CRUD + status-only endpoint for Employees, overdue detection, per-role editing
- **Team Management** — User invite, role assignment (Admin only), removal
- **Comments** — Any role can comment on tasks
- **Settings** — Profile editing, password change, workspace info + X-Tenant-ID display
- **Swagger UI** — Auto-generated API docs at `http://localhost:5000/api-docs`

### Bonus (Backend)
- ✅ **Soft Delete** — `isDeleted` flag on all models; deleting a project cascades to its tasks
- ✅ **Rate Limiting** — Login endpoint throttled (10 req / 15 min, configurable)

### UX (Frontend)
- **Dark / Light theme** toggle (persisted to localStorage)
- **Collapsible sidebar** with keyboard-friendly navigation
- **Toast notifications** (success / error / info / warn)
- **Skeleton loading** states for all tables and stat cards
- **Empty states** with actionable CTAs
- **Confirm dialogs** for destructive actions
- **Responsive** design (mobile-friendly layout)

---

## Tech Stack

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build Tool | Vite 5 |
| Routing | React Router v6 |
| State Management | Zustand (with persist middleware) |
| Forms | React Hook Form |
| HTTP Client | Axios (with JWT interceptors) |
| Charts | Recharts |
| Styling | Tailwind CSS v3 |
| Date Utilities | date-fns |
| Testing | Vitest + @testing-library/react |

### Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| Database | MongoDB + Mongoose 8 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | express-validator |
| Documentation | swagger-jsdoc + swagger-ui-express |
| Security | helmet, cors, express-mongo-sanitize, express-rate-limit |
| Logging | winston |
| Testing | Jest + Supertest + mongodb-memory-server |

---

## Project Structure

### Frontend (`teamsphere-frontend/`)

```
src/
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.jsx       # Route guard with role check
│   ├── layout/
│   │   ├── AppLayout.jsx            # Main shell (sidebar + header + outlet)
│   │   ├── Sidebar.jsx              # Collapsible nav with role-filtered links
│   │   └── Header.jsx               # Top bar with tenant badge
│   ├── projects/
│   │   └── ProjectFormModal.jsx     # Create/edit project form
│   ├── tasks/
│   │   └── TaskFormModal.jsx        # Create/edit task form (role-aware)
│   └── ui/
│       ├── Avatar.jsx
│       ├── ConfirmDialog.jsx
│       ├── EmptyState.jsx
│       ├── Modal.jsx
│       ├── Pagination.jsx
│       ├── Spinner.jsx              # Spinner, PageLoader, SkeletonRow, StatCardSkeleton
│       └── Toast.jsx                # Toast notification container
├── hooks/
│   ├── useDebounce.js
│   ├── usePagination.js
│   └── useToast.js
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── DashboardPage.jsx
│   ├── ProjectsPage.jsx
│   ├── ProjectDetailPage.jsx
│   ├── TasksPage.jsx
│   ├── UsersPage.jsx
│   ├── SettingsPage.jsx
│   └── NotFoundPage.jsx
├── services/
│   └── api.js                       # Axios instance + all API modules
├── store/
│   ├── authStore.js                 # Auth state (Zustand + persist)
│   └── uiStore.js                   # Theme, toasts, sidebar (Zustand)
├── test/
│   ├── setup.js
│   ├── helpers.test.js
│   ├── authStore.test.js
│   └── components.test.jsx
├── utils/
│   └── helpers.js                   # Date formatting, initials, error extract
├── App.jsx                          # Route tree
├── main.jsx
└── index.css                        # Tailwind + design tokens (CSS variables)
```

### Backend (`teamsphere-backend/`)

```
src/
├── config/
│   ├── database.js            # Mongoose connection with retry + events
│   └── swagger.js             # OpenAPI 3.0 spec definition
├── controllers/
│   ├── authController.js      # register, login, refresh, me
│   ├── projectController.js   # CRUD + member management
│   ├── taskController.js      # CRUD + status patch + comments
│   ├── userController.js      # invite, list, update, delete
│   └── dashboardController.js # MongoDB aggregation
├── middleware/
│   ├── authenticate.js        # JWT verification → req.user, req.tenantId
│   ├── authorize.js           # Role-based access control factory
│   ├── tenant.js              # X-Tenant-ID header validation
│   └── errorHandler.js        # Global error handler + 404
├── models/
│   ├── Tenant.js              # Organization schema
│   ├── User.js                # User schema (bcrypt pre-save hook)
│   ├── Project.js             # Project schema with compound indexes
│   └── Task.js                # Task schema with virtual isOverdue
├── routes/
│   ├── auth.js                # /api/auth/*
│   ├── projects.js            # /api/projects/*
│   ├── tasks.js               # /api/tasks/*
│   ├── users.js               # /api/users/*
│   └── dashboard.js           # /api/dashboard/*
├── utils/
│   ├── jwt.js                 # Token generation + verification
│   ├── logger.js              # Winston logger
│   └── response.js            # sendSuccess, sendError, paginate helpers
├── validators/
│   └── index.js               # express-validator rule sets
├── app.js                     # Express app setup (middleware + routes)
└── server.js                  # HTTP server entry point
tests/
├── testDb.js                  # MongoDB Memory Server helper
├── unit/
│   ├── jwt.test.js
│   └── response.test.js
└── integration/
    ├── auth.test.js
    ├── projects.test.js
    ├── tasks.test.js
    └── dashboard.test.js
```

---

## Setup Instructions

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- MongoDB ≥ 6 (local or Atlas) — for the backend

---

### Backend

#### 1. Clone & Install

```bash
git clone <repo-url>
cd teamsphere-backend
npm install
```

#### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values (especially MongoDB URI and JWT secrets)
```

#### 3. Run Development Server

```bash
npm run dev
# Server at http://localhost:5000
# Swagger UI at http://localhost:5000/api-docs
```

#### 4. Run in Production

```bash
NODE_ENV=production npm start
```

#### 5. Run Tests

```bash
npm test                    # All tests
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:coverage       # With coverage report
```

---

### Frontend

#### 1. Clone & Install

```bash
git clone <repo-url>
cd teamsphere-frontend
npm install
```

#### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your backend URL
```

#### 3. Run Development Server

```bash
npm run dev
# App runs at http://localhost:3000
```

#### 4. Build for Production

```bash
npm run build
npm run preview   # Preview production build locally
```

#### 5. Run Tests

```bash
npm test                  # Run all tests once
npm run test:coverage     # With coverage report
```

---

## Environment Variables

### Backend (`.env`)

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/teamsphere

# JWT — use long random strings in production
JWT_ACCESS_SECRET=your_super_secret_access_key_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting (login endpoint)
RATE_LIMIT_WINDOW_MS=900000   # 15 minutes in ms
RATE_LIMIT_MAX=10              # max requests per window
```

> **Security**: Never commit `.env` to git. Generate JWT secrets with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### Frontend (`.env`)

```env
# Backend API URL (no trailing slash)
VITE_API_URL=http://localhost:5000/api
```

> All frontend variables must be prefixed with `VITE_` to be accessible via `import.meta.env`.

---

## Architecture & Design Decisions

### Backend
- **Controllers** handle business logic; **routes** define middleware chains
- **Middleware chain**: `authenticate()` → `requireTenant()` → `authorize(role)` → controller
- All list endpoints support `page` + `limit` pagination and domain-specific filters
- MongoDB compound indexes on `tenantId` ensure efficient tenant-scoped queries

### Frontend
- **Pages** handle data fetching, state, and layout composition
- **Components** are presentational / reusable — no direct API calls except form modals
- **Services** (`api.js`) centralise all API logic with named exports per domain

### CSS Architecture (Frontend)
- **CSS Custom Properties** (design tokens) for theme switching without re-render
- **Tailwind utility classes** for layout and spacing
- **`@layer components`** for reusable patterns (`.btn`, `.card`, `.badge-*`, etc.)
- **Dark mode via `.dark` class** on `<html>`, toggled by Zustand + localStorage

---

## Authentication Flow

```
1. POST /api/auth/register  →  { accessToken, refreshToken, user, tenant }
2. POST /api/auth/login     →  { accessToken, refreshToken, user, tenant }

Every protected request:
  Headers: Authorization: Bearer <accessToken>
           X-Tenant-ID: <tenantId>

3. Access token expires (15 min):
   POST /api/auth/refresh   →  { accessToken }
   Body: { refreshToken }

4. On 401 response → frontend silently calls /auth/refresh
5. Failed refresh → logout() + redirect to /login
```

Refresh logic is implemented in the Axios response interceptor with a queue to prevent multiple simultaneous refresh calls.

---

## Multi-Tenant Implementation

### Backend — Double-Lock Security

Every document in every collection stores `tenantId`. All queries are **always** filtered by it:

```js
Project.find({ tenantId: req.tenantId, isDeleted: false })
```

1. **JWT payload** — `tenantId` embedded in token at login
2. **X-Tenant-ID header** — must match the JWT's `tenantId`
   - Mismatch → `403 Tenant ID mismatch`
   - Missing → `400 X-Tenant-ID header is required`

### Frontend

Every authenticated API request automatically includes the `X-Tenant-ID` header:

```js
// src/services/api.js
api.interceptors.request.use((config) => {
  const { accessToken, tenant } = useAuthStore.getState()
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  if (tenant?._id) config.headers['X-Tenant-ID'] = tenant._id
  return config
})
```

The current tenant is visible in the header bar and in **Settings → Workspace**.

### Database Indexes

```js
{ tenantId: 1, status: 1, isDeleted: 1 }   // Project & Task list queries
{ tenantId: 1, email: 1 }                   // User uniqueness (per-tenant)
{ tenantId: 1, createdAt: -1 }              // Sorted listing
{ tenantId: 1, dueDate: 1, status: 1 }      // Overdue queries
```

---

## Role-Based Access Control

| Feature | Admin | Manager | Employee |
|---|:---:|:---:|:---:|
| View Dashboard | ✅ | ✅ | ✅ |
| View / Filter Projects | ✅ | ✅ | ✅ |
| Create / Edit / Delete Projects | ✅ | ✅ | ❌ |
| View / Filter Tasks | ✅ | ✅ | ✅ |
| Create / Edit / Delete Tasks | ✅ | ✅ | ❌ |
| Update own task status | ✅ | ✅ | ✅ |
| Add task comments | ✅ | ✅ | ✅ |
| View Team Members | ✅ | ✅ | ❌ |
| Invite Members | ✅ | ❌ | ❌ |
| Change Member Roles | ✅ | ❌ | ❌ |
| Remove Members | ✅ | ❌ | ❌ |

RBAC is enforced at two levels:
1. **Backend** — `authorize('admin', 'manager')` middleware on routes
2. **Frontend** — `<ProtectedRoute allowedRoles={[...]}>` redirects unauthorised users; action buttons/forms are hidden for insufficient roles

---

## MongoDB Schema Design

### Tenant
```
{ name, slug, plan, isActive, isDeleted, deletedAt }
```

### User
```
{ tenantId*, name, email, password (hashed), role, isActive, isDeleted, lastLoginAt }
Unique index: { tenantId, email }   ← email unique per tenant, not globally
```

### Project
```
{ tenantId*, name, description, status, members: [userId], createdBy, isDeleted }
Indexes: { tenantId, status, isDeleted }, { tenantId, createdAt: -1 }
```

### Task
```
{ tenantId*, projectId, title, description, status, priority, assignedTo,
  dueDate, comments: [{ text, author, createdAt }], createdBy, isDeleted }
Virtual: isOverdue (computed from dueDate vs now — not stored in DB)
Indexes: { tenantId, status }, { tenantId, assignedTo }, { tenantId, dueDate, status }
```

---

## Security Measures

| Measure | Implementation |
|---|---|
| Password hashing | bcryptjs with salt rounds = 12 |
| JWT signing | HS256 with separate access / refresh secrets |
| Rate limiting | Login: 10 req / 15 min (configurable) |
| Helmet | Security headers (CSP, HSTS, etc.) |
| CORS | Explicit origin allowlist |
| NoSQL injection | express-mongo-sanitize |
| Input validation | express-validator on all inputs |
| Payload limit | 10 KB max body size |
| Password field | `select: false` on User schema |
| Soft delete | Users / projects / tasks never permanently deleted |

---

## State Management (Frontend)

### `authStore` (Zustand + persist)
Stores: `user`, `accessToken`, `refreshToken`, `tenant`, `isAuthenticated`

Helpers: `isAdmin()`, `isManager()`, `isEmployee()`, `hasRole(roles[])`

Persisted to `localStorage` under key `teamsphere-auth`.

### `uiStore` (Zustand in-memory)
Stores: `theme`, `sidebarOpen`, `toasts[]`, `modal`

Theme is synced to `localStorage` and `document.documentElement.classList`.

---

## API Documentation

**Swagger UI**: `http://localhost:5000/api-docs`  
**Raw OpenAPI JSON**: `http://localhost:5000/api-docs.json`  
**Health Check**: `http://localhost:5000/health`

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create tenant + admin |
| POST | `/api/auth/login` | Public | Get tokens |
| POST | `/api/auth/refresh` | Public | Refresh access token |
| GET | `/api/auth/me` | Bearer | Current user |

### Projects
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/projects` | All | List (paginated, filtered) |
| POST | `/api/projects` | Admin, Manager | Create |
| GET | `/api/projects/:id` | All | Get by ID |
| PUT | `/api/projects/:id` | Admin, Manager | Update |
| DELETE | `/api/projects/:id` | Admin, Manager | Soft-delete |

### Tasks
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/tasks` | All | List (paginated, filtered) |
| POST | `/api/tasks` | Admin, Manager | Create |
| GET | `/api/tasks/:id` | All | Get by ID |
| PUT | `/api/tasks/:id` | Admin, Manager | Full update |
| PATCH | `/api/tasks/:id/status` | All | Status-only update |
| POST | `/api/tasks/:id/comments` | All | Add comment |
| DELETE | `/api/tasks/:id` | Admin, Manager | Soft-delete |

### Users
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/users` | Admin, Manager | List team |
| POST | `/api/users/invite` | Admin | Add member |
| GET | `/api/users/:id` | Admin, Manager | Get by ID |
| PUT | `/api/users/:id` | Admin (others), Self (own) | Update |
| DELETE | `/api/users/:id` | Admin | Remove |

### Dashboard
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/dashboard/stats` | All | Aggregated stats |

---

## Testing

### Frontend

```bash
npm test                  # Run all tests (Vitest)
npm run test:coverage     # With coverage report
```

| File | Tests |
|---|---|
| `helpers.test.js` | `formatDate`, `isOverdue`, `getInitials`, `extractError`, `cn` |
| `authStore.test.js` | Login, logout, role helpers, token update |
| `components.test.jsx` | `Avatar`, `EmptyState`, `Pagination` |

### Backend

```bash
npm test                    # All 30+ tests (Jest + Supertest)
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:coverage       # With coverage report
```

| File | Tests | Description |
|---|---|---|
| `unit/jwt.test.js` | 8 | Token gen/verify, wrong secret, token pairs |
| `unit/response.test.js` | 7 | sendSuccess, sendError, paginate |
| `integration/auth.test.js` | 10 | Register, login, refresh, /me |
| `integration/projects.test.js` | 9 | CRUD, filtering, tenant isolation |
| `integration/tasks.test.js` | 10 | CRUD, RBAC, overdue, comments |
| `integration/dashboard.test.js` | 2 | Aggregation accuracy, auth required |

All backend integration tests use **MongoDB Memory Server** — no external database required.

---

## Assumptions

### Shared
1. **Login response shape**: `{ user, accessToken, refreshToken, tenant }`
2. **List response shape**: `{ data: [], total: N }` or `{ tasks/projects/users: [], total: N }`
3. **Tenant object** contains at minimum `{ _id, name }`
4. **User object** contains `{ _id, name, email, role }` where role is `admin | manager | employee`
5. **Date fields** (`dueDate`, `createdAt`) are ISO 8601 strings
6. The `X-Tenant-ID` header is required on all non-auth endpoints

### Backend
7. Email uniqueness is **per-tenant** (same email can exist across different tenants)
8. Refresh tokens are **stateless** — not stored in DB (trade-off: cannot revoke individual tokens)
9. Password change requires `currentPassword` only when a user updates their own password; Admins can change any user's password without it
10. Deleting a project **cascades** soft-delete to all its tasks
11. The `members` field in Project is validated to ensure all users belong to the same tenant
12. `assignedTo` and `projectId` in Task are validated against the same tenant
13. `isOverdue` on Task is a virtual computed field — not stored in MongoDB

### Frontend
14. **Task `projectId`** is populated as `{ _id, name }` in list responses
15. **Task `assignedTo`** is populated as `{ _id, name }` in list responses
16. Employees can update **only** their task's `status` — the form disables all other fields
17. Swagger docs are served by the backend at `/api-docs`

---

## Browser Support

Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+). No IE support.