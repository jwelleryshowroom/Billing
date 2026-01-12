import React from 'react';
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
import MilestoneModal from './components/MilestoneModal';
import Home from './components/Home';
import Login from './components/Login';
import InstallPrompt from './components/InstallPrompt';
import PendingApproval from './components/PendingApproval';
import BottomNav from './components/BottomNav';
import Billing from './components/Billing';
import Orders from './components/Orders';
import Inventory from './components/Inventory';
import PublicInvoice from './components/PublicInvoice';

// Lazy Load Heavy Components (Removing from here as they are now in Home.jsx or not needed globally)
// We keep Routes clean

const MainLayout = () => {
  // We don't need useTheme here anymore for the glow if it's handled in Home/Layout

  return (
    <div style={{ paddingBottom: '80px', minHeight: '100vh', position: 'relative' }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/inventory" element={<Inventory />} />
      </Routes>
      <BottomNav />
    </div>
  );
};

const ProtectedApp = () => {
  const { user, isAllowed, loading } = useAuth();

  if (loading || isAllowed === null) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <div style={{ fontWeight: 500, letterSpacing: '0.5px' }}>Loading Tracker...</div>
    </div>
  );

  if (!user) return <Login />;

  if (isAllowed === false) return <PendingApproval />;

  return (
    <>
      <InstallPrompt />
      <MainLayout />
      <MilestoneModal />
    </>
  );
};

const AppContent = () => {
  return (
    <Routes>
      {/* Public Route for Smart Invoice Link - OPEN TO EVERYONE */}
      <Route path="/view/:orderId" element={<PublicInvoice />} />

      {/* Protected Routes - REQUIRE LOGIN */}
      <Route path="/*" element={<ProtectedApp />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <InstallProvider>
          <ToastProvider>
            <ThemeProvider>
              <TransactionProvider>
                <MilestoneProvider>
                  <InventoryProvider>
                    <SettingsProvider>
                      <AppContent />
                    </SettingsProvider>
                  </InventoryProvider>
                </MilestoneProvider>
              </TransactionProvider>
            </ThemeProvider>
          </ToastProvider>
        </InstallProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
