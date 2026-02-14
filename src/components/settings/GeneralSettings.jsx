import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/useTheme';
import { Layout, Monitor, Check, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const GeneralSettings = ({ onBack }) => {
    const {
        menuBarMode, setMenuBarMode,
        iconStyle, setIconStyle,
        showMenuLabels, setShowMenuLabels,
        showMilestoneModal, setShowMilestoneModal,
    } = useSettings();

    const { dashboardMode, setDashboardMode, theme } = useTheme();
    const isDark = theme === 'dark';
    const borderColor = 'var(--color-border)';

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            style={{ padding: '0 4px', paddingBottom: '100px' }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'transparent', border: 'none', color: 'var(--color-text-main)',
                        cursor: 'pointer', padding: '8px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <ChevronLeft size={24} />
                </button>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--color-text-main)' }}>Interface</h3>
            </div>

            {/* Dashboard View Mode */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                        { id: 'inline', label: 'Inline Form', icon: <Layout size={20} />, text: 'Efficient & Fast' },
                        { id: 'popup', label: 'Popup Modal', icon: <Monitor size={20} />, text: 'Focused View' }
                    ].map((option) => (
                        <motion.div
                            key={option.id}
                            onClick={() => setDashboardMode(option.id)}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                border: `2px solid ${dashboardMode === option.id
                                    ? 'var(--color-primary)'
                                    : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)')}`,
                                borderRadius: '20px',
                                padding: '16px',
                                cursor: 'pointer',
                                background: dashboardMode === option.id
                                    ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)')
                                    : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.4)'),
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.05)'
                            }}
                        >
                            <div style={{ marginBottom: '12px', color: dashboardMode === option.id ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                                {option.icon}
                            </div>
                            <div style={{ fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '4px' }}>{option.label}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{option.text}</div>

                            {/* Visual Indicator of Mode */}
                            <div style={{
                                marginTop: '12px', height: '40px', background: 'var(--color-bg-secondary)', borderRadius: '8px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5,
                                border: `1px solid ${borderColor}`
                            }}>
                                {option.id === 'inline' ? (
                                    <div style={{ width: '80%', height: '4px', background: 'var(--color-text-muted)', borderRadius: '2px' }} />
                                ) : (
                                    <div style={{ width: '20px', height: '24px', background: 'var(--color-text-muted)', borderRadius: '4px', border: '1px solid currentColor' }} />
                                )}
                            </div>

                            {dashboardMode === option.id && (
                                <div style={{
                                    position: 'absolute', top: '12px', right: '12px',
                                    background: 'var(--color-primary)', borderRadius: '50%',
                                    width: '20px', height: '20px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                }}>
                                    <Check size={12} color="white" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>


            {/* Icon Style */}
            <div style={{ marginBottom: '32px' }}>
                <h4 style={{ color: 'var(--color-text-main)', margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 700 }}>Icon Style</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <motion.div
                        onClick={() => setIconStyle('mono')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            border: `2px solid ${iconStyle === 'mono'
                                ? 'var(--color-primary)'
                                : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)')}`,
                            borderRadius: '16px',
                            padding: '16px',
                            cursor: 'pointer',
                            background: iconStyle === 'mono'
                                ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)')
                                : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.4)'),
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            display: 'flex', alignItems: 'center', gap: '12px',
                            boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.05)'
                        }}
                    >
                        <div style={{ fontSize: '1.4rem', filter: 'grayscale(100%)' }}>🍕</div>
                        <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.9rem' }}>Mono</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Minimalist</div>
                        </div>
                    </motion.div>

                    <motion.div
                        onClick={() => setIconStyle('emoji')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            border: `2px solid ${iconStyle === 'emoji'
                                ? 'var(--color-primary)'
                                : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)')}`,
                            borderRadius: '16px',
                            padding: '16px',
                            cursor: 'pointer',
                            background: iconStyle === 'emoji'
                                ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)')
                                : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.4)'),
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            display: 'flex', alignItems: 'center', gap: '12px',
                            boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.05)'
                        }}
                    >
                        <div style={{ fontSize: '1.4rem' }}>🍕</div>
                        <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.9rem' }}>Emoji</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Vibrant</div>
                        </div>
                    </motion.div>
                </div>
            </div>


            {/* Switches */}
            <div style={{
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.4)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '24px',
                padding: '8px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)'}`
            }}>

                {/* Menu Labels */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: `1px solid ${borderColor}` }}>
                    <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>Menu Labels</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Show text labels in navigation</div>
                    </div>
                    <div
                        onClick={() => setShowMenuLabels(!showMenuLabels)}
                        style={{
                            width: '44px', height: '24px',
                            background: showMenuLabels ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            borderRadius: '12px',
                            position: 'relative', cursor: 'pointer',
                            transition: 'background 0.3s'
                        }}
                    >
                        <motion.div
                            animate={{ x: showMenuLabels ? 22 : 2 }}
                            style={{
                                width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                                position: 'absolute', top: '2px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                        />
                    </div>
                </div>

                {/* Immersive Mode */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px' }}>
                    <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>Immersive Mode</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Auto-hide navigation bar</div>
                    </div>
                    <div
                        onClick={() => setMenuBarMode(menuBarMode === 'disappearing' ? 'sticky' : 'disappearing')}
                        style={{
                            width: '44px', height: '24px',
                            background: menuBarMode === 'disappearing' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            borderRadius: '12px',
                            position: 'relative', cursor: 'pointer',
                            transition: 'background 0.3s'
                        }}
                    >
                        <motion.div
                            animate={{ x: menuBarMode === 'disappearing' ? 22 : 2 }}
                            style={{
                                width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                                position: 'absolute', top: '2px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                        />
                    </div>
                </div>

                {/* Sales Popups */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderTop: `1px solid ${borderColor}` }}>
                    <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>Sales Popups</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Celebrate milestones with confetti</div>
                    </div>
                    <div
                        onClick={() => setShowMilestoneModal(!showMilestoneModal)}
                        style={{
                            width: '44px', height: '24px',
                            background: showMilestoneModal ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            borderRadius: '12px',
                            position: 'relative', cursor: 'pointer',
                            transition: 'background 0.3s'
                        }}
                    >
                        <motion.div
                            animate={{ x: showMilestoneModal ? 22 : 2 }}
                            style={{
                                width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                                position: 'absolute', top: '2px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default GeneralSettings;
