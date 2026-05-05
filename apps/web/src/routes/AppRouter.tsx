import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';

// ─── Lazy-loaded pages (code splitting) ───
const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const OrderListPage = lazy(() => import('@/features/orders/OrderListPage'));
const OrderCreatePage = lazy(() => import('@/features/orders/OrderCreatePage'));
const OrderDetailPage = lazy(() => import('@/features/orders/OrderDetailPage'));
const OrderEditPage = lazy(() => import('@/features/orders/OrderEditPage'));
const ProductListPage = lazy(() => import('@/features/products/ProductListPage'));
const ProductCreatePage = lazy(() => import('@/features/products/ProductCreatePage'));
const ProductEditPage = lazy(() => import('@/features/products/ProductEditPage'));
const CustomerListPage = lazy(() => import('@/features/customers/CustomerListPage'));
const CustomerCreatePage = lazy(() => import('@/features/customers/CustomerCreatePage'));
const CustomerEditPage = lazy(() => import('@/features/customers/CustomerEditPage'));

/** Loading fallback for lazy-loaded pages */
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
    <Spin size="large" />
  </div>
);

/**
 * Application router configuration.
 * All routes except /login are protected behind auth guard.
 */
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes with app layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/orders" element={<OrderListPage />} />
            <Route path="/orders/new" element={<OrderCreatePage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/orders/:id/edit" element={<OrderEditPage />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/products/new" element={<ProductCreatePage />} />
            <Route path="/products/:id/edit" element={<ProductEditPage />} />
            <Route path="/customers" element={<CustomerListPage />} />
            <Route path="/customers/new" element={<CustomerCreatePage />} />
            <Route path="/customers/:id/edit" element={<CustomerEditPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

