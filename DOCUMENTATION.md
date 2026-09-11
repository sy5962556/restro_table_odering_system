# Multi-Restaurant SaaS Platform — System & Architecture Documentation

## 1. Executive Overview
The **Smart Restaurant QR Table Ordering & Management System** is an enterprise-grade **Multi-Tenant SaaS Platform**. It empowers independent restaurant owners to register, onboard, and manage their restaurant operations within an isolated workspace.

---

## 2. Platform Hierarchy & Roles
1. **👑 Platform Super Admin (`superadmin`)**:
   - Manages all registered restaurants, review approvals (`APPROVED`, `PENDING`, `SUSPENDED`, `REJECTED`), subscription tier upgrades (`FREE`, `BASIC`, `PRO`, `PREMIUM`), and platform-wide aggregated analytics.
2. **🏛️ Restaurant Owner (`owner`)**:
   - Full control over their restaurant workspace: tables, menu, staff, inventory, offers, analytics, and billing.
3. **👔 Restaurant Manager (`manager`)**:
   - Manages live orders, tables, customer bill settlement, menu availability, and staff.
4. **🍳 Kitchen Staff (`kitchen`)**:
   - Operates the Live Kitchen Display System (KDS), updating item cooking status and marking dishes ready.
5. **🤵 Waiter (`waiter`)**:
   - Responds to customer waiter calls, serves orders, and assists dining tables.
6. **💰 Cashier (`cashier`)**:
   - Settles customer invoices via Cash, UPI, Card, or Online payments.
7. **📱 Customer Guest (No Account Required)**:
   - Scans table QR code (`/order/:restaurantId/:tableId`), browses menu, customizes spice levels, places orders, tracks live progress, and requests digital bills.

---

## 3. Multi-Tenant Database Architecture
All tenant-specific collections enforce an indexed `restaurant: ObjectId` reference:
- `Restaurant`: Tenant profile, status, plan, tax rates, GSTIN, UPI ID.
- `User`: Owner & staff accounts with hashed passwords (`bcryptjs`).
- `Table`: Dining tables, seating capacities, sections, floors, status, QR tokens.
- `QRCode`: Table standee tokens & URL mapping.
- `Category`: Restaurant menu categories with display order.
- `MenuItem`: Dishes, prices, spice levels, allergens, calories, availability.
- `Order`: Live customer orders with server-verified totals & order numbers.
- `Invoice`: Financial invoices with subtotal, GST, service charge, grand total.
- `Payment`: Payment settlements (`Cash`, `UPI`, `Card`, `Online`).
- `Customer`: Restaurant CRM tracking visits, total spend, and loyalty points.
- `TableSession`: Table occupancy session tracking & duration metrics.
- `Branch`: Multi-branch database readiness model.
- `InventoryItem`: Raw ingredients, stock thresholds, low stock alerts.
- `Offer`: Discount coupons & promotional deals.
- `Feedback`: Customer star ratings & dining reviews.
- `Notification`: Real-time staff notifications.
- `WaiterCall`: Table assistance requests.
- `AuditLog`: System security & activity audit trail.

---

## 4. API Endpoints Reference
- `POST /api/auth/register-restaurant`: Multi-step restaurant onboarding.
- `POST /api/auth/login`: Authenticate users & return JWT containing role & `restaurantId`.
- `GET /api/auth/me`: Current user context.
- `POST /api/auth/forgot-password` & `POST /api/auth/reset-password`: Hashed password reset.
- `GET /api/platform/dashboard`: Super Admin platform analytics.
- `GET /api/platform/restaurants`: List, filter, & search platform tenants.
- `PATCH /api/platform/restaurants/:id/status`: Approve, suspend, or reject restaurants.
- `PATCH /api/platform/restaurants/:id/plan`: Subscription plan tier upgrades.
- `GET /api/menu/:restaurantId`: Public QR customer menu query.
- `POST /api/orders/preview`: Server-side verified cart recalculation.
- `POST /api/orders`: Place new customer table order.
- `GET /api/orders`: Scoped live orders feed for restaurant staff.
- `PATCH /api/orders/:id/status`: Update order status in Kanban & KDS.
- `GET /api/kitchen/active`: Kitchen Display System queue.
- `POST /api/billing/generate/:orderId`: Generate financial invoice.
- `POST /api/waiter-call`: Request waiter assistance.
- `GET /api/analytics/dashboard`: Restaurant sales KPIs & Recharts metrics.
- `GET /api/analytics/tables`: Table revenue heatmap & occupancy rates.

---

## 5. Socket.IO Real-Time Event Architecture
- Rooms: `restaurant_${restaurantId}`, `kitchen_${restaurantId}`, `table_${tableId}`.
- Events: `newOrder`, `kitchenOrderUpdated`, `orderStatusUpdated`, `billRequested`, `waiterCall`, `paymentCompleted`, `menuAvailabilityChanged`, `tableUpdated`.

---

## 6. Automated Isolation Test Suite
Run `node server/testTenantIsolation.js` to execute automated multi-tenant security verification across all endpoints and database models.
