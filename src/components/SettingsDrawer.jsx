import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/useTheme';
import { useAuth } from '../context/useAuth';
import { useInstall } from '../context/useInstall';
import { useSettings } from '../context/SettingsContext';
import RoleInfoModal from './RoleInfoModal';
import { Settings as SettingsIcon, X, Info, Database, Smartphone, Users, Store, Sliders, ChevronRight, ChevronLeft } from 'lucide-react';
import StaffManagement from './StaffManagement';
import { triggerHaptic } from '../utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';

// Sub-pages
import BusinessSettings from './settings/BusinessSettings';
import GeneralSettings from './settings/GeneralSettings';

const SettingsDrawer = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { role: _role } = useAuth();
    const { deferredPrompt, promptInstall } = useInstall();
    const {
        isSettingsOpen, closeSettings,
        openData,
        businessName
    } = useSettings();

    const [showRoleInfo, setShowRoleInfo] = useState(false);
    const [currentView, setCurrentView] = useState('menu'); // 'menu', 'business', 'team', 'general'

    // Prevent body scroll when open
    useEffect(() => {
        if (isSettingsOpen) {
            document.body.style.overflow = 'hidden';
            setCurrentView('menu'); // Reset to menu on open
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isSettingsOpen]);

    if (!isSettingsOpen) return null;

    const borderColor = 'var(--color-border)';
    const menuItems = [
        { id: 'business', label: 'Business Info', icon: <Store size={20} />, color: '#6366f1', desc: 'Profile, Logo & Branding' },
        { id: 'team', label: 'Team Management', icon: <Users size={20} />, color: '#8b5cf6', desc: 'Manage Staff & Roles', adminOnly: true },
        { id: 'general', label: 'General Preferences', icon: <Sliders size={20} />, color: '#ec4899', desc: 'Interface & Display' },
        { id: 'data', label: 'Manage Database', icon: <Database size={20} />, color: '#ef4444', desc: 'Backup & Restore', action: openData, adminOnly: true },
    ];

    const handleBack = () => {
        triggerHaptic('light');
        setCurrentView('menu');
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 20002, display: 'flex', justifyContent: 'flex-end' }}>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeSettings}
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)',
                }}
            />

            {/* Drawer Panel */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                style={{
                    width: '100%',
                    maxWidth: '450px',
                    height: '100%',
                    background: isDark ? 'rgba(9, 9, 11, 0.6)' : 'rgba(255, 255, 255, 0.65)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)'}`,
                    boxShadow: isDark
                        ? '-5px 0 30px rgba(0,0,0,0.5), inset 1px 0 0 rgba(255,255,255,0.1)'
                        : '-5px 0 30px rgba(0,0,0,0.1), inset 1px 0 0 rgba(255,255,255,0.5)',
                    position: 'relative',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'transparent',
                    zIndex: 20
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            background: 'var(--color-primary)',
                            padding: '10px', borderRadius: '14px',
                            color: 'white', display: 'flex',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                        }}>
                            <SettingsIcon size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--color-text-main)', letterSpacing: '-0.5px' }}>Settings</h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Preferences & Controls</p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            triggerHaptic('light');
                            closeSettings();
                        }}
                        style={{
                            background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            border: 'none', cursor: 'pointer',
                            color: 'var(--color-text-main)', display: 'flex', padding: '8px', borderRadius: '50%'
                        }}
                    >
                        <X size={20} />
                    </motion.button>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }} className="hide-scrollbar">
                    <AnimatePresence mode="wait">
                        {currentView === 'menu' && (
                            <motion.div
                                key="menu"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                style={{ padding: '24px', paddingBottom: '100px' }}
                            >
                                {/* Premium Role Badge */}
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        triggerHaptic('light');
                                        setShowRoleInfo(true);
                                    }}
                                    style={{
                                        marginBottom: '32px',
                                        padding: '24px',
                                        background: _role === 'admin'
                                            ? (isDark ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(234, 179, 8, 0.03) 100%)' : 'linear-gradient(135deg, rgba(254, 240, 138, 0.3) 0%, rgba(254, 240, 138, 0.05) 100%)')
                                            : (_role === 'staff'
                                                ? (isDark ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.03) 100%)' : 'linear-gradient(135deg, rgba(191, 219, 254, 0.3) 0%, rgba(191, 219, 254, 0.05) 100%)')
                                                : (isDark ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, rgba(244, 63, 94, 0.03) 100%)' : 'linear-gradient(135deg, rgba(254, 205, 211, 0.3) 0%, rgba(254, 205, 211, 0.05) 100%)')),
                                        borderRadius: '24px',
                                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)'}`,
                                        position: 'relative',
                                        overflow: 'hidden',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {/* Holographic Shine */}
                                    <div style={{
                                        position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
                                        background: 'linear-gradient(45deg, transparent 40%, rgba(255, 255, 255, 0.2) 45%, transparent 50%)',
                                        transform: 'rotate(25deg)', pointerEvents: 'none', opacity: 0.5
                                    }}></div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                        <div style={{
                                            padding: '6px 12px', borderRadius: '20px',
                                            background: _role === 'admin' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                            color: _role === 'admin' ? (isDark ? '#facc15' : '#b45309') : (isDark ? '#60a5fa' : '#1d4ed8'),
                                            fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px',
                                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`
                                        }}>
                                            {_role === 'admin' ? 'ADMIN ACCESS' : 'STAFF MEMBER'}
                                        </div>
                                        <Info size={18} color="var(--color-text-muted)" />
                                    </div>

                                    <div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Current Profile</div>
                                        <div style={{
                                            fontSize: '2rem', fontWeight: 800,
                                            background: 'linear-gradient(90deg, var(--color-text-main), var(--color-text-muted))',
                                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                            letterSpacing: '-1px'
                                        }}>
                                            {_role === 'admin' ? 'Munna Bhai' : _role === 'staff' ? 'Circuit' : 'Mamu'}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Menu List */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {menuItems.map((item) => {
                                        if (item.adminOnly && _role !== 'admin') return null;
                                        return (
                                            <motion.div
                                                key={item.id}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => {
                                                    triggerHaptic('light');
                                                    if (item.action) {
                                                        item.action();
                                                        closeSettings();
                                                    } else {
                                                        setCurrentView(item.id);
                                                    }
                                                }}
                                                style={{
                                                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.4)',
                                                    backdropFilter: 'blur(12px)',
                                                    WebkitBackdropFilter: 'blur(12px)',
                                                    borderRadius: '20px',
                                                    padding: '16px',
                                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)'}`,
                                                    cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <div style={{
                                                        padding: '12px', borderRadius: '14px',
                                                        background: `${item.color}20`,
                                                        color: item.color
                                                    }}>
                                                        {item.icon}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: 'var(--color-text-main)', fontSize: '1rem' }}>{item.label}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{item.desc}</div>
                                                    </div>
                                                </div>
                                                <ChevronRight size={20} color="var(--color-text-muted)" />
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {/* Install App */}
                                {deferredPrompt && (
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{ marginTop: '32px' }}
                                    >
                                        <button
                                            onClick={promptInstall}
                                            style={{
                                                width: '100%', padding: '16px', borderRadius: '16px',
                                                background: 'var(--color-primary)',
                                                color: 'white', border: 'none',
                                                fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)'
                                            }}
                                        >
                                            <Smartphone size={18} />
                                            Install App
                                        </button>
                                    </motion.div>
                                )}

                                {/* Footer */}
                                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{businessName}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>v1.8.6 • Enterprise Platform</div>
                                </div>
                            </motion.div>
                        )}

                        {currentView === 'business' && (
                            <BusinessSettings key="business" onBack={handleBack} />
                        )}

                        {currentView === 'general' && (
                            <GeneralSettings key="general" onBack={handleBack} />
                        )}

                        {currentView === 'team' && (
                            <motion.div
                                key="team"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                style={{ padding: '0 4px', paddingBottom: '100px' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <button
                                        onClick={handleBack}
                                        style={{
                                            background: 'transparent', border: 'none', color: 'var(--color-text-main)',
                                            cursor: 'pointer', padding: '8px', borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--color-text-main)' }}>Manage Team</h3>
                                </div>
                                <StaffManagement />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            <RoleInfoModal isOpen={showRoleInfo} onClose={() => setShowRoleInfo(false)} />
        </div>
    );
};

export default SettingsDrawer;
