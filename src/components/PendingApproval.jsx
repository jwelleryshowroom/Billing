import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import { useToast } from '../context/useToast';
import { ShieldAlert, LogOut, Send, CheckCircle, Store, Phone, MessageSquare } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

const PendingApproval = () => {
    const { user, logout } = useAuth();
    const { theme } = useTheme();
    const { showToast } = useToast();
    const isDark = theme === 'dark';

    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);

    const [formData, setFormData] = useState({
        businessName: '',
        businessType: 'Restaurant',
        phone: '',
        message: ''
    });

    // Check if user has already submitted a request
    useEffect(() => {
        const checkRequest = async () => {
            try {
                const q = query(collection(db, "business_requests"), where("email", "==", user.email));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    setSubmitted(true);
                }
            } catch (err) {
                console.error("Error checking request status:", err);
            } finally {
                setCheckingStatus(false);
            }
        };
        checkRequest();
    }, [user.email]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addDoc(collection(db, "business_requests"), {
                ...formData,
                email: user.email,
                userName: user.displayName,
                status: 'pending',
                createdAt: new Date().toISOString()
            });

            setSubmitted(true);
            showToast("Request submitted successfully!", "success");
        } catch (error) {
            console.error("Error submitting request:", error);
            showToast("Failed to submit request.", "error");
        } finally {
            setLoading(false);
        }
    };

    if (checkingStatus) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg-body)' }}>
            <div className="spinner"></div>
        </div>
    );

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100dvh',
            padding: '24px',
            textAlign: 'center',
            backgroundColor: 'var(--color-bg-body)',
            overflowY: 'auto'
        }}>
            <AnimatePresence mode="wait">
                {!submitted ? (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="card"
                        style={{
                            maxWidth: '450px',
                            width: '100%',
                            padding: '32px',
                            background: isDark ? 'rgba(30, 30, 35, 0.4)' : 'rgba(255, 255, 255, 0.5)',
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)'}`,
                            borderRadius: '32px',
                            boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.4)' : '0 20px 60px rgba(0,0,0,0.1)'
                        }}
                    >
                        <div style={{
                            background: 'var(--color-primary)',
                            width: '64px', height: '64px', borderRadius: '22px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px auto',
                            color: 'white',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                            fontSize: '2rem'
                        }}>
                            🏦
                        </div>

                        <h1 style={{ color: 'var(--color-text-main)', marginBottom: '8px', fontSize: '1.8rem', fontWeight: 800 }}>Lekha Kosh</h1>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px', fontSize: '0.95rem' }}>
                            Apply for a business dashboard. Every request is vetted for quality and security.
                        </p>

                        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Business Name</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. Mona Jewelry"
                                        value={formData.businessName}
                                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                        style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '14px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-main)', fontSize: '1rem', fontWeight: 600 }}
                                    />
                                    <Store size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--color-text-muted)' }} />
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Phone Number</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            required
                                            type="tel"
                                            placeholder="10 digit mobile"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '14px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-main)', fontSize: '1rem', fontWeight: 600 }}
                                        />
                                        <Phone size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--color-text-muted)' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Type</label>
                                    <select
                                        value={formData.businessType}
                                        onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                                        style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-main)', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        <option>Restaurant</option>
                                        <option>Jewelry</option>
                                        <option>Retail</option>
                                        <option>Bakery</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Additional Notes</label>
                                <div style={{ position: 'relative' }}>
                                    <textarea
                                        placeholder="Tell us about your requirements..."
                                        rows="3"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '14px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-main)', fontSize: '0.95rem', fontWeight: 500, resize: 'none' }}
                                    />
                                    <MessageSquare size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--color-text-muted)' }} />
                                </div>
                            </div>

                            <button
                                disabled={loading}
                                type="submit"
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    borderRadius: '16px',
                                    backgroundColor: 'var(--color-primary)',
                                    color: 'white',
                                    border: 'none',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    boxShadow: '0 10px 20px rgba(var(--color-primary-rgb), 0.25)',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                {loading ? <div className="spinner-small"></div> : <><Send size={20} /> Submit Application</>}
                            </button>
                        </form>

                        <button
                            onClick={logout}
                            style={{
                                width: '100%',
                                marginTop: '16px',
                                background: 'transparent',
                                border: '1px solid var(--color-border)',
                                padding: '12px',
                                borderRadius: '14px',
                                color: 'var(--color-text-muted)',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            <LogOut size={16} /> Logout
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="card"
                        style={{
                            maxWidth: '400px',
                            width: '100%',
                            padding: '40px',
                            textAlign: 'center',
                            borderRadius: '32px',
                            background: isDark ? 'rgba(30, 30, 35, 0.4)' : 'rgba(255, 255, 255, 0.5)',
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)'}`,
                        }}
                    >
                        <div style={{ color: '#10b981', marginBottom: '24px' }}>
                            <CheckCircle size={64} style={{ filter: 'drop-shadow(0 8px 12px rgba(16, 185, 129, 0.2))' }} />
                        </div>
                        <h1 style={{ color: 'var(--color-text-main)', marginBottom: '12px', fontSize: '1.6rem', fontWeight: 800 }}>Application Received!</h1>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px', lineHeight: 1.6 }}>
                            Hello <b>{user.displayName}</b>,<br /><br />
                            Your request to create a business dashboard has been submitted. Our team will review your application and contact you at:
                            <br />
                            <b style={{ color: 'var(--color-primary)' }}>{user.email}</b>
                        </p>

                        <button
                            onClick={logout}
                            className="btn"
                            style={{ width: '100%', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)' }}
                        >
                            <LogOut size={16} /> Logout
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PendingApproval;

