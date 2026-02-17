import { LogOut, User, Settings, Database } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import BottomNav from './BottomNav';

import NetworkStatus from './NetworkStatus';

import ProfileMenu from './ProfileMenu';

const Header = () => {
    const { businessName, businessLogo, businessLogoUrl } = useSettings();

    return (
        <header style={{
            padding: '12px 0',
            marginBottom: '8px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                    fontSize: '1.6rem',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    width: '45px',
                    height: '45px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                    {businessLogoUrl ? (
                        <img src={businessLogoUrl} alt={businessName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        businessLogo
                    )}
                </div>
                <div>
                    <h1 style={{
                        fontSize: '1.4rem', // Slightly reduced to accommodate logo
                        fontWeight: '700',
                        color: 'var(--color-primary)',
                        lineHeight: 1.1,
                        fontFamily: '"Playfair Display", serif',
                        letterSpacing: '-0.5px',
                        margin: 0
                    }}>
                        {businessName}
                    </h1>
                    <p style={{
                        color: 'var(--color-text-muted)',
                        fontSize: '0.75rem',
                        margin: 0,
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Business Dashboard
                    </p>
                </div>
            </div>

            <ProfileMenu />
        </header>
    );
};

const Layout = ({ children, setCurrentView, fullWidth }) => {
    // Determine if we are on a page that needs full layout or if we use Outlet
    const location = useLocation?.();
    const isAuthPage = location?.pathname === '/login';

    if (isAuthPage) return <Outlet />;

    return (
        <div className="container" style={fullWidth ? { maxWidth: '100vw', padding: 0, height: '100vh', overflow: 'hidden' } : {}}>
            <NetworkStatus />
            {/* On fullWidth mode (Desktop Bento), we might want the Header to be part of the layout or separate. 
                For now, let's keep it but maybe it needs padding if container has 0 padding. 
                Actually, DesktopHome has its own padding. 
                Let's ensure Header respects standard padding if we remove container padding. 
            */}
            <div style={fullWidth ? { padding: '0 24px' } : {}}>
                <Header setCurrentView={setCurrentView} />
            </div>
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
