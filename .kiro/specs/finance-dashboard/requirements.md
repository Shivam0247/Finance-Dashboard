# Requirements Document

## Introduction

A full-stack Finance Dashboard application that allows organizations to track financial transactions, view aggregated summaries, and manage users across three permission levels (admin, analyst, viewer). The backend is built with Node.js, Express, and PostgreSQL using JWT-based authentication. The frontend is built with React, Vite, and Tailwind CSS, featuring interactive charts and role-gated UI.

## Glossary

- **System**: The Finance Dashboard application as a whole
- **API**: The Express-based HTTP backend service
- **Frontend**: The React + Vite single-page application
- **AuthService**: The component responsible for JWT issuance and verification
- **TransactionService**: The component responsible for CRUD operations on financial transactions
- **DashboardService**: The component responsible for computing and returning summary statistics
- **UserService**: The component responsible for user management operations
- **DB**: The PostgreSQL database accessed via pg.Pool connection pool
- **Validator**: The Zod-based input validation layer applied before controller logic
- **RoleGuard**: The Express middleware that enforces role-based access control
- **RateLimiter**: The express-rate-limit middleware applied to all API routes
- **AuthContext**: The React context that stores and exposes the current user session
- **ProtectedRoute**: The React Router wrapper that redirects unauthenticated users to the Login page
- **Transaction**: A financial record with fields: id, user_id, amount, type (income/expense), category, date, notes, deleted_at, created_at, updated_at
- **User**: A system account with fields: id, name, email, password (hashed), role, status, created_at, updated_at
- **Role**: One of three permission levels — admin, analyst, or viewer
- **Soft Delete**: Marking a Transaction as deleted by setting deleted_at to the current timestamp rather than removing the row
- **Migration**: A standalone Node.js script that creates database tables if they do not already exist
- **Seed Script**: A standalone Node.js script that inserts demo users and sample transactions into the DB

---

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to log in with my email and password, so that I can access the dashboard securely.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/auth/login` with a valid email and password, THE AuthService SHALL return a signed JWT token and the user's id, name, email, and role.
2. WHEN a POST request is made to `/api/auth/login` with an email that does not exist in the DB, THE AuthService SHALL return HTTP 401 with a JSON error body containing a `message` field.
3. WHEN a POST request is made to `/api/auth/login` with an incorrect password, THE AuthService SHALL return HTTP 401 with a JSON error body containing a `message` field.
4. WHEN a POST request is made to `/api/auth/login` with a missing or malformed request body, THE Validator SHALL return HTTP 400 with a JSON error body listing the validation errors.
5. THE AuthService SHALL hash all passwords using bcryptjs before storing them in the DB.
6. THE AuthService SHALL never return the password field in any API response.
7. WHEN a user's status is `inactive`, THE AuthService SHALL return HTTP 403 with a JSON error body containing a `message` field.

---

### Requirement 2: JWT Authorization Middleware

**User Story:** As a developer, I want all protected routes to verify the JWT token, so that unauthenticated requests are rejected.

#### Acceptance Criteria

1. WHEN a request to a protected route is made without an `Authorization` header, THE API SHALL return HTTP 401 with a JSON error body containing a `message` field.
2. WHEN a request to a protected route is made with an expired or invalid JWT token, THE API SHALL return HTTP 401 with a JSON error body containing a `message` field.
3. WHEN a request to a protected route is made with a valid JWT token, THE API SHALL attach the decoded user payload (id, email, role) to the request object and pass control to the next middleware.

---

### Requirement 3: Role-Based Access Control

**User Story:** As a system administrator, I want role-based access control enforced on every protected endpoint, so that users can only perform actions permitted by their role.

#### Acceptance Criteria

1. THE RoleGuard SHALL enforce the following permissions:
   - admin: full access to all endpoints including user management
   - analyst: read and write access to transactions; no access to user management
   - viewer: read-only access to transactions and dashboard; no write or delete access
2. WHEN a request is made to an endpoint that requires a role the authenticated user does not hold, THE RoleGuard SHALL return HTTP 403 with a JSON error body containing a `message` field.
3. THE RoleGuard SHALL be applied as Express middleware and receive the list of permitted roles as a parameter.

---

### Requirement 4: Transaction CRUD

**User Story:** As an analyst or admin, I want to create, read, update, and delete financial transactions, so that the organization's financial records stay accurate.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/transactions` with valid fields (amount, type, category, date, and optional notes), THE TransactionService SHALL insert a new Transaction row into the DB and return HTTP 201 with the created Transaction object.
2. WHEN a POST request is made to `/api/transactions` with invalid or missing required fields, THE Validator SHALL return HTTP 400 with a JSON error body listing the validation errors.
3. WHEN a PUT request is made to `/api/transactions/:id` with valid fields, THE TransactionService SHALL update the matching Transaction row and return HTTP 200 with the updated Transaction object.
4. WHEN a PUT request is made to `/api/transactions/:id` for a Transaction id that does not exist or has been soft-deleted, THE TransactionService SHALL return HTTP 404 with a JSON error body containing a `message` field.
5. WHEN a DELETE request is made to `/api/transactions/:id`, THE TransactionService SHALL set the `deleted_at` column to the current timestamp (soft delete) and return HTTP 200 with a JSON body containing a `message` field.
6. WHEN a DELETE request is made to `/api/transactions/:id` for a Transaction id that does not exist or has already been soft-deleted, THE TransactionService SHALL return HTTP 404 with a JSON error body containing a `message` field.
7. THE TransactionService SHALL exclude soft-deleted transactions (where `deleted_at IS NOT NULL`) from all read and listing queries.
8. THE DB SHALL use parameterized statements for all Transaction queries to prevent SQL injection.

---

### Requirement 5: Transaction Listing with Pagination and Filtering

**User Story:** As a user, I want to browse transactions with filters and pagination, so that I can find specific records efficiently.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/transactions`, THE TransactionService SHALL return a paginated list of non-deleted transactions along with `total`, `page`, and `limit` metadata.
2. WHEN a GET request to `/api/transactions` includes a `startDate` and `endDate` query parameter, THE TransactionService SHALL return only transactions where `date` falls within the inclusive range.
3. WHEN a GET request to `/api/transactions` includes a `type` query parameter with value `income` or `expense`, THE TransactionService SHALL return only transactions matching that type.
4. WHEN a GET request to `/api/transactions` includes a `category` query parameter, THE TransactionService SHALL return only transactions matching that category (case-insensitive).
5. WHEN a GET request to `/api/transactions` includes a `page` query parameter, THE TransactionService SHALL return the corresponding page of results using the specified or default `limit` of 10.
6. IF a `page` or `limit` query parameter is not a positive integer, THEN THE Validator SHALL return HTTP 400 with a JSON error body listing the validation errors.

---

### Requirement 6: Dashboard Summary API

**User Story:** As a user, I want to view aggregated financial statistics, so that I can understand the organization's financial health at a glance.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/dashboard/summary`, THE DashboardService SHALL return total income, total expenses, net balance (income minus expenses), and total transaction count — all computed from non-deleted transactions.
2. WHEN a GET request is made to `/api/dashboard/categories`, THE DashboardService SHALL return an array of objects each containing a `category` name and its aggregated `total` amount, computed from non-deleted transactions.
3. WHEN a GET request is made to `/api/dashboard/trends`, THE DashboardService SHALL return monthly aggregated income and expense totals for the last 6 calendar months, ordered chronologically.
4. WHEN a GET request is made to `/api/dashboard/recent`, THE DashboardService SHALL return the 10 most recent non-deleted transactions ordered by `date` descending.
5. THE DashboardService SHALL compute all summary values using SQL aggregate queries executed against the DB.

---

### Requirement 7: User Management (Admin Only)

**User Story:** As an admin, I want to manage user accounts, so that I can control who has access and at what permission level.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/users` by an admin, THE UserService SHALL return a list of all users excluding the `password` field.
2. WHEN a PUT request is made to `/api/users/:id/role` by an admin with a valid role value (`admin`, `analyst`, or `viewer`), THE UserService SHALL update the user's role and return HTTP 200 with the updated user object.
3. WHEN a PUT request is made to `/api/users/:id/status` by an admin with a valid status value (`active` or `inactive`), THE UserService SHALL update the user's status and return HTTP 200 with the updated user object.
4. WHEN a PUT request is made to `/api/users/:id/role` or `/api/users/:id/status` with an invalid value, THE Validator SHALL return HTTP 400 with a JSON error body listing the validation errors.
5. WHEN a request is made to any `/api/users` endpoint by a non-admin user, THE RoleGuard SHALL return HTTP 403 with a JSON error body containing a `message` field.

---

### Requirement 8: Database Schema and Migration

**User Story:** As a developer, I want a transparent SQL migration script, so that I can set up the database schema without an ORM.

#### Acceptance Criteria

1. THE Migration SHALL create a `users` table with columns: `id` (UUID, default `gen_random_uuid()`), `name` (TEXT NOT NULL), `email` (TEXT UNIQUE NOT NULL), `password` (TEXT NOT NULL), `role` (TEXT NOT NULL, one of admin/analyst/viewer), `status` (TEXT NOT NULL, default `active`), `created_at` (TIMESTAMPTZ, default NOW()), `updated_at` (TIMESTAMPTZ, default NOW()).
2. THE Migration SHALL create a `transactions` table with columns: `id` (UUID, default `gen_random_uuid()`), `user_id` (UUID, FK referencing `users.id`), `amount` (NUMERIC NOT NULL), `type` (TEXT NOT NULL, one of income/expense), `category` (TEXT NOT NULL), `date` (DATE NOT NULL), `notes` (TEXT), `deleted_at` (TIMESTAMPTZ, nullable), `created_at` (TIMESTAMPTZ, default NOW()), `updated_at` (TIMESTAMPTZ, default NOW()).
3. THE Migration SHALL use `CREATE TABLE IF NOT EXISTS` so it is safe to run multiple times.
4. THE Migration SHALL be executable as a standalone Node.js script via `node src/database/migrate.js`.
5. THE DB SHALL use a `pg.Pool` connection pool configured from the `DATABASE_URL` environment variable.

---

### Requirement 9: Seed Script

**User Story:** As a developer or evaluator, I want demo data pre-loaded, so that I can explore the dashboard without manual data entry.

#### Acceptance Criteria

1. THE Seed Script SHALL insert exactly 3 demo users: `admin@finance.dev` (role: admin), `analyst@finance.dev` (role: analyst), `viewer@finance.dev` (role: viewer), each with status `active`.
2. THE Seed Script SHALL hash all demo user passwords using bcryptjs before inserting them into the DB.
3. THE Seed Script SHALL insert 120 sample transactions distributed across the last 6 calendar months with varied amounts, types (income/expense), and categories.
4. THE Seed Script SHALL be idempotent — running it multiple times SHALL NOT create duplicate users or transactions.
5. THE Seed Script SHALL be executable via `npm run seed`.

---

### Requirement 10: Security and Rate Limiting

**User Story:** As a system operator, I want the API to be protected against common web vulnerabilities and abuse, so that the service remains secure and available.

#### Acceptance Criteria

1. THE API SHALL apply the `helmet` middleware to set secure HTTP response headers on all routes.
2. THE RateLimiter SHALL limit each IP address to a maximum of 100 requests per 15-minute window across all API routes.
3. IF the RateLimiter threshold is exceeded, THEN THE API SHALL return HTTP 429 with a JSON error body containing a `message` field.
4. THE API SHALL apply CORS headers permitting requests from the configured frontend origin.

---

### Requirement 11: Consistent Error Handling

**User Story:** As a frontend developer, I want all API errors to follow a consistent JSON shape, so that the frontend can handle them uniformly.

#### Acceptance Criteria

1. THE API SHALL return all error responses as JSON objects containing at minimum a `message` field.
2. THE API SHALL use the following HTTP status codes consistently: 400 for validation errors, 401 for authentication failures, 403 for authorization failures, 404 for not-found resources, 429 for rate limit exceeded, 500 for unexpected server errors.
3. WHEN an unhandled exception occurs, THE API SHALL return HTTP 500 with a JSON error body containing a `message` field and SHALL log the error details server-side.
4. THE API SHALL never expose internal stack traces or raw database error messages in HTTP responses.

---

### Requirement 12: Environment Configuration

**User Story:** As a developer, I want a documented environment configuration template, so that I can set up the project quickly.

#### Acceptance Criteria

1. THE System SHALL include a `.env.example` file in the backend root containing the variables: `DATABASE_URL`, `JWT_SECRET`, and `PORT`.
2. THE `DATABASE_URL` variable SHALL follow the format `postgresql://user:password@localhost:5432/finance_db`.
3. THE API SHALL read all configuration values from environment variables and SHALL NOT hardcode credentials or secrets in source files.

---

### Requirement 13: Backend Folder Structure

**User Story:** As a developer, I want a well-organized backend codebase, so that I can navigate and maintain it easily.

#### Acceptance Criteria

1. THE System SHALL organize backend source files under the following directories: `src/controllers`, `src/routes`, `src/middleware`, `src/validators`, `src/utils`, `src/database`.
2. THE System SHALL place route definitions in `src/routes`, controller logic in `src/controllers`, Zod schemas in `src/validators`, and reusable helpers in `src/utils`.

---

### Requirement 14: Frontend Authentication Flow

**User Story:** As a user, I want my session to persist across page refreshes, so that I do not have to log in repeatedly.

#### Acceptance Criteria

1. THE AuthContext SHALL store the JWT token and user profile in `localStorage` upon successful login.
2. THE AuthContext SHALL read the JWT token from `localStorage` on application load to restore the session.
3. WHEN the API returns HTTP 401, THE Frontend SHALL clear the session from `localStorage` and redirect the user to the Login page.
4. THE ProtectedRoute SHALL redirect unauthenticated users to the Login page.
5. WHEN a user logs out, THE AuthContext SHALL remove the JWT token and user profile from `localStorage` and redirect to the Login page.

---

### Requirement 15: Axios Interceptor

**User Story:** As a frontend developer, I want Axios to automatically attach the JWT token to every request, so that I do not have to manually set headers in each API call.

#### Acceptance Criteria

1. THE Frontend SHALL configure an Axios instance with a request interceptor that reads the JWT token from `localStorage` and attaches it as the `Authorization: Bearer <token>` header on every outgoing request.
2. THE Frontend SHALL configure an Axios response interceptor that, upon receiving HTTP 401, clears the session and redirects the user to the Login page.

---

### Requirement 16: Dashboard Page

**User Story:** As a user, I want a visual dashboard, so that I can understand financial performance at a glance.

#### Acceptance Criteria

1. THE Dashboard page SHALL display four stat cards showing: total income, total expenses, net balance, and total transaction count.
2. THE Dashboard page SHALL display an area chart (using Recharts) showing monthly income and expense totals for the last 6 months.
3. THE Dashboard page SHALL display a pie or donut chart (using Recharts) showing the category-wise breakdown of transaction amounts.
4. WHEN the dashboard data is loading, THE Dashboard page SHALL display a loading indicator.
5. IF the dashboard API returns an error, THEN THE Dashboard page SHALL display a user-readable error message.

---

### Requirement 17: Transactions Page

**User Story:** As a user, I want to browse, filter, and manage transactions in a table view, so that I can review and maintain financial records.

#### Acceptance Criteria

1. THE Transactions page SHALL display transactions in a paginated table with columns for date, type, category, amount, and notes.
2. THE Transactions page SHALL provide filter controls for date range (start date, end date), transaction type, and category.
3. WHEN a filter value changes, THE Transactions page SHALL fetch and display the filtered results.
4. THE Transactions page SHALL display pagination controls and update the table when the user navigates between pages.
5. WHERE the current user's role is admin or analyst, THE Transactions page SHALL display an "Add Transaction" button that opens a modal form.
6. WHERE the current user's role is admin or analyst, THE Transactions page SHALL display "Edit" and "Delete" action buttons per transaction row.
7. WHERE the current user's role is viewer, THE Transactions page SHALL hide all write-action buttons.
8. WHEN a transaction is successfully created, updated, or deleted, THE Transactions page SHALL refresh the transaction list.

---

### Requirement 18: Users Page (Admin Only)

**User Story:** As an admin, I want a dedicated page to manage users, so that I can control access without touching the database directly.

#### Acceptance Criteria

1. THE Users page SHALL be accessible only to users with the admin role; all other roles SHALL be redirected.
2. THE Users page SHALL display a list of all users with their name, email, role, and status.
3. WHERE the current user's role is admin, THE Users page SHALL provide a control to change a user's role to admin, analyst, or viewer.
4. WHERE the current user's role is admin, THE Users page SHALL provide a toggle to set a user's status to active or inactive.
5. WHEN a role or status change is successfully saved, THE Users page SHALL reflect the updated value without a full page reload.

---

### Requirement 19: Role-Based UI Visibility

**User Story:** As a user, I want the UI to only show actions and routes I am permitted to use, so that the interface is not confusing or misleading.

#### Acceptance Criteria

1. THE Frontend SHALL hide navigation links to pages the current user's role cannot access.
2. THE Frontend SHALL not render write-action buttons (add, edit, delete) for roles that do not have write permission.
3. WHEN a user attempts to navigate directly to a restricted route via URL, THE ProtectedRoute SHALL redirect the user to the Dashboard page.

---

### Requirement 20: Visual Design

**User Story:** As a user, I want a polished dark financial aesthetic, so that the dashboard feels professional and easy to read.

#### Acceptance Criteria

1. THE Frontend SHALL use a deep navy or charcoal color as the primary background color.
2. THE Frontend SHALL use emerald green as the primary accent color for interactive elements and highlights.
3. THE Frontend SHALL load DM Sans from Google Fonts and apply it as the body typeface.
4. THE Frontend SHALL load Syne from Google Fonts and apply it as the heading typeface.
5. THE Frontend SHALL be styled using Tailwind CSS utility classes.

---

### Requirement 21: README Documentation

**User Story:** As an evaluator or new developer, I want comprehensive README documentation, so that I can understand, set up, and evaluate the project quickly.

#### Acceptance Criteria

1. THE System SHALL include a `README.md` at the project root containing: technology choices with rationale, a Mermaid architecture diagram, all API endpoints documented with method, path, required role, request body shape, and response shape, a role permissions table, step-by-step setup instructions, a demo credentials table, and a section on assumptions and tradeoffs.
2. THE README SHALL document the setup commands for both backend and frontend as specified.
3. THE README SHALL include the demo credentials: `admin@finance.dev / Admin@123`, `analyst@finance.dev / Analyst@123`, `viewer@finance.dev / Viewer@123`.
