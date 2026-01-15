import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import { LogOut, User, Settings, Database } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import NetworkStatus from './NetworkStatus';

import ProfileMenu from './ProfileMenu';

const Header = () => {
    return (
        <header style={{
            padding: '8px 0', // Reduced from 16px
            marginBottom: '4px', // Reduced from 10px
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
        }}>
            <div>
                <h1 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: 'var(--color-primary)',
                    lineHeight: 1.2,
                    fontFamily: '"Playfair Display", serif',
                    letterSpacing: '-0.5px'
                }}>
                    The Classic Confection
                </h1>
                <p style={{
                    color: 'var(--color-text-muted)',
                    fontSize: '0.8rem',
                    margin: 0,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    Sales & Expense Tracker
                </p>
            </div>

            <ProfileMenu />
        </header>
    );
};

const Layout = ({ children, setCurrentView }) => {
    // Determine if we are on a page that needs full layout or if we use Outlet
    const location = useLocation?.();
    const isAuthPage = location?.pathname === '/login';

    if (isAuthPage) return <Outlet />;

    return (
        <div className="container">
            <NetworkStatus />
            <Header setCurrentView={setCurrentView} />
            <main style={{
                flex: 1,
                minHeight: 0, // Critical for nested scroll
                overflow: 'hidden', // Contain scrolling to children
                display: 'flex',
                flexDirection: 'column'
            }}>
                {children || <Outlet />}
            </main>
            {/* Show BottomNav on mobile if needed, though mostly handled by specific pages */}
        </div>
    );
};

export default Layout;
