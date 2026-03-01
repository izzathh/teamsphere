# TeamSphere Frontend

> Multi-Tenant SaaS Project Management System — React Frontend

Built with **React 18 + Vite + Tailwind CSS + Zustand**, featuring a clean, production-ready architecture with strict multi-tenant data isolation, role-based access control, and a polished UI.

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
- [State Management](#state-management)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Assumptions](#assumptions)

---

## Features

### Core
- **Tenant Registration** — Creates a new organization + Admin user
- **JWT Auth** — Access token (15 min) + Refresh token (7 days) with silent refresh
- **Dashboard** — Aggregated stats with Recharts (bar chart, pie chart, overdue count)
- **Projects Module** — CRUD with pagination, filtering, member management
- **Tasks Module** — CRUD with priority/status filters, overdue detection, per-role editing
- **Team Management** — User invite, role assignment (Admin only), removal
- **Settings** — Profile editing, password change, workspace info + X-Tenant-ID display

### UX
- **Dark / Light theme** toggle (persisted to localStorage)
- **Collapsible sidebar** with keyboard-friendly navigation
- **Toast notifications** (success / error / info / warn)
- **Skeleton loading** states for all tables and stat cards
- **Empty states** with actionable CTAs
- **Confirm dialogs** for destructive actions
- **Responsive** design (mobile-friendly layout)

---

## Tech Stack

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

---

## Project Structure

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

---

## Setup Instructions

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### 1. Clone & Install

```bash
git clone <repo-url>
cd teamsphere-frontend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your backend URL
```

### 3. Run Development Server

```bash
npm run dev
# App runs at http://localhost:3000
```

### 4. Build for Production

```bash
npm run build
npm run preview   # Preview production build locally
```

### 5. Run Tests

```bash
npm test             # Run all tests once
npm run test:coverage   # With coverage report
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Backend API URL (no trailing slash)
VITE_API_URL=http://localhost:5000/api
```

### `.env.example`

```env
VITE_API_URL=http://localhost:5000/api
```

> All variables must be prefixed with `VITE_` to be accessible in the browser via `import.meta.env`.

---

## Architecture & Design Decisions

### Component Architecture
- **Pages** handle data fetching, state, and layout composition
- **Components** are presentational / reusable — no direct API calls except form modals
- **Services** (`api.js`) centralise all API logic with named exports per domain

### CSS Architecture
- **CSS Custom Properties** (design tokens) for theme switching without re-render
- **Tailwind utility classes** for layout and spacing
- **`@layer components`** for reusable patterns (`.btn`, `.card`, `.badge-*`, etc.)
- **Dark mode via `.dark` class** on `<html>`, toggled by Zustand + localStorage

---

## Authentication Flow

```
User submits login form
   ↓
POST /api/auth/login
   ↓
{ accessToken, refreshToken, user, tenant }
   ↓
Stored in Zustand (persisted to localStorage)
   ↓
Axios request interceptor attaches:
   Authorization: Bearer <accessToken>
   X-Tenant-ID: <tenant._id>
   ↓
On 401 response → silent refresh via POST /api/auth/refresh
   ↓
Failed refresh → logout() + redirect to /login
```

Refresh logic is implemented in the Axios response interceptor with a queue to prevent multiple simultaneous refresh calls.

---

## Multi-Tenant Implementation

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

The current tenant is visible in the header bar and in **Settings → Workspace** where the raw `X-Tenant-ID` value is displayed.

---

## Role-Based Access Control

| Feature | Admin | Manager | Employee |
|---|:---:|:---:|:---:|
| View Dashboard | ✅ | ✅ | ✅ |
| View/Filter Projects | ✅ | ✅ | ✅ |
| Create/Edit/Delete Projects | ✅ | ✅ | ❌ |
| View/Filter Tasks | ✅ | ✅ | ✅ |
| Create/Edit/Delete Tasks | ✅ | ✅ | ❌ |
| Update own task status | ✅ | ✅ | ✅ |
| View Team Members | ✅ | ✅ | ❌ |
| Invite Members | ✅ | ❌ | ❌ |
| Change Member Roles | ✅ | ❌ | ❌ |
| Remove Members | ✅ | ❌ | ❌ |

RBAC is enforced at two levels:
1. **Route level** — `<ProtectedRoute allowedRoles={[...]}>` redirects unauthorised users
2. **UI level** — Action buttons/forms hidden for insufficient roles

---

## State Management

### `authStore` (Zustand + persist)
Stores: `user`, `accessToken`, `refreshToken`, `tenant`, `isAuthenticated`

Helpers: `isAdmin()`, `isManager()`, `isEmployee()`, `hasRole(roles[])`

Persisted to `localStorage` under key `teamsphere-auth`.

### `uiStore` (Zustand in-memory)
Stores: `theme`, `sidebarOpen`, `toasts[]`, `modal`

Theme is synced to `localStorage` and `document.documentElement.classList`.

---

## Testing

Tests are written with **Vitest** and **@testing-library/react**.

```bash
npm test
```

### Test Coverage

| File | Tests |
|---|---|
| `helpers.test.js` | `formatDate`, `isOverdue`, `getInitials`, `extractError`, `cn` |
| `authStore.test.js` | Login, logout, role helpers, token update |
| `components.test.jsx` | `Avatar`, `EmptyState`, `Pagination` |

---

## API Documentation

The backend exposes a Swagger UI at `http://localhost:5000/api-docs`.

### Endpoints consumed by the frontend

#### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create tenant + admin user |
| POST | `/auth/login` | Returns access + refresh tokens |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Get current user |

#### Projects
| Method | Path | Description |
|---|---|---|
| GET | `/projects` | List (paginated, filtered) |
| POST | `/projects` | Create (Admin/Manager) |
| GET | `/projects/:id` | Get by ID |
| PUT | `/projects/:id` | Update (Admin/Manager) |
| DELETE | `/projects/:id` | Delete (Admin/Manager) |

#### Tasks
| Method | Path | Description |
|---|---|---|
| GET | `/tasks` | List (paginated, filtered) |
| POST | `/tasks` | Create (Admin/Manager) |
| GET | `/tasks/:id` | Get by ID |
| PUT | `/tasks/:id` | Full update (Admin/Manager) |
| PATCH | `/tasks/:id/status` | Status-only update (Employee) |
| POST | `/tasks/:id/comments` | Add comment |
| DELETE | `/tasks/:id` | Delete (Admin/Manager) |

#### Users
| Method | Path | Description |
|---|---|---|
| GET | `/users` | List tenant users |
| POST | `/users/invite` | Invite member (Admin) |
| PUT | `/users/:id` | Update user (Admin) |
| DELETE | `/users/:id` | Remove user (Admin) |

#### Dashboard
| Method | Path | Description |
|---|---|---|
| GET | `/dashboard/stats` | Aggregated stats |

---

## Assumptions

1. **Backend must be running** at `VITE_API_URL` before using the frontend
2. **Login response shape**: `{ user, accessToken, refreshToken, tenant }`
3. **List response shape**: `{ data: [], total: N }` or `{ tasks/projects/users: [], total: N }`
4. **Tenant object** contains at minimum `{ _id, name }`
5. **User object** contains `{ _id, name, email, role }` where role is `admin | manager | employee`
6. **Task `projectId`** is populated as `{ _id, name }` in list responses
7. **Task `assignedTo`** is populated as `{ _id, name }` in list responses
8. **Date fields** (`dueDate`, `createdAt`) are ISO 8601 strings
9. Employees can update **only** their task's `status` — the form disables all other fields
10. The `X-Tenant-ID` header is required by the backend on all non-auth endpoints
11. Swagger docs are served by the backend at `/api-docs`
12. Password change endpoint accepts `{ currentPassword, newPassword }` — backend validates current password

---

## Browser Support

Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+). No IE support.



# TeamSphere Backend API

> Multi-Tenant SaaS Project Management REST API

Built with **Node.js + Express + MongoDB (Mongoose)**, featuring strict multi-tenant data isolation, JWT authentication with silent refresh, role-based access control, MongoDB aggregation pipelines, and full Swagger/OpenAPI documentation.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Authentication Flow](#authentication-flow)
- [Multi-Tenant Architecture](#multi-tenant-architecture)
- [Role-Based Access Control](#role-based-access-control)
- [MongoDB Schema Design](#mongodb-schema-design)
- [Security Measures](#security-measures)
- [Testing](#testing)
- [Bonus Features](#bonus-features)
- [Assumptions](#assumptions)

---

## Features

### Core
- **Tenant Registration** — Atomic creation of Tenant + Admin user
- **JWT Auth** — Access token (15 min) + Refresh token (7 days)
- **Silent Token Refresh** — `/auth/refresh` endpoint
- **Multi-Tenant Isolation** — Every query scoped to `tenantId`, enforced by middleware
- **X-Tenant-ID Header** — Required on all protected routes; cross-checked against JWT
- **Projects CRUD** — Create, read, update, soft-delete with member management
- **Tasks CRUD** — Full management + status-only endpoint for Employees
- **Comments** — Any role can comment on tasks
- **Overdue Detection** — Virtual field + server-side filtering
- **Dashboard Aggregation** — MongoDB `$group` pipeline for stats
- **Pagination** — All list endpoints support `page` + `limit`
- **Filtering** — Status, priority, project, assignee, overdue, text search
- **Swagger UI** — `http://localhost:5000/api-docs`

### Bonus (Implemented)
- ✅ **Soft Delete** — `isDeleted` flag on all models (projects, tasks, users)
- ✅ **Rate Limiting** — Login endpoint throttled (10 req / 15 min configurable)

---

## Tech Stack

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

```
src/
├── config/
│   ├── database.js        # Mongoose connection with retry + events
│   └── swagger.js         # OpenAPI 3.0 spec definition
├── controllers/
│   ├── authController.js      # register, login, refresh, me
│   ├── projectController.js   # CRUD + member management
│   ├── taskController.js      # CRUD + status patch + comments
│   ├── userController.js      # invite, list, update, delete
│   └── dashboardController.js # MongoDB aggregation
├── middleware/
│   ├── authenticate.js    # JWT verification → req.user, req.tenantId
│   ├── authorize.js       # Role-based access control factory
│   ├── tenant.js          # X-Tenant-ID header validation
│   └── errorHandler.js    # Global error handler + 404
├── models/
│   ├── Tenant.js          # Organization schema
│   ├── User.js            # User schema (bcrypt pre-save hook)
│   ├── Project.js         # Project schema with compound indexes
│   └── Task.js            # Task schema with virtual isOverdue
├── routes/
│   ├── auth.js            # /api/auth/* (with Swagger JSDoc)
│   ├── projects.js        # /api/projects/*
│   ├── tasks.js           # /api/tasks/*
│   ├── users.js           # /api/users/*
│   └── dashboard.js       # /api/dashboard/*
├── utils/
│   ├── jwt.js             # Token generation + verification
│   ├── logger.js          # Winston logger
│   └── response.js        # sendSuccess, sendError, paginate helpers
├── validators/
│   └── index.js           # express-validator rule sets
├── app.js                 # Express app setup (middleware + routes)
└── server.js              # HTTP server entry point
tests/
├── testDb.js              # MongoDB Memory Server helper
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
- MongoDB ≥ 6 (local or Atlas)
- npm ≥ 9

### 1. Clone & Install

```bash
git clone <repo-url>
cd teamsphere-backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values (especially MongoDB URI and JWT secrets)
```

### 3. Run Development Server

```bash
npm run dev
# Server at http://localhost:5000
# Swagger UI at http://localhost:5000/api-docs
```

### 4. Run in Production

```bash
NODE_ENV=production npm start
```

### 5. Run Tests

```bash
npm test                 # All tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:coverage    # With coverage report
```

---

## Environment Variables

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

> **Security**: Never commit `.env` to git. Generate JWT secrets using:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## API Documentation

**Swagger UI**: `http://localhost:5000/api-docs`  
**Raw OpenAPI JSON**: `http://localhost:5000/api-docs.json`  
**Health Check**: `http://localhost:5000/health`

### Quick Reference

#### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create tenant + admin |
| POST | `/api/auth/login` | Public | Get tokens |
| POST | `/api/auth/refresh` | Public | Refresh access token |
| GET | `/api/auth/me` | Bearer | Current user |

#### Projects
| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/api/projects` | All | List (paginated) |
| POST | `/api/projects` | Admin, Manager | Create |
| GET | `/api/projects/:id` | All | Get by ID |
| PUT | `/api/projects/:id` | Admin, Manager | Update |
| DELETE | `/api/projects/:id` | Admin, Manager | Soft-delete |

#### Tasks
| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/api/tasks` | All | List (paginated, filtered) |
| POST | `/api/tasks` | Admin, Manager | Create |
| GET | `/api/tasks/:id` | All | Get by ID |
| PUT | `/api/tasks/:id` | Admin, Manager | Full update |
| PATCH | `/api/tasks/:id/status` | All | Status-only update |
| POST | `/api/tasks/:id/comments` | All | Add comment |
| DELETE | `/api/tasks/:id` | Admin, Manager | Soft-delete |

#### Users
| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/api/users` | Admin, Manager | List team |
| POST | `/api/users/invite` | Admin | Add member |
| GET | `/api/users/:id` | Admin, Manager | Get by ID |
| PUT | `/api/users/:id` | Admin (others), Self (own) | Update |
| DELETE | `/api/users/:id` | Admin | Remove |

#### Dashboard
| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/api/dashboard/stats` | All | Aggregated stats |

---

## Authentication Flow

```
1. POST /api/auth/register  → { accessToken, refreshToken, user, tenant }
2. POST /api/auth/login     → { accessToken, refreshToken, user, tenant }

Every protected request:
  Headers: Authorization: Bearer <accessToken>
           X-Tenant-ID: <tenantId>

3. Access token expires (15 min):
   POST /api/auth/refresh   → { accessToken }
   Body: { refreshToken }
```

### Middleware chain for protected routes

```
Request
  → authenticate()         # verify JWT, attach req.user + req.tenantId
  → requireTenant()        # validate X-Tenant-ID matches user's tenant
  → authorize('admin')     # (optional) role gate
  → controller
```

---

## Multi-Tenant Architecture

### Isolation Strategy

Every document in every collection stores `tenantId`. All queries are **always** filtered by `tenantId`:

```js
// Example — never fetches across tenants
Project.find({ tenantId: req.tenantId, isDeleted: false })
```

### Double-Lock Security

1. **JWT payload** — `tenantId` embedded in token at login
2. **X-Tenant-ID header** — must match the JWT's `tenantId`
   - Mismatch → `403 Tenant ID mismatch`
   - Missing → `400 X-Tenant-ID header is required`

This prevents a compromised token from one tenant being used with a different tenant's ID header.

### Indexes

All models include compound `tenantId` indexes for efficient tenant-scoped queries:

```js
{ tenantId: 1, status: 1, isDeleted: 1 }   // Project & Task list queries
{ tenantId: 1, email: 1 }                   // User uniqueness (per-tenant)
{ tenantId: 1, createdAt: -1 }              // Sorted listing
{ tenantId: 1, dueDate: 1, status: 1 }      // Overdue queries
```

---

## Role-Based Access Control

| Endpoint | Admin | Manager | Employee |
|---|:---:|:---:|:---:|
| Register tenant | ✅ | - | - |
| Login | ✅ | ✅ | ✅ |
| View projects/tasks | ✅ | ✅ | ✅ |
| Create/edit/delete projects | ✅ | ✅ | ❌ |
| Create/edit/delete tasks | ✅ | ✅ | ❌ |
| Update own task status | ✅ | ✅ | ✅ |
| Add task comments | ✅ | ✅ | ✅ |
| List team members | ✅ | ✅ | ❌ |
| Invite members | ✅ | ❌ | ❌ |
| Change member roles | ✅ | ❌ | ❌ |
| Remove members | ✅ | ❌ | ❌ |
| Dashboard stats | ✅ | ✅ | ✅ |

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
Virtual: isOverdue (computed from dueDate vs now)
Indexes: { tenantId, status }, { tenantId, assignedTo }, { tenantId, dueDate, status }
```

---

## Security Measures

| Measure | Implementation |
|---|---|
| Password hashing | bcryptjs with salt rounds=12 |
| JWT signing | HS256 with separate access/refresh secrets |
| Rate limiting | Login: 10 req/15min (configurable) |
| Helmet | Security headers (CSP, HSTS, etc.) |
| CORS | Explicit origin allowlist |
| NoSQL injection | express-mongo-sanitize |
| Input validation | express-validator on all inputs |
| Payload limit | 10kb max body size |
| Password field | `select: false` on User schema |
| Soft delete | Users/projects/tasks never permanently deleted |

---

## Testing

```bash
npm test                   # All 30+ tests
npm run test:coverage      # With coverage
```

### Test structure

| File | Tests | Description |
|---|---|---|
| `unit/jwt.test.js` | 8 | Token gen/verify, wrong secret, token pairs |
| `unit/response.test.js` | 7 | sendSuccess, sendError, paginate |
| `integration/auth.test.js` | 10 | Register, login, refresh, /me |
| `integration/projects.test.js` | 9 | CRUD, filtering, tenant isolation |
| `integration/tasks.test.js` | 10 | CRUD, RBAC, overdue, comments |
| `integration/dashboard.test.js` | 2 | Aggregation accuracy, auth required |

All integration tests use **MongoDB Memory Server** — no external DB needed.

---

## Bonus Features

### Soft Delete
All models (`Tenant`, `User`, `Project`, `Task`) use `isDeleted: false` flag:
- Deleted records are never actually removed
- All queries filter `isDeleted: false`
- Deletion cascades: deleting a project also soft-deletes its tasks

### Rate Limiting on Login
The `POST /api/auth/login` endpoint is protected by `express-rate-limit`:
- Default: 10 requests per 15 minutes per IP
- Returns `429 Too Many Requests` when exceeded
- Configurable via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX` env vars

---

## Assumptions

1. Email uniqueness is **per-tenant** (same email can exist across different tenants)
2. Refresh tokens are **stateless** — not stored in DB (trade-off: can't revoke individual tokens)
3. Password change requires `currentPassword` only when the user updates their own password
4. Admin can change any user's password without `currentPassword` (admin override)
5. Deleting a project **cascades** soft-delete to all its tasks
6. The `members` field in Project stores references; the API validates they belong to the same tenant
7. `assignedTo` and `projectId` in Task are validated against the same tenant
8. Employees assigned to a task can update its status via `PATCH /tasks/:id/status`
9. The Swagger docs are auto-generated from JSDoc comments in route files
10. `isOverdue` on Task is a virtual computed field — not stored in MongoDB