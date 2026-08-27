import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';

// Lazy-load all pages for code splitting
const CustomerOrderPage         = lazy(() => import('./pages/customer/CustomerOrderPage'));
const OrderStatusPage           = lazy(() => import('./pages/customer/OrderStatusPage'));
const DigitalBillPage           = lazy(() => import('./pages/customer/DigitalBillPage'));
const QRScannerSimulatorPage    = lazy(() => import('./pages/QRScannerSimulatorPage'));

const LoginPage                 = lazy(() => import('./pages/admin/LoginPage'));
const DashboardOverview         = lazy(() => import('./pages/admin/DashboardOverview'));
const LiveOrdersPage            = lazy(() => import('./pages/admin/LiveOrdersPage'));
const KitchenDisplayPage        = lazy(() => import('./pages/admin/KitchenDisplayPage'));
const TableManagementPage       = lazy(() => import('./pages/admin/TableManagementPage'));
const TableAnalyticsPage        = lazy(() => import('./pages/admin/TableAnalyticsPage'));
const MenuManagementPage        = lazy(() => import('./pages/admin/MenuManagementPage'));
const InventoryPage             = lazy(() => import('./pages/admin/InventoryPage'));
const OffersPage                = lazy(() => import('./pages/admin/OffersPage'));
const CustomersPage             = lazy(() => import('./pages/admin/CustomersPage'));
const AnalyticsReportsPage      = lazy(() => import('./pages/admin/AnalyticsReportsPage'));
const FeedbackPage              = lazy(() => import('./pages/admin/FeedbackPage'));
const QRCodeManagerPage         = lazy(() => import('./pages/admin/QRCodeManagerPage'));
const StaffManagementPage       = lazy(() => import('./pages/admin/StaffManagementPage'));
const SettingsPage              = lazy(() => import('./pages/admin/SettingsPage'));

// Full-page loading spinner
function PageLoader() {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center text-2xl animate-bounce">
        🍽️
      </div>
      <div className="text-xs text-slate-400 font-bold animate-pulse">Loading…</div>
    </div>
  );
}

// Protected Admin Route wrapper
function RequireAuth({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect kitchen staff directly to KDS
    if (user.role === 'kitchen') {
      return <Navigate to="/admin/kitchen" replace />;
    }
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}

// Redirect root to simulator
function RootRedirect() {
  return <Navigate to="/simulator" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <CartProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Root */}
                  <Route path="/" element={<RootRedirect />} />

                  {/* ─── CUSTOMER ROUTES (public, no auth) ─── */}
                  <Route path="/order/:restaurantId/:tableId" element={<CustomerOrderPage />} />
                  <Route path="/order/status/:orderId" element={<OrderStatusPage />} />
                  <Route path="/order/bill/:orderId" element={<DigitalBillPage />} />

                  {/* ─── QR SIMULATOR ─── */}
                  <Route path="/simulator" element={<QRScannerSimulatorPage />} />

                  {/* ─── ADMIN AUTH ─── */}
                  <Route path="/admin/login" element={<LoginPage />} />

                  {/* ─── PROTECTED ADMIN ROUTES ─── */}
                  {/* All Staff */}
                  <Route element={<RequireAuth allowedRoles={['superadmin', 'owner', 'manager', 'kitchen', 'waiter', 'cashier']} />}>
                    <Route path="/admin/kitchen" element={<KitchenDisplayPage />} />
                  </Route>

                  {/* Owner, Manager, Cashier, Waiter */}
                  <Route element={<RequireAuth allowedRoles={['superadmin', 'owner', 'manager', 'waiter', 'cashier']} />}>
                    <Route path="/admin/dashboard"   element={<DashboardOverview />} />
                    <Route path="/admin/orders"      element={<LiveOrdersPage />} />
                    <Route path="/admin/tables"      element={<TableManagementPage />} />
                  </Route>

                  {/* Owner & Manager only */}
                  <Route element={<RequireAuth allowedRoles={['superadmin', 'owner', 'manager']} />}>
                    <Route path="/admin/table-analytics" element={<TableAnalyticsPage />} />
                    <Route path="/admin/menu"            element={<MenuManagementPage />} />
                    <Route path="/admin/inventory"       element={<InventoryPage />} />
                    <Route path="/admin/offers"          element={<OffersPage />} />
                    <Route path="/admin/customers"       element={<CustomersPage />} />
                    <Route path="/admin/analytics"       element={<AnalyticsReportsPage />} />
                    <Route path="/admin/feedback"        element={<FeedbackPage />} />
                    <Route path="/admin/qr-codes"        element={<QRCodeManagerPage />} />
                  </Route>

                  {/* Owner only */}
                  <Route element={<RequireAuth allowedRoles={['superadmin', 'owner']} />}>
                    <Route path="/admin/staff"    element={<StaffManagementPage />} />
                    <Route path="/admin/settings" element={<SettingsPage />} />
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/simulator" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </CartProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
