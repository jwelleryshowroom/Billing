import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import { TransactionProvider } from './context/TransactionContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { useTheme } from './context/useTheme';
import { InstallProvider } from './context/InstallContext';
import { MilestoneProvider } from './context/MilestoneContext';
import { InventoryProvider } from './context/InventoryContext';
import { SettingsProvider } from './context/SettingsContext';
import { CustomerProvider } from './context/CustomerContext';
import MilestoneModal from './components/MilestoneModal';
import SettingsDrawer from './components/SettingsDrawer';
import DataManagementDrawer from './components/DataManagementDrawer';
import Home from './components/Home';
import Login from './components/Login';
import InstallPrompt from './components/InstallPrompt';
import PendingApproval from './components/PendingApproval';
import BottomNav from './components/BottomNav';
import HapticHUD from './components/HapticHUD';
import ErrorBoundary from './components/ErrorBoundary';
import { setupGlobalErrorListeners } from './utils/logger';
import SuspenseLoader from './components/SuspenseLoader'; // [NEW]

// [Refactor] Lazy Load Heavy Components for Performance
const Billing = lazy(() => import('./components/Billing'));
const Orders = lazy(() => import('./components/Orders'));
const Inventory = lazy(() => import('./components/Inventory'));
const PublicInvoice = lazy(() => import('./components/PublicInvoice'));
const SuperAdmin = lazy(() => import('./components/SuperAdmin'));

// Analytics & Reports are currently inside Home/Dashboard, but if referenced by Route, lazy load them.
// Currently MainLayout defines routes.

import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';

const MainLayout = () => {
  const location = useLocation();

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        <Suspense fallback={<SuspenseLoader />}>
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageTransition><Home /></PageTransition>} />
              <Route path="/billing" element={<PageTransition><Billing /></PageTransition>} />
              <Route path="/orders" element={<PageTransition><Orders /></PageTransition>} />
              <Route path="/inventory" element={<PageTransition><Inventory /></PageTransition>} />
              <Route path="/super-admin" element={<PageTransition><SuperAdmin /></PageTransition>} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </div>
      <BottomNav />
    </div>
  );
};

// Wrapper to pass User Context to ErrorBoundary
const ErrorBoundaryWrapper = ({ children }) => {
  const { user } = useAuth();

  useEffect(() => {
    setupGlobalErrorListeners(user);
  }, [user]);

  return (
    <ErrorBoundary user={user}>
      {children}
    </ErrorBoundary>
  );
};

const ProtectedApp = () => {
  const { user, isAllowed, loading } = useAuth();

  if (loading || isAllowed === null) {
    const cachedName = localStorage.getItem('cached_business_name') || 'Lekha Kosh';
    const cachedLogo = localStorage.getItem('cached_business_logo') || '🏦';
    const cachedLogoUrl = localStorage.getItem('cached_business_logo_url');
    const cachedColor = localStorage.getItem('cached_primary_color');

    return (
      <div className="loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', fontSize: '2.5rem', boxShadow: '0 8px 16px rgba(0,0,0,0.05)'
        }}>
          {cachedLogoUrl ? <img src={cachedLogoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : cachedLogo}
        </div>
        <div className="spinner" style={{ borderTopColor: cachedColor || 'var(--color-primary)' }}></div>
        <div style={{ fontWeight: 600, letterSpacing: '1px', fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase' }}>
          {cachedName}
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  if (isAllowed === false) return <PendingApproval />;

  return (
    <TransactionProvider>
      <MilestoneProvider>
        <InventoryProvider>
          <SettingsProvider>
            <CustomerProvider>
              <InstallPrompt />
              <MainLayout />
              <SettingsDrawer />
              <HapticHUD />
              <DataManagementDrawer />
              <MilestoneModal />
            </CustomerProvider>
          </SettingsProvider>
        </InventoryProvider>
      </MilestoneProvider>
    </TransactionProvider>
  );
};

const AppContent = () => {
  return (
    <Suspense fallback={<SuspenseLoader />}>
      <Routes>
        {/* Public Route - Lazy Loaded */}
        <Route path="/view/:orderId" element={<PublicInvoice />} />

        {/* Protected Routes */}
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <InstallProvider>
          <ThemeProvider>
            <ToastProvider>
              <ErrorBoundaryWrapper>
                <AppContent />
              </ErrorBoundaryWrapper>
            </ToastProvider>
          </ThemeProvider>
        </InstallProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
