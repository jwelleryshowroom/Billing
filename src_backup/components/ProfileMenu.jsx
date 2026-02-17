import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import { useSettings } from '../context/SettingsContext';
import { LogOut, User, Settings, Database, ShieldCheck } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '../utils/haptics';

import { Info } from 'lucide-react';
import RoleInfoModal from './RoleInfoModal'; // [NEW]

const ProfileMenu = () => {
    const { user, logout, role, isSuperAdmin, availableBusinesses, switchBusiness, businessId } = useAuth(); // Get Context Props
    const { theme, toggleTheme } = useTheme();
    const { openSettings, openData } = useSettings();
    const [showMenu, setShowMenu] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showRoleInfo, setShowRoleInfo] = useState(false); // [NEW] Role Modal State
    const navigate = useNavigate();

    // Map Roles to Munna Bhai Style
    const roleName = role === 'admin' ? 'Munna Bhai 🕶️' : role === 'staff' ? 'Circuit 🔌' : 'Mamu 🤕';

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    setDeferredPrompt(null);
                }
            });
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 60 }}>
            {/* Theme Toggle */}
            <button
                onClick={() => {
                    triggerHaptic('light');
                    toggleTheme();
                }}
                className="header-btn btn-text-glow"
                style={{
                    '--hover-glow': theme === 'dark' ? '#FFD700' : '#F59E0B',
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.3rem',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
                {theme === 'dark' ? '🌙' : '☀️'}
            </button>

            {/* Profile Button */}
            <div style={{ position: 'relative' }}>
                <button
                    onClick={() => {
                        triggerHaptic('light');
                        setShowMenu(!showMenu);
                    }}
                    className="header-btn btn-icon-glow"
                    style={{
                        '--hover-glow': 'rgba(255,255,255,0.8)',
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: '1px solid var(--color-border)',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        overflow: 'hidden',
                        padding: 0
                    }}
                >
                    {user?.photoURL ? (
                        <img src={user.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <User size={20} />
                    )}
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                    <div className="glass" style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '8px',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-md)',
                        padding: '8px',
                        width: '200px',
                        zIndex: 1000,
                        background: 'var(--color-bg-surface)',
                        border: '1px solid var(--color-border)'
                    }}>
                        <div style={{ padding: '8px', borderBottom: '1px solid var(--color-border)', marginBottom: '8px' }}>
                            <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{user?.displayName || 'User'}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>

                            {/* [NEW] Role Badge */}
                            <div style={{
                                marginTop: '6px',
                                display: 'flex', alignItems: 'center', gap: '6px',
                                fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 700
                            }}>
                                <span>Role: {roleName}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent menu close
                                        triggerHaptic('light');
                                        setShowRoleInfo(true);
                                    }}
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}
                                >
                                    <Info size={14} color="var(--color-text-muted)" />
                                </button>
                            </div>
                        </div>

                        {deferredPrompt && (
                            <button
                                onClick={handleInstallClick}
                                style={{
                                    width: '100%', padding: '8px', display: 'flex', alignItems: 'center', gap: '8px',
                                    color: 'var(--color-primary)', fontSize: '0.9rem', borderRadius: 'var(--radius-sm)',
                                    justifyContent: 'flex-start', marginBottom: '4px', fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-body)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                Install App
                            </button>
                        )}

                        <button
                            onClick={() => {
                                triggerHaptic('hover');
                                openSettings();
                                setShowMenu(false);
                            }}
                            style={{
                                width: '100%', padding: '8px', display: 'flex', alignItems: 'center', gap: '8px',
                                color: 'var(--color-text-main)', fontSize: '0.9rem', borderRadius: 'var(--radius-sm)',
                                justifyContent: 'flex-start', marginBottom: '4px', background: 'transparent', border: 'none', cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-body)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <Settings size={16} />
                            App Settings
                        </button>

                        <button
                            onClick={() => {
                                triggerHaptic('hover');
                                openData();
                                setShowMenu(false);
                            }}
                            style={{
                                width: '100%', padding: '8px', display: 'flex', alignItems: 'center', gap: '8px',
                                color: 'var(--color-text-main)', fontSize: '0.9rem', borderRadius: 'var(--radius-sm)',
                                justifyContent: 'flex-start', marginBottom: '4px', background: 'transparent', border: 'none', cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-body)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <Database size={16} />
                            Manage Data
                        </button>

                        {isSuperAdmin && (
                            <div style={{ padding: '8px', borderTop: '1px solid var(--color-border)', marginTop: '4px' }}>
                                <div style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    color: 'var(--color-primary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    marginBottom: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <ShieldCheck size={12} /> Master View Switcher
                                </div>
                                <select
                                    value={businessId || ''}
                                    onChange={(e) => {
                                        switchBusiness(e.target.value);
                                        setShowMenu(false);
                                        triggerHaptic('medium');
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '12px',
                                        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                        border: '1px solid var(--color-border)',
                                        color: 'var(--color-text-main)',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        outline: 'none'
                                    }}
                                >
                                    <option value="">Default Business</option>
                                    {availableBusinesses.map(biz => (
                                        <option key={biz.id} value={biz.id}>
                                            {biz.name || biz.id}
                                        </option>
                                    ))}
                                </select>
                                {availableBusinesses.length === 0 && (
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px', textAlign: 'center' }}>
                                        Loading businesses...
                                    </div>
                                )}
                            </div>
                        )}
                        <button
                            onClick={logout}
                            style={{
                                width: '100%', padding: '8px', display: 'flex', alignItems: 'center', gap: '8px',
                                color: 'var(--color-danger)', fontSize: '0.9rem', borderRadius: 'var(--radius-sm)',
                                justifyContent: 'flex-start', background: 'transparent', border: 'none', cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-body)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                )}
            </div>

            {/* [NEW] Role Info Modal */}
            <RoleInfoModal isOpen={showRoleInfo} onClose={() => setShowRoleInfo(false)} />

            <style>{`
                .btn-text-glow:hover { text-shadow: 0 0 12px var(--hover-glow); }
                .btn-icon-glow:hover svg { filter: drop-shadow(0 0 6px var(--hover-glow)); }
            `}</style>
        </div>
    );
};

export default ProfileMenu;
