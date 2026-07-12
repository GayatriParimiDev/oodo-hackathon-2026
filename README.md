# 🚛 TransitOps — Smart Transport Operations Platform

<div align="center">

[![Hackathon - 8 Hours](https://img.shields.io/badge/Hackathon-8%20Hours-blueviolet?style=for-the-badge&logo=codeforces)](https://github.com/)
[![React](https://img.shields.io/badge/Frontend-React%20v19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20v3-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)

**A centralized, production-ready logistics manager that digitizes vehicle allocation, driver compliance, maintenance scheduling, and operational profitability analytics.**

</div>

---

> [!NOTE]
> TransitOps was built from scratch as part of an intensive 8-hour hackathon. It replaces manual sheets with a fully validated, localized, multi-role dashboard.

---

## 🎨 System Highlights & Features

### 🔐 1. Secure Authentication & RBAC
* **Role-Based Access Control (RBAC)**: Tailored dashboards and permissions for **Fleet Manager**, **Dispatcher**, **Driver**, and **Financial Analyst**.
* **Session Persistence**: Automated client redirection using cryptographically hashed JWT validation.

### 📋 2. Dispatch Validation Engine
* **Cargo Weight Check**: Prevents dispatch if weight exceeds the vehicle's maximum load capacity.
* **Compliance Checks**: Rejects drivers with expired licenses or those marked `Suspended`.
* **State Automation**: Dispatching a trip automatically transitions driver and vehicle to `On Trip`. Completion or cancellation instantly returns them to `Available`.

### 🔧 3. Automated Maintenance Workflow
* **In-Shop Interceptor**: Logging a maintenance event immediately sets the vehicle's status to `In Shop` and removes it from the dispatch dropdown.
* **Resolution Tracking**: Closing a job updates the lifetime maintenance spend and logs resolution reports.

### ⚙️ 4. Dynamic Localization Settings
* **Depot Naming**: Dynamically changes the global brand subtitle in the navigation layout.
* **Localization Converter**: Instantly reformats all currencies (`₹`, `$`, `€`, `£`), distances (`km` / `mi`), and fuel metrics (`km/L` / `MPG`) site-wide.

### 🔍 5. Global Search & Dark Mode
* **Debounced Search**: Quick-lookup bar matching vehicles, drivers, trips, and maintenance entries.
* **Aesthetic Dark Mode**: Glassmorphism dashboard panel design conforming to Material Design spacing and color tokens.

---

## 📁 Monorepo Structure

```
TransitOps/
├── README.md                 # Visual overview and guide
├── TECH_STACK.md             # Stack documentation
├── docs/
│   └── TECH_STACK.md         # Technology parameters
├── frontend/                 # React client
│   ├── src/
│   │   ├── api/              # Axios API configurations
│   │   ├── components/       # Layout wrapper, ThemeToggle
│   │   ├── context/          # Auth Context
│   │   ├── pages/            # Dashboard page components
│   │   └── utils/            # format.js (dynamic conversion)
│   ├── package.json
│   └── tailwind.config.js
└── backend/                  # RESTful Server
    ├── server.js             # Entrypoint
    ├── middleware/           # Auth and RBAC middleware
    ├── routes/               # API Router endpoints
    ├── controllers/          # Business logic handlers
    └── prisma/
        ├── schema.prisma     # Postgres schema mappings
        └── seed.js           # Hackathon mock database seeder
```

---

## 🛠️ Technology Stack & Architecture

### 💻 Client Side (Frontend)
* **React 19 & Vite**: Ultra-fast UI hot-reloading and lightweight builds.
* **Tailwind CSS v3**: Utility-first styles driving customized layout spacing and dynamic Material design theme classes.
* **React Router Dom v6**: Client-side single-page routers equipped with route-guard interceptors.
* **Recharts**: Fully dynamic, vector-rendered interactive charts for financial expense distributions (PieChart) and weekly fuel efficiency curves (LineChart).
* **Axios**: HTTP client featuring JWT request headers appending and global token expiry redirect listeners.
* **Material Symbols**: Google's modern iconography font styling for premium sidebar and menu icons.

### ⚙️ Server Side (Backend API)
* **Node.js & Express**: High-concurrency RESTful service layer handling auth middlewares, role-guards, and routes.
* **Prisma ORM**: Next-generation database client abstraction mapping Postgres records directly to objects.
* **JWT & Bcryptjs**: Token credentials authentication and standard password hashing.
* **CSV Writer**: Fast CSV file compiler exporting tabular trip metrics.

### 🗄️ Database Layer
* **PostgreSQL**: Enterprise-grade relational database enforcing unique keys, enums, decimals, and reference integrity.

---

## ⚙️ Quick Installation

### Prerequisites
* **Node.js** (v18+)
* **PostgreSQL** instance running locally

### 1. Database Setup
1. Enter the backend folder:
   ```bash
   cd backend
   ```
2. Create your `.env` configuration file:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/transitops?schema=public"
   JWT_SECRET="your_jwt_secret_key"
   PORT=5000
   ```
3. Run migrations to initialize tables:
   ```bash
   npx prisma migrate dev --name init
   ```

### 2. Seed Mock Data
Apply seed parameters to create test accounts:
```bash
npx prisma db seed
```

#### 🔑 Credentials Directory
| Role | Email | Password |
| :--- | :--- | :--- |
| **Fleet Manager** | `alice@transitops.com` | `password123` |
| **Dispatcher** | `bob@transitops.com` | `password123` |
| **Driver** | `charlie@transitops.com` | `password123` |
| **Financial Analyst** | `dan@transitops.com` | `password123` |

### 3. Run Backend Server
```bash
npm install
npm start
```
*API runs on `http://localhost:5000`*

### 4. Run Frontend Client
1. Navigate to the client workspace:
   ```bash
   cd ../frontend
   ```
2. Install & run:
   ```bash
   npm install
   npm run dev
   ```
*Client runs on `http://localhost:5173`*

---

## 📈 End-to-End Test Scenario

> [!TIP]
> Walk through the steps below to verify all business rules are active:

```mermaid
graph TD
    A[Create Van-05: 500kg Capacity] --> B[Add Driver Alex: Valid License]
    B --> C[Dispatch Trip: 450kg Cargo]
    C -->|Passes Capacity & License Checks| D[Van-05 & Alex marked ON TRIP]
    D --> E[Complete Trip: Log final Odometer & Fuel]
    E --> F[Assets marked AVAILABLE & Analytics updated]
    F --> G[Log Maintenance: Oil Change]
    G --> H[Van-05 marked IN SHOP & Hidden from Dispatch]
```

---

## 👥 Development Team

* **Gayatri Parimi** (Leader) — [@GayatriParimiDev](https://github.com/GayatriParimiDev)
* **Tanish Kumar Sahu** — [@tanishkumarsahu](https://github.com/tanishkumarsahu)
* **Rishi N. S.** — [@Rishi-n-s](https://github.com/Rishi-n-s)
