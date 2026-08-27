# 🍽️ Smart Restaurant QR Table Ordering & Management System

A **production-ready MERN stack** restaurant platform with QR-based table ordering, real-time kitchen display, admin analytics, loyalty CRM, and much more.

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+ (you have v24 ✅)
- MongoDB — **Atlas free tier** recommended (see [SETUP GUIDE](./MONGODB_SETUP.md))

### 1. Configure Database

Copy the example env and add your MongoDB Atlas URI:

```bash
# Edit server/.env — replace MONGO_URI with your Atlas connection string
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/restaurant_qr_system
```

### 2. Install & Seed

```powershell
# From project root
npm run install:all   # Install all dependencies
npm run seed          # Seed demo restaurant, 20 tables, 36 menu items
```

### 3. Start Development

```powershell
npm run dev           # Starts server (port 5000) + client (port 5173)
```

### 4. Open the App

| URL | Purpose |
|-----|---------|
| [http://localhost:5173/simulator](http://localhost:5173/simulator) | 📱 Customer QR Ordering Simulator |
| [http://localhost:5173/admin/login](http://localhost:5173/admin/login) | 🔑 Staff Login Portal |
| [http://localhost:5000/api](http://localhost:5000/api) | 🔌 Backend REST API |

---

## 🔑 Demo Login Credentials

| Role | Email | Password | Access |
|------|-------|---------|--------|
| 👑 Owner | admin@restaurant.com | Admin@123 | Full platform |
| 👔 Manager | manager@restaurant.com | Manager@123 | Orders, billing, tables |
| 🍳 Kitchen | kitchen@restaurant.com | Kitchen@123 | Live KDS only |
| 💰 Cashier | cashier@restaurant.com | Cashier@123 | Billing & settlement |
| 🛎️ Waiter | waiter@restaurant.com | Waiter@123 | Tables & orders |

---

## 🌟 Features

### Customer Experience (Mobile-First)
- 📷 QR code scan → instant menu access (no app download needed)
- 🔍 Search & filter by category, food type, spice level
- 🛒 Smart cart with server-verified pricing
- 🏷️ Coupon codes & loyalty points redemption
- 👋 Returning customer 1-click reorder of favorites
- 📊 Live order tracking with prep countdown timer
- 🤝 Waiter call button
- 💳 Digital bill with UPI QR payment
- ⭐ Post-meal 5-star feedback

### Admin Dashboard (Role-Based)
- 📋 **Live Orders Kanban** — New → Accepted → Preparing → Ready → Served → Completed
- 🍳 **Kitchen Display System (KDS)** — Full-screen, touch-friendly, color-coded urgency timers
- 🗺️ **Floor Plan** — Visual table layout with status badges
- 📊 **Analytics** — Sales trends, peak hours, category breakdown, AI forecasts
- 🔥 **Table Heatmap** — Revenue performance by table
- 📦 **Inventory** — Stock levels with low-stock alerts
- 🎟️ **Coupons** — Percentage/flat discount coupon manager
- 👥 **Customer CRM** — Loyalty tiers, visit history, favorites
- ⭐ **Feedback** — Guest reviews with sentiment filtering
- 🔲 **QR Manager** — Generate & batch-print table standee QR codes
- 👤 **Staff** — Role-based staff account management
- ⚙️ **Settings** — GST, service charge, UPI, notifications

---

## 🏗️ Architecture

```
├── client/                # React + Vite + Tailwind CSS frontend
│   └── src/
│       ├── context/       # Auth, Socket, Cart, Theme providers
│       ├── pages/
│       │   ├── customer/  # CustomerOrderPage, OrderStatusPage, DigitalBillPage
│       │   ├── admin/     # 15 admin pages
│       │   └── QRScannerSimulatorPage.jsx
│       └── components/
│           ├── admin/     # AdminSidebar, AdminTopNav
│           ├── customer/  # Cart, Modals, MenuCard, CategoryNav
│           └── print/     # Thermal print templates (KOT, Bill, QR Standee)
│
└── server/                # Node.js + Express + Socket.IO backend
    ├── config/            # DB connection, Socket.IO hub
    ├── controllers/       # 15 API controllers
    ├── models/            # 16 Mongoose models
    ├── routes/            # 15 Express route files
    ├── middleware/         # JWT auth, role-based access, error handler
    ├── utils/             # Price calculator, AI predictor, QR generator
    └── seed/              # Demo data seed script
```

---

## 🔌 Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Staff login → JWT |
| GET | `/api/restaurants/public` | Public restaurant + tables list |
| GET | `/api/menu/categories` | Menu categories |
| GET | `/api/menu/items` | Menu items |
| POST | `/api/orders/preview` | Server-side price calculation |
| POST | `/api/orders` | Place a new order |
| GET | `/api/orders` | Get orders (admin) |
| PATCH | `/api/orders/:id/status` | Update order status |
| GET | `/api/kitchen/active` | KDS active orders |
| GET | `/api/analytics/dashboard` | KPI summary |
| GET | `/api/analytics/sales-charts` | Revenue & chart data |
| GET | `/api/analytics/tables` | Table heatmap data |
| GET | `/api/analytics/forecast` | AI sales forecast |

---

## 🛡️ Security

- All monetary calculations (prices, discounts, GST, service charge) are **computed server-side**
- JWT authentication with role-based access control
- Customer routes are public (no auth needed for ordering flow)
- Admin routes require valid JWT + matching role

---

## 📱 Real-Time Events (Socket.IO)

| Event | Direction | Description |
|-------|-----------|-------------|
| `newOrder` | Server → Admin | New QR order received |
| `orderStatusUpdated` | Server → All | Order status changed |
| `kitchenOrderUpdated` | Server → Kitchen | KDS item prepared |
| `waiterCall` | Server → Waiter | Table needs assistance |
| `billRequested` | Server → Cashier | Customer wants bill |
| `paymentCompleted` | Server → All | Payment settled |
