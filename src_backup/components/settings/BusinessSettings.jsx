import React, { useState, useRef } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/useTheme';
import { triggerHaptic } from '../../utils/haptics';
import { Upload, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const BusinessSettings = ({ onBack }) => {
    const {
        businessName, setBusinessName,
        businessAddress, setBusinessAddress,
        businessPhone, setBusinessPhone,
        businessFooter, setBusinessFooter,
        businessMapLink, setBusinessMapLink,
        publicUrl, setPublicUrl,
        businessLogo, setBusinessLogo,
        businessLogoUrl, setBusinessLogoUrl,
        primaryColor, setPrimaryColor,
        handleLogoUpload
    } = useSettings();

    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const borderColor = 'var(--color-border)';

    const [uploadLoading, setUploadLoading] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadLoading(true);
        triggerHaptic('medium');
        try {
            await handleLogoUpload(file);
        } catch (err) {
            console.error(err);
        }
        setUploadLoading(false);
    };

    const handleClearLogo = () => {
        triggerHaptic('light');
        setBusinessLogoUrl('');
    };

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
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--color-text-main)' }}>Business Info</h3>
            </div>

            <div style={{
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.4)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '24px',
                padding: '16px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)'}`,
                marginBottom: '32px'
            }}>
                {/* Logo & Name Combined Preview */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', padding: '16px', borderRadius: '16px', background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)', border: `1px solid ${borderColor}` }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '16px',
                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                        border: `1px solid ${borderColor}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', flexShrink: 0, fontSize: '2rem'
                    }}>
                        {businessLogoUrl ? (
                            <img src={businessLogoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            businessLogo
                        )}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Live Brand Preview</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>{businessName}</div>
                    </div>
                </div>

                {/* Business Name */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Business Name</label>
                    <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '12px',
                            background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                            border: `1px solid ${borderColor}`,
                            color: 'var(--color-text-main)',
                            fontSize: '0.9rem',
                            fontWeight: 600
                        }}
                    />
                </div>

                {/* Business Phone */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Phone Label</label>
                    <input
                        type="text"
                        value={businessPhone}
                        onChange={(e) => setBusinessPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '12px',
                            background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                            border: `1px solid ${borderColor}`,
                            color: 'var(--color-text-main)',
                            fontSize: '0.9rem',
                            fontWeight: 600
                        }}
                    />
                </div>

                {/* Business Address */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Address</label>
                    <textarea
                        value={businessAddress}
                        onChange={(e) => setBusinessAddress(e.target.value)}
                        placeholder="e.g. 123 Main St..."
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '12px',
                            background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                            border: `1px solid ${borderColor}`,
                            color: 'var(--color-text-main)',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            resize: 'vertical',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>

                {/* Bill Footer */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Bill Footer Message</label>
                    <input
                        type="text"
                        value={businessFooter}
                        onChange={(e) => setBusinessFooter(e.target.value)}
                        placeholder="e.g. Thank you for visiting!"
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '12px',
                            background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                            border: `1px solid ${borderColor}`,
                            color: 'var(--color-text-main)',
                            fontSize: '0.9rem',
                            fontWeight: 600
                        }}
                    />
                </div>

                {/* Google Map Link */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Google Map Link</label>
                    <input
                        type="url"
                        value={businessMapLink}
                        onChange={(e) => setBusinessMapLink(e.target.value)}
                        placeholder="https://maps.app.goo.gl/..."
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '12px',
                            background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                            border: `1px solid ${borderColor}`,
                            color: 'var(--color-text-main)',
                            fontSize: '0.9rem',
                            fontWeight: 600
                        }}
                    />
                </div>

                {/* Public URL */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Public Domain (For Links)
                    </label>
                    <input
                        type="url"
                        value={publicUrl}
                        onChange={(e) => setPublicUrl(e.target.value)}
                        placeholder="https://myapp.web.app"
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '12px',
                            background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                            border: `1px solid ${borderColor}`,
                            color: 'var(--color-text-main)',
                            fontSize: '0.9rem',
                            fontWeight: 600
                        }}
                    />
                </div>

                {/* Logo Image URL */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Logo Image</label>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadLoading}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    background: 'var(--color-primary)',
                                    color: 'white',
                                    border: 'none',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                                    opacity: uploadLoading ? 0.7 : 1
                                }}
                            >
                                <Upload size={18} />
                                {uploadLoading ? 'Uploading...' : 'Upload Image'}
                            </button>

                            {businessLogoUrl && (
                                <button
                                    onClick={handleClearLogo}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '12px',
                                        background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                                        color: '#ef4444',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />

                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                            Best results: PNG or SVG with transparent background.
                        </div>

                        <button
                            onClick={() => setShowUrlInput(!showUrlInput)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-primary)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'left',
                                padding: 0,
                                width: 'fit-content'
                            }}
                        >
                            {showUrlInput ? 'Hide URL Input' : 'Or paste a URL instead'}
                        </button>

                        {showUrlInput && (
                            <motion.input
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                type="text"
                                placeholder="https://example.com/logo.png"
                                value={businessLogoUrl}
                                onChange={(e) => setBusinessLogoUrl(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                                    border: `1px solid ${borderColor}`,
                                    color: 'var(--color-text-main)',
                                    fontSize: '0.85rem',
                                    fontWeight: 500
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Logo & Color Selection */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                            Logo Icon
                            <span title="This emoji/text appears when no image is uploaded." style={{ opacity: 0.6, fontSize: '0.65rem', textTransform: 'none', fontWeight: 500 }}> (Fallback)</span>
                        </label>
                        <input
                            type="text"
                            value={businessLogo}
                            onChange={(e) => setBusinessLogo(e.target.value)}
                            placeholder="Emoji"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                                border: `1px solid ${borderColor}`,
                                textAlign: 'center',
                                fontSize: '1.2rem',
                                color: 'var(--color-text-main)',
                                fontWeight: 600
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Theme Color</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                style={{
                                    width: '100%',
                                    height: '45px',
                                    padding: '2px',
                                    borderRadius: '12px',
                                    background: 'transparent',
                                    border: `1px solid ${borderColor}`,
                                    cursor: 'pointer'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default BusinessSettings;
