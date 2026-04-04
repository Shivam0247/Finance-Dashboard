# Implementation Plan: Finance Dashboard

## Overview

Incremental implementation of a full-stack Finance Dashboard: Node.js/Express/PostgreSQL backend with JWT auth, RBAC, and REST API, followed by a React/Vite/Tailwind frontend with role-gated UI and interactive charts. Each task builds on the previous, ending with full integration.

## Tasks

- [ ] 1. Backend project setup and core infrastructure
  - Initialize `backend/` with `npm init`, install dependencies: `express`, `pg`, `bcryptjs`, `jsonwebtoken`, `zod`, `helmet`, `cors`, `express-rate-limit`, `dotenv`
  - Install dev dependencies: `typescript`, `ts-node`, `@types/*`, `jest`, `supertest`, `fast-check`, `ts-jest`
  - Create `tsconfig.json`, `jest.config.ts`, and directory structure: `src/controllers`, `src/routes`, `src/middleware`, `src/validators`, `src/utils`, `src/database`
  - Create `.env.example` with `DATABASE_URL`, `JWT_SECRET`, `PORT`
  - _Requirements: 12.1, 12.2, 12.3, 13.1, 13.2_

- [ ] 2. Database migration script
  - [ ] 2.1 Create `src/database/pool.ts` exporting a `pg.Pool` configured from `DATABASE_URL`
    - _Requirements: 8.5_
  - [ ] 2.2 Create `src/database/migrate.ts` with `CREATE TABLE IF NOT EXISTS` for `users` and `transactions` tables matching the schema in the design
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 3. TypeScript types, Zod validators, and AppError
  - [ ] 3.1 Create `src/utils/types.ts` with `Role`, `User`, `PublicUser`, `Transaction`, `JwtPayload`, `PaginatedResult`, and DTO interfaces
    - _Requirements: 4.1, 7.1_
  - [ ] 3.2 Create `src/utils/AppError.ts` with the `AppError` class extending `Error` with `status` field
    - _Requirements: 11.1, 11.2_
  - [ ] 3.3 Create `src/validators/schemas.ts` with all Zod schemas: `loginSchema`, `transactionSchema`, `transactionQuerySchema`, `updateRoleSchema`, `updateStatusSchema`
    - _Requirements: 1.4, 4.2, 5.6, 7.4_

- [ ] 4. Core middleware
  - [ ] 4.1 Create `src/middleware/authenticate.ts` — JWT auth middleware that verifies `Authorization: Bearer` token and attaches decoded payload to `req.user`
    - _Requirements: 2.1, 2.2, 2.3_
  - [ ] 4.2 Write property test for JWT auth middleware
    - **Property 5: Unauthenticated requests to protected routes always yield 401**
    - **Validates: Requirements 2.1, 2.2**
  - [ ] 4.3 Create `src/middleware/requireRoles.ts` — `requireRoles(...roles: Role[])` factory returning Express middleware that checks `req.user.role`
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ] 4.4 Write property test for RoleGuard middleware
    - **Property 6: Role guard enforces permissions universally**
    - **Validates: Requirements 3.1, 3.2, 7.5**
  - [ ] 4.5 Create `src/middleware/validate.ts` — `validate(schema)` factory that runs Zod parse and returns 400 with `{ message, errors }` on failure
    - _Requirements: 1.4, 4.2, 11.1_
  - [ ] 4.6 Create `src/middleware/errorHandler.ts` — centralized Express error handler that returns `{ message }` JSON, never exposes stack traces
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 5. AuthService and auth routes
  - [ ] 5.1 Create `src/controllers/AuthService.ts` implementing `login`, `hashPassword`, and `verifyToken` using `bcryptjs` and `jsonwebtoken`
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 1.7_
  - [ ] 5.2 Write property test for login response fields
    - **Property 1: Login response contains required fields**
    - **Validates: Requirements 1.1, 1.6**
  - [ ] 5.3 Write property test for invalid credentials
    - **Property 2: Invalid credentials always yield 401**
    - **Validates: Requirements 1.2, 1.3**
  - [ ] 5.4 Write property test for password storage
    - **Property 3: Password storage is always hashed**
    - **Validates: Requirements 1.5**
  - [ ] 5.5 Write property test for inactive user rejection
    - **Property 4: Inactive users are always rejected with 403**
    - **Validates: Requirements 1.7**
  - [ ] 5.6 Create `src/routes/auth.ts` with `POST /api/auth/login` wired to AuthService via validate middleware
    - _Requirements: 1.1, 1.4_

- [ ] 6. TransactionService and transaction routes
  - [ ] 6.1 Create `src/controllers/TransactionService.ts` implementing `create`, `findAll`, `update`, and `softDelete` using parameterized SQL via `pg.Pool`
    - _Requirements: 4.1, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 5.1, 5.2, 5.3, 5.4, 5.5_
  - [ ] 6.2 Write property test for transaction creation round-trip
    - **Property 7: Transaction creation round-trip**
    - **Validates: Requirements 4.1**
  - [ ] 6.3 Write property test for soft-deleted transaction invisibility
    - **Property 8: Soft-deleted transactions are invisible**
    - **Validates: Requirements 4.5, 4.7, 6.1, 6.2, 6.3, 6.4**
  - [ ] 6.4 Write property test for transaction update round-trip
    - **Property 9: Transaction update round-trip**
    - **Validates: Requirements 4.3**
  - [ ] 6.5 Write property test for pagination metadata
    - **Property 10: Pagination metadata is always present and correct**
    - **Validates: Requirements 5.1, 5.5**
  - [ ] 6.6 Write property test for date range filter
    - **Property 11: Date range filter excludes out-of-range transactions**
    - **Validates: Requirements 5.2**
  - [ ] 6.7 Write property test for type and category filters
    - **Property 12: Type and category filters return only matching transactions**
    - **Validates: Requirements 5.3, 5.4**
  - [ ] 6.8 Create `src/routes/transactions.ts` with all four transaction routes wired to authenticate, requireRoles, validate, and TransactionService
    - _Requirements: 4.1, 4.3, 4.5, 5.1_

- [ ] 7. DashboardService and dashboard routes
  - [ ] 7.1 Create `src/controllers/DashboardService.ts` implementing `getSummary`, `getCategories`, `getTrends`, and `getRecent` using SQL aggregate queries
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [ ] 7.2 Write property test for dashboard summary math consistency
    - **Property 13: Dashboard summary is mathematically consistent**
    - **Validates: Requirements 6.1**
  - [ ] 7.3 Write property test for category totals aggregation
    - **Property 14: Category totals correctly aggregate by category**
    - **Validates: Requirements 6.2**
  - [ ] 7.4 Write property test for monthly trends ordering
    - **Property 15: Monthly trends are chronologically ordered**
    - **Validates: Requirements 6.3**
  - [ ] 7.5 Write property test for recent transactions ordering and cap
    - **Property 16: Recent transactions are ordered and capped**
    - **Validates: Requirements 6.4**
  - [ ] 7.6 Create `src/routes/dashboard.ts` with all four dashboard routes wired to authenticate, requireRoles, and DashboardService
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 8. UserService and user management routes
  - [ ] 8.1 Create `src/controllers/UserService.ts` implementing `findAll`, `updateRole`, and `updateStatus` — never returning the `password` field
    - _Requirements: 7.1, 7.2, 7.3_
  - [ ] 8.2 Write unit tests for UserService
    - Test `findAll` excludes password, `updateRole` and `updateStatus` return updated user
    - _Requirements: 7.1, 7.2, 7.3_
  - [ ] 8.3 Create `src/routes/users.ts` with all three user routes wired to authenticate, requireRoles(['admin']), validate, and UserService
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9. Express app wiring and security middleware
  - [ ] 9.1 Create `src/app.ts` assembling the Express app: apply `helmet`, `cors`, `express.json()`, `RateLimiter` (100 req / 15 min), mount all routers under `/api`, register `errorHandler` last
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 11.1_
  - [ ] 9.2 Create `src/index.ts` as the entry point that loads `dotenv` and starts the server on `PORT`
    - _Requirements: 12.3_
  - [ ] 9.3 Write property test for consistent error response shape
    - **Property 17: Error responses always contain a message field**
    - **Validates: Requirements 11.1, 11.4**

- [ ] 10. Checkpoint — Backend complete
  - Ensure all backend tests pass, migration runs cleanly, and the server starts without errors. Ask the user if questions arise.

- [ ] 11. Seed script
  - Create `src/database/seed.ts` that inserts 3 demo users (hashed passwords) and 120 sample transactions distributed across the last 6 months; use `ON CONFLICT DO NOTHING` for idempotency
  - Add `"seed": "ts-node src/database/seed.ts"` to `package.json` scripts
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 12. Frontend project setup
  - Scaffold `frontend/` with `npm create vite@latest` (React + TypeScript template)
  - Install dependencies: `axios`, `react-router-dom`, `recharts`, `tailwindcss`, `postcss`, `autoprefixer`
  - Configure Tailwind with `tailwind.config.ts`: set `darkMode: 'class'`, extend theme with deep navy/charcoal background colors and emerald accent
  - Add DM Sans and Syne from Google Fonts in `index.html`; apply font families in Tailwind config
  - Create `src/api/axios.ts` with the Axios instance, request interceptor (attach Bearer token from `localStorage`), and response interceptor (401 → clear session + redirect)
  - Create `.env.example` with `VITE_API_URL`
  - _Requirements: 15.1, 15.2, 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 13. AuthContext and ProtectedRoute
  - [ ] 13.1 Create `src/context/AuthContext.tsx` implementing `AuthContextValue`: `login` stores `{ token, user }` to `localStorage` under `finance_session`; `logout` clears it and redirects; mount effect restores session from `localStorage`
    - _Requirements: 14.1, 14.2, 14.5_
  - [ ] 13.2 Write property test for session persistence round-trip
    - **Property 18: Session persists across page loads (round-trip)**
    - **Validates: Requirements 14.1, 14.2**
  - [ ] 13.3 Write property test for 401 session clearing
    - **Property 19: 401 response always clears session and redirects**
    - **Validates: Requirements 14.3, 15.2**
  - [ ] 13.4 Write property test for logout session clearing
    - **Property 20: Logout always clears session**
    - **Validates: Requirements 14.5**
  - [ ] 13.5 Write property test for Axios Bearer token attachment
    - **Property 21: Axios always attaches Bearer token when session exists**
    - **Validates: Requirements 15.1**
  - [ ] 13.6 Create `src/components/ProtectedRoute.tsx` that redirects unauthenticated users to `/login` and role-restricted users to `/dashboard`
    - _Requirements: 14.4, 19.3_

- [ ] 14. Layout and navigation
  - Create `src/components/Layout.tsx` with sidebar/nav rendering links based on `user.role`: all roles see Dashboard and Transactions; only admin sees Users link
  - _Requirements: 19.1_

- [ ] 15. Login page
  - Create `src/pages/LoginPage.tsx` with email/password form that calls `AuthContext.login`, shows loading state during request, and displays error message on failure
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 16. Dashboard page
  - [ ] 16.1 Create `src/pages/DashboardPage.tsx` fetching all four dashboard endpoints on mount; render four `StatCard` components (total income, total expenses, net balance, transaction count)
    - _Requirements: 16.1, 16.4, 16.5_
  - [ ] 16.2 Add `AreaChart` (Recharts) to DashboardPage displaying monthly income and expense trends from `/api/dashboard/trends`
    - _Requirements: 16.2_
  - [ ] 16.3 Add `PieChart` (Recharts) to DashboardPage displaying category breakdown from `/api/dashboard/categories`
    - _Requirements: 16.3_

- [ ] 17. Transactions page
  - [ ] 17.1 Create `src/pages/TransactionsPage.tsx` with `FilterBar` (date range, type, category inputs), `TransactionTable` (date, type, category, amount, notes columns), and `Pagination` controls; fetch from `/api/transactions` with active filters and page
    - _Requirements: 17.1, 17.2, 17.3, 17.4_
  - [ ] 17.2 Add role-gated "Add Transaction" button and per-row "Edit"/"Delete" buttons visible only to admin and analyst roles; implement `TransactionModal` form for create/edit; wire delete to soft-delete endpoint; refresh list on success
    - _Requirements: 17.5, 17.6, 17.7, 17.8_
  - [ ] 17.3 Write property test for role-gated UI visibility
    - **Property 22: Role-gated UI hides unauthorized elements**
    - **Validates: Requirements 19.1, 19.2**
  - [ ] 17.4 Write property test for direct navigation to restricted routes
    - **Property 23: Direct navigation to restricted routes redirects**
    - **Validates: Requirements 19.3**

- [ ] 18. Users page (admin only)
  - Create `src/pages/UsersPage.tsx` fetching `/api/users`; render `UserTable` with name, email, role dropdown, and status toggle; call role/status update endpoints on change and update local state on success
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 19. App router wiring
  - Update `src/App.tsx` to wrap the app in `AuthContext.Provider`, configure `react-router-dom` routes: `/login` → `LoginPage`, `/dashboard` → `ProtectedRoute` → `Layout` → `DashboardPage`, `/transactions` → `ProtectedRoute` → `Layout` → `TransactionsPage`, `/users` → `ProtectedRoute(admin)` → `Layout` → `UsersPage`; redirect `/` to `/dashboard`
  - _Requirements: 14.4, 19.3_

- [ ] 20. Checkpoint — Frontend complete
  - Ensure all frontend tests pass and the app renders correctly for all three roles. Ask the user if questions arise.

- [ ] 21. README documentation
  - Create `README.md` at project root with: technology choices and rationale, Mermaid architecture diagram, full API endpoint table (method, path, role, request body, response shape), role permissions table, step-by-step setup instructions for backend and frontend, demo credentials table (`admin@finance.dev / Admin@123`, `analyst@finance.dev / Analyst@123`, `viewer@finance.dev / Viewer@123`), and assumptions/tradeoffs section
  - _Requirements: 21.1, 21.2, 21.3_

- [ ] 22. Final checkpoint — Ensure all tests pass
  - Ensure all backend and frontend tests pass, seed script runs cleanly, and both apps start without errors. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` with a minimum of 100 iterations and the tag format `// Feature: finance-dashboard, Property N: <property_text>`
- Backend property tests use in-memory mocks for `pg.Pool` to stay fast and deterministic
- Frontend property tests use mocked API responses via `msw` or `vi.fn()`
