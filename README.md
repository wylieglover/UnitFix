# Multi-Tenant Property Maintenance Platform

A professional-grade, full-stack solution for property management organizations to streamline maintenance lifecycles. This platform features a **React-based dashboard** powered by **Vite** and a **Express.js/PostgreSQL** backend engineered with strict **hierarchical multi-tenancy** and automated SMS intake.

## System Architecture

### 1. Hierarchical Multi-Tenancy & Isolation
The platform is designed to support multiple management firms (Organizations) and their respective portfolios (Properties):
* **Organization Scoping:** Reusable backend middleware ensures all database queries are strictly isolated by `organizationId`.
* **Property-Level RBAC:** Staff members are assigned to specific properties, with permissions enforced across the maintenance board.
* **Data Boundaries:** Strict access controls prevent data leakage between organizations and ensure tenants only interact with their assigned units.

### 2. Context-Aware SMS Intake Gateway
Built with **Twilio**, the intake system allows tenants to report issues via SMS, which are then converted into structured maintenance requests:
* **Identity Resolution:** Automatically resolves tenant identity and property context from incoming phone metadata.
* **Atomic Transactions:** Generates unique, property-scoped request codes and creates initial audit logs using Prisma transactions to ensure data integrity.
* **TwiML Automated Responses:** Provides immediate confirmation to tenants upon successful ticket creation.

### 3. Hardened Security & Authentication
* **Dual-Token Strategy:** Implements JWT access tokens and **SHA-256 HMAC-hashed** refresh tokens for secure session management.
* **Session Revocation:** Full support for refresh-token revocation upon user deactivation or logout.
* **Type-Safe Validation:** Every request is validated via strict **Zod** schemas, providing a robust "schema-first" API layer.

### 4. Modern Frontend Dashboard
The administrative interface is a high-performance Single Page Application (SPA) built for staff efficiency:
* **Vite Tooling:** Leverages Vite for optimized builds.
* **Advanced Filtering:** Real-time search and multi-parameter filtering (Status, Priority, Archive) for managing large volumes of tickets.

---

## 🛠️ Tech Stack

**Frontend**
* **React** (Vite)
* **Tailwind CSS**
* **Lucide Icons**
* **React Router**

**Backend**
* **Express.js** (TypeScript)
* **Prisma** (PostgreSQL)
* **Twilio** (SMS Gateway)
* **Resend** (Email Integration)
* **Zod** (Validation)

---

## Getting Started

### 1. Installation

Clone the repository and install dependencies for both the client and server.

```bash
git clone https://github.com/wylieglover/UnitFix.git
cd unitfix
npm run install-all
```
### 2. Environment Configuration

The application requires environment variables in both the backend and frontend directories. Create these files and populate them with your credentials.

**Backend Configuration (backend/.env)**
```bash
PORT=3000
NODE_ENV=development

FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

DATABASE_URL="postgresql://username:password@localhost:5432/unitfix_db"

JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
REFRESH_TOKEN_HMAC_SECRET=your_hmac_secret_here

RESEND_API_KEY=your_resend_api_key_here
TWILIO_ACCOUNT_SID=your_twilio_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
```

**Frontend Configuration (frontend/.env)**
```bash
VITE_API_URL=http://localhost:3000/api
```

### 3. Database Initialization & Startup
Run migrations to sync the PostgreSQL schema and generate the Prisma client.
```bash
npm run db:setup
```

### 4. Start both frontend and backend development servers
```bash
npm run dev
```
