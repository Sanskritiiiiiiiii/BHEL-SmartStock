# MMIS — Material Management & Inventory Management System
live at : https://mmis-frontend.onrender.com/login

A full-stack, production-grade enterprise application for managing materials, inventory, store receipts, store issues, supplier bidding, and demand forecasting.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Auth | JWT (Role-Based) |
| Charts | Recharts |

---

## Prerequisites

- Node.js v18+
- PostgreSQL v14+ (running locally or remote)
- npm or yarn

---

## Project Structure

```
mmis/
├── backend/                  # Express API
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts           # Seed data
│   └── src/
│       ├── controllers/      # Route handlers
│       ├── database/         # Prisma client
│       ├── middleware/        # Auth middleware
│       ├── routes/           # API routes
│       ├── types/            # TypeScript types
│       ├── utils/            # Helpers & utilities
│       └── index.ts          # App entry point
│
└── frontend/                 # Next.js App
    └── src/
        ├── app/
        │   ├── (app)/        # Protected routes
        │   │   ├── dashboard/
        │   │   ├── materials/
        │   │   ├── inventory/
        │   │   ├── srv/
        │   │   ├── siv/
        │   │   ├── suppliers/
        │   │   ├── bidding/
        │   │   ├── forecasting/
        │   │   ├── reports/
        │   │   └── users/
        │   └── login/
        ├── components/
        │   ├── layout/       # Sidebar, TopBar
        │   └── ui/           # Reusable UI components
        ├── lib/              # API client, auth context
        └── types/            # TypeScript interfaces
```

---

## Quick Setup

### 1. Clone / Download the project

```bash
cd mmis
```

### 2. Set up the Database

Create a PostgreSQL database:

```sql
CREATE DATABASE mmis_db;
```

### 3. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/mmis_db"
JWT_SECRET="your-super-secret-key-change-this"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
```

### 4. Configure Frontend Environment

```bash
cd frontend
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 5. Install All Dependencies

```bash
# In mmis/backend
cd backend && npm install

# In mmis/frontend
cd ../frontend && npm install
```

### 6. Set up Prisma and Database

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations (creates all tables)
npx prisma migrate dev --name init

# Seed with demo data
npx ts-node prisma/seed.ts
```

### 7. Start Development Servers

**Backend** (port 5000):
```bash
cd backend
npm run dev
```

**Frontend** (port 3000):
```bash
cd frontend
npm run dev
```

Open http://localhost:3000

---

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@mmis.com | admin123 |
| Store Manager | manager@mmis.com | manager123 |
| Inventory Officer | officer@mmis.com | officer123 |
| Procurement Officer | procurement@mmis.com | officer123 |
| Vendor | vendor@techsupply.com | vendor123 |

---

## Modules

### Dashboard
- Executive stats: Total Materials, Inventory Value, Low Stock, Pending SRVs/SIVs, Suppliers
- Charts: Stock Overview (bar), Material Distribution (pie), Low Stock alerts
- Recent activity feed

### Material Master
- Full CRUD for materials with search, filter, sort, pagination
- Fields: Code, Name, Category, Description, Unit, Min/Max Stock, Safety Buffer, Lead Time
- Normalized dashless material codes

### Inventory Management
- Real-time stock levels with visual progress bars
- Filter by All / Low Stock / Out of Stock / Adequate
- Manual stock adjustment (Set / Add / Subtract)
- Auto-updated when SRVs are approved or SIVs are issued

### Store Receipt Voucher (SRV)
- Create multi-item receipts from suppliers
- Store Manager approves/rejects
- Approval automatically increments inventory

### Store Issue Voucher (SIV)
- Issue materials to departments
- Store Manager approves/rejects
- Approval automatically decrements inventory
- Stock availability check before creation

### Supplier Bidding Desk
- Store Manager creates tenders
- Vendors submit quotations in INR
- Side-by-side bid comparison
- Store Manager selects winning bid

### Forecasting
- Single Exponential Smoothing: **F(t+1) = α·D(t) + (1−α)·F(t)**
- Adjustable alpha slider
- Historical + smoothed + future 6-month chart
- Saved forecasts dashboard

### Reports
- Inventory Report (with charts)
- Supplier Report (win rates, bid values)
- SRV Report (by status, pie chart)
- SIV Report (by department, bar chart)
- Forecast Report (all saved forecasts)

---

## Role-Based Access Control (RBAC)

| Feature | Admin | Store Manager | Inv. Officer | Proc. Officer | Vendor |
|---------|-------|---------------|--------------|---------------|--------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Material Master | ✅ | ✅ | ✅ | ✅ | ❌ |
| Inventory | ✅ | ✅ | ✅ | ❌ | ❌ |
| SRV Create | ✅ | ✅ | ✅ | ✅ | ❌ |
| SRV Approve | ✅ | ✅ | ❌ | ❌ | ❌ |
| SIV Create | ✅ | ✅ | ✅ | ❌ | ❌ |
| SIV Approve | ✅ | ✅ | ❌ | ❌ | ❌ |
| Suppliers | ✅ | ✅ | ❌ | ❌ | ❌ |
| Bidding (Create Tender) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Bidding (Submit Bid) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Forecasting | ✅ | ✅ | ✅ | ✅ | ❌ |
| Reports | ✅ | ✅ | ✅ | ✅ | ❌ |
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## API Endpoints

### Auth
- `POST /api/auth/login` — Login
- `GET  /api/auth/me` — Get current user
- `POST /api/auth/users` — Create user (Admin)
- `GET  /api/auth/users` — List users (Admin)

### Dashboard
- `GET /api/dashboard` — Dashboard stats

### Materials
- `GET    /api/materials` — List (search, filter, paginate)
- `POST   /api/materials` — Create
- `GET    /api/materials/:id` — Get one
- `PUT    /api/materials/:id` — Update
- `DELETE /api/materials/:id` — Delete
- `GET    /api/materials/categories` — Category list

### Inventory
- `GET   /api/inventory` — List with stats
- `GET   /api/inventory/:materialId` — Get one
- `PATCH /api/inventory/:materialId/adjust` — Adjust stock

### SRV
- `GET   /api/srv` — List
- `POST  /api/srv` — Create
- `GET   /api/srv/:id` — Get one
- `PATCH /api/srv/:id/status` — Approve/Reject

### SIV
- `GET   /api/siv` — List
- `POST  /api/siv` — Create
- `GET   /api/siv/:id` — Get one
- `PATCH /api/siv/:id/status` — Approve/Reject

### Suppliers
- `GET    /api/suppliers` — List
- `POST   /api/suppliers` — Create
- `PUT    /api/suppliers/:id` — Update
- `DELETE /api/suppliers/:id` — Delete

### Tenders / Bidding
- `GET   /api/tenders` — List tenders
- `POST  /api/tenders` — Create tender
- `POST  /api/tenders/:id/bid` — Submit bid (Vendor)
- `PATCH /api/tenders/:id/bids/:bidId/winner` — Select winner

### Forecasting
- `GET  /api/forecasts` — List saved forecasts
- `GET  /api/forecasts/:materialId` — Get material forecast
- `POST /api/forecasts/calculate` — Calculate & save forecast

### Reports
- `GET /api/reports/inventory` — Inventory report
- `GET /api/reports/suppliers` — Supplier report
- `GET /api/reports/srv` — SRV report
- `GET /api/reports/siv` — SIV report
- `GET /api/reports/forecasts` — Forecast report

---

## Database Schema

Tables: `users`, `materials`, `inventory`, `suppliers`, `srv`, `srv_items`, `siv`, `siv_items`, `tenders`, `supplier_bids`, `forecasts`

---

## Production Deployment

### Backend
```bash
cd backend
npm run build
NODE_ENV=production node dist/index.js
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

Set environment variables appropriately for production (strong JWT_SECRET, production DATABASE_URL, correct CORS origins).
