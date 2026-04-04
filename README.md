# 💰 FinanceDash - Full-Stack Financial Dashboard

FinanceDash is a professional-grade, full-stack financial management application. It features a modern dark-themed UI, real-time data visualization, and a robust backend with multi-role access control.

---

## 🏗️ System Architecture

### **Overall Workflow**
```mermaid
graph TD
    %% Define Styles
    classDef frontend fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef backend fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff;
    classDef database fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff;
    classDef security fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff;

    %% Client Layer
    subgraph Client ["💻 Client Side (React + Vite)"]
        UI["UI Components (Tailwind)"]
        State["Auth Context"]
        Axios["Axios Interceptors\n(JWT Injection)"]
    end

    %% Gateway Layer
    subgraph Gateway ["🛡️ API Gateway & Security"]
        Limiter["Rate Limiter\n(100 req/min)"]
        Helmet["Helmet.js\n(Security Headers)"]
        CORS["CORS Policy"]
    end

    %% Backend Layer
    subgraph Server ["⚙️ Backend Server (Express + TS)"]
        AuthMW["Authentication MW\n(JWT Verify)"]
        RoleGuard["RBAC Middleware\n(Role Check)"]
        Validator["Zod Validator\n(Schema Validation)"]
        Routes["API Routes"]
        Controllers["Controllers\n(Request Handling)"]
        Services["Service Layer\n(Business Logic)"]
    end

    %% Persistence Layer
    subgraph Storage ["🗄️ Persistence Layer"]
        Pool["pg.Pool\n(Connection Management)"]
        DB[("PostgreSQL\n(Supabase Cloud)")]
    end

    %% Relationships
    UI --> State
    State --> Axios
    Axios -- "HTTP Request + Bearer Token" --> Gateway
    Gateway --> AuthMW
    AuthMW --> RoleGuard
    RoleGuard --> Validator
    Validator --> Routes
    Routes --> Controllers
    Controllers --> Services
    Services --> Pool
    Pool --> DB
    DB -- "SQL Query Result" --> Services
    Services --> Controllers
    Controllers -- "JSON Response" --> UI

    %% Assign Classes
    class UI,State,Axios frontend;
    class AuthMW,RoleGuard,Validator,Routes,Controllers,Services backend;
    class Pool,DB database;
    class Limiter,Helmet,CORS security;
```

1.  **Frontend (React + Vite)**: A responsive SPA using Tailwind CSS for styling and Recharts for interactive data visualization.
2.  **API Layer (Axios)**: Centralized API instance with interceptors for automatic JWT injection and 401 error handling.
3.  **Backend (Node.js + Express)**: A structured RESTful API with distinct layers for routing, validation, and business logic.
4.  **Database (PostgreSQL)**: A relational schema optimized for financial transactions and user management.

### **Backend Folder Structure**
- `src/controllers`: Business logic and database interaction coordination.
- `src/middleware`: Auth checks, role guards, and global error handlers.
- `src/routes`: API endpoint definitions.
- `src/validators`: Request body/param validation using Zod.
- `src/database`: SQL migrations and seeding scripts.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide React, Recharts |
| **Backend** | Node.js, TypeScript, Express |
| **Database** | PostgreSQL (Supabase Cloud / Local) |
| **Security** | JWT, BcryptJS, Helmet, Rate Limiter |
| **Validation** | Zod |

---

## 🚦 Role-Based Access Control (RBAC)

| Feature | Admin | Analyst | Viewer |
| :--- | :---: | :---: | :---: |
| **Dashboard Charts** | ✅ | ✅ | ✅ |
| **View Transactions** | ✅ | ✅ | ✅ |
| **Add/Edit Transactions** | ✅ | ✅ | ❌ |
| **Delete Transactions** | ✅ | ✅ | ❌ |
| **User Management** | ✅ | ❌ | ❌ |
| **Edit/Delete Users** | ✅ | ❌ | ❌ |

---

## 📡 API Reference

### **Authentication**
- `POST /api/auth/login`: Authenticate and receive a JWT.

### **Dashboard**
- `GET /api/dashboard/summary`: Get overall financial totals.
- `GET /api/dashboard/categories`: Get category-wise spending.
- `GET /api/dashboard/trends`: Get monthly income vs expense trends.
- `GET /api/dashboard/recent`: Get the 10 most recent transactions.

### **Transactions**
- `GET /api/transactions`: List transactions (supports pagination, date filters, type, and category search).
- `POST /api/transactions`: Create a new entry.
- `PUT /api/transactions/:id`: Update an entry.
- `DELETE /api/transactions/:id`: Soft-delete an entry.

### **User Management (Admin Only)**
- `GET /api/users`: List all users (supports search).
- `POST /api/users`: Create a new user.
- `PUT /api/users/:id`: Update user details (name, email, role).
- `DELETE /api/users/:id`: Permanently delete a user and their data.
- `PUT /api/users/:id/status`: Toggle active/inactive status.

---

## 🚀 Getting Started

### **1. Prerequisites**
- **Node.js** (v18 or higher)
- **PostgreSQL** instance (Local or Supabase)

### **2. Database Setup**
1. Create a PostgreSQL database.
2. In the `backend/.env` file, set your `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://user:password@host:port/db?sslmode=require
   ```

### **3. Backend Installation**
```bash
cd backend
npm install
npm run migrate  # Setup tables
npm run dev      # Start development server
```

### **4. Frontend Installation**
```bash
cd frontend
npm install
npm run dev      # Start Vite server
```

---

## 🔒 Production Security Features

- **Rate Limiting**: 100 requests per minute per IP to prevent brute force.
- **SSL Enforcement**: Automatic SSL configuration for cloud database connections.
- **Data Integrity**: SQL transactions ensure atomic user/transaction deletions.
- **Password Hashing**: BcryptJS with salt rounds for secure credential storage.
- **XSS Protection**: Helmet.js headers and sanitized React rendering.

---

## 👥 Default Production Credentials

- **Admin**: `admin@finance.dev` / `Admin@123`
- **Analyst**: `analyst@finance.dev` / `Analyst@123`
- **Viewer**: `viewer@finance.dev` / `Viewer@123`
