import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { useTheme } from '../context/useTheme';
import { ShieldCheck, Users, X, Check, Store, Clock, Mail, Phone, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SuperAdmin = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Security Check: Only specific email can access
    const isSuperAdmin = user?.email === 'msdhrsah@gmail.com';

    useEffect(() => {
        if (!isSuperAdmin) return;

        const q = query(collection(db, "business_requests"), where("status", "==", "pending"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRequests(docs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isSuperAdmin]);

    const approveRequest = async (request) => {
        try {
            const batch = writeBatch(db);

            // 1. Create Business ID (Sluggish)
            const businessSlug = request.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 7);

            // 2. Create Business Profile
            const bizRef = doc(db, "businesses", businessSlug);
            batch.set(bizRef, {
                name: request.businessName,
                type: request.businessType,
                ownerEmail: request.email,
                phone: request.phone,
                logo: '🏪',
                primaryColor: '#ff4757',
                createdAt: serverTimestamp(),
                uiSettings: {
                    mobile: { menuBarMode: 'disappearing', iconStyle: 'emoji', showMenuLabels: false, showMilestoneModal: false, homeLayoutMode: 'bento' },
                    desktop: { menuBarMode: 'disappearing', iconStyle: 'emoji', showMenuLabels: true, showMilestoneModal: false, homeLayoutMode: 'bento' }
                }
            });

            // 3. Create Authorized User
            const userRef = doc(db, "authorized_users", request.email);
            batch.set(userRef, {
                email: request.email,
                name: request.userName || 'Owner',
                role: 'admin',
                businessId: businessSlug,
                approvedAt: serverTimestamp()
            }, { merge: true });

            // 4. Update Request Status
            const requestRef = doc(db, "business_requests", request.id);
            batch.update(requestRef, {
                status: 'approved',
                approvedAt: serverTimestamp(),
                assignedBusinessId: businessSlug
            });

            await batch.commit();
            showToast(`Approved: ${request.businessName}`, "success");
        } catch (error) {
            console.error("Approval failed:", error);
            showToast("Failed to approve business", "error");
        }
    };

    const rejectRequest = async (requestId) => {
        try {
            await updateDoc(doc(db, "business_requests", requestId), {
                status: 'rejected',
                rejectedAt: serverTimestamp()
            });
            showToast("Request rejected", "info");
        } catch (err) {
            showToast("Failed to reject", "error");
        }
    };

    if (!isSuperAdmin) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <X size={48} color="red" />
                <h2>Access Denied</h2>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', height: '100dvh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <div style={{ background: 'var(--color-primary)', padding: '12px', borderRadius: '16px', color: 'white' }}>
                    <ShieldCheck size={28} />
                </div>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--color-text-main)' }}>Master Control</h1>
                    <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Validate & Onboard New Businesses</p>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner"></div></div>
            ) : requests.length === 0 ? (
                <div style={{
                    padding: '60px 40px',
                    textAlign: 'center',
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    borderRadius: '24px',
                    border: '1px dashed var(--color-border)'
                }}>
                    <Clock size={40} color="var(--color-text-muted)" style={{ marginBottom: '16px' }} />
                    <h3 style={{ color: 'var(--color-text-main)', margin: '0 0 8px 0' }}>No Pending Requests</h3>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>You are all caught up!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {requests.map((req) => (
                        <motion.div
                            layout
                            key={req.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{
                                background: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                                padding: '24px',
                                borderRadius: '24px',
                                border: '1px solid var(--color-border)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{req.businessName}</h3>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        padding: '2px 8px',
                                        borderRadius: '8px',
                                        background: 'var(--color-primary-light)',
                                        color: 'white',
                                        fontWeight: 800,
                                        textTransform: 'uppercase'
                                    }}>{req.businessType}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                        <Users size={14} /> {req.userName}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                        <Mail size={14} /> {req.email}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                        <Phone size={14} /> {req.phone}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                        <Store size={14} /> Requested {new Date(req.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                {req.message && (
                                    <div style={{
                                        marginTop: '16px',
                                        padding: '12px',
                                        background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                                        borderRadius: '12px',
                                        fontSize: '0.9rem',
                                        color: 'var(--color-text-main)',
                                        fontStyle: 'italic'
                                    }}>
                                        "{req.message}"
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginLeft: '24px' }}>
                                <button
                                    onClick={() => rejectRequest(req.id)}
                                    style={{
                                        width: '44px', height: '44px', borderRadius: '14px',
                                        border: '1px solid #ef4444', color: '#ef4444',
                                        background: 'transparent', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    <X size={20} />
                                </button>
                                <button
                                    onClick={() => approveRequest(req)}
                                    style={{
                                        padding: '0 20px', height: '44px', borderRadius: '14px',
                                        backgroundColor: '#10b981', color: 'white',
                                        border: 'none', fontWeight: 700, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                    }}
                                >
                                    <Check size={20} /> Approve
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SuperAdmin;
