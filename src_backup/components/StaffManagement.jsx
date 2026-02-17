import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { UserPlus, Trash2, Shield, User, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';

const StaffManagement = () => {
    const { businessId, isSuperAdmin } = useAuth();
    const { showToast } = useToast();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [newStaff, setNewStaff] = useState({ email: '', name: '', role: 'staff' });

    useEffect(() => {
        if (businessId) {
            fetchStaff();
        }
    }, [businessId]);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'authorized_users'), where('businessId', '==', businessId));
            const snap = await getDocs(q);
            setStaff(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
            console.error("Fetch staff error:", err);
            showToast("Failed to load team members", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newStaff.email || !newStaff.name) return;

        setAdding(true);
        try {
            const userRef = doc(db, 'authorized_users', newStaff.email.toLowerCase().trim());
            await setDoc(userRef, {
                email: newStaff.email.toLowerCase().trim(),
                name: newStaff.name,
                role: newStaff.role,
                businessId: businessId,
                addedAt: serverTimestamp()
            }, { merge: true });

            showToast(`${newStaff.name} added to your team`, "success");
            setNewStaff({ email: '', name: '', role: 'staff' });
            fetchStaff();
        } catch (err) {
            console.error("Add staff error:", err);
            showToast("Failed to add member", "error");
        } finally {
            setAdding(false);
        }
    };

    const handleRemove = async (email, name) => {
        if (!window.confirm(`Are you sure you want to remove ${name}?`)) return;

        triggerHaptic('medium');
        try {
            await deleteDoc(doc(db, 'authorized_users', email));
            showToast("Member removed", "success");
            fetchStaff();
        } catch (err) {
            console.error("Remove staff error:", err);
            showToast("Failed to remove member", "error");
        }
    };

    return (
        <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-main)', marginBottom: '16px', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={16} /> Team Management
            </h3>

            {/* Add Member Form */}
            <form onSubmit={handleAdd} style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '16px',
                borderRadius: '20px',
                border: '1px solid var(--color-border)',
                marginBottom: '20px'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <input
                        placeholder="Full Name"
                        value={newStaff.name}
                        onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                        style={{ padding: '10px', borderRadius: '10px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', fontSize: '0.9rem' }}
                    />
                    <select
                        value={newStaff.role}
                        onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                        style={{ padding: '10px', borderRadius: '10px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', fontSize: '0.9rem' }}
                    >
                        <option value="staff">Circuit (Staff)</option>
                        <option value="admin">Munna Bhai (Admin)</option>
                    </select>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={newStaff.email}
                        onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                        style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', fontSize: '0.9rem' }}
                    />
                    <button
                        disabled={adding}
                        type="submit"
                        style={{ padding: '10px 20px', borderRadius: '10px', background: 'var(--color-primary)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {adding ? <Loader2 size={18} className="spin" /> : 'Add'}
                    </button>
                </div>
            </form>

            {/* Member List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        <Loader2 className="spin" />
                    </div>
                ) : staff.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        No team members added yet.
                    </div>
                ) : (
                    staff.map(member => (
                        <div key={member.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '16px',
                            border: '1px solid var(--color-border)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '10px',
                                    background: member.role === 'admin' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                    color: member.role === 'admin' ? '#facc15' : '#60a5fa',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {member.role === 'admin' ? <Shield size={18} /> : <User size={18} />}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.95rem' }}>{member.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{member.email}</div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleRemove(member.id, member.name)}
                                style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default StaffManagement;
