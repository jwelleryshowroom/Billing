import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, doc, getDoc, collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getCollectionRef } from '../utils/dataService';
import { Loader2, AlertCircle, Phone, Share2, ChefHat, MapPin, Star } from 'lucide-react';
import '../public-invoice.css';

const PublicInvoice = () => {
    const { orderId, businessId } = useParams();
    const [transaction, setTransaction] = useState(null);
    const [businessProfile, setBusinessProfile] = useState(null); // [NEW]
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!orderId) throw new Error('No order ID provided');

                // A. Fetch Business Profile First (if known)
                let activeBusinessId = businessId;
                if (businessId) {
                    const bizRef = doc(db, 'businesses', businessId);
                    const bizSnap = await getDoc(bizRef);
                    if (bizSnap.exists()) {
                        setBusinessProfile(bizSnap.data());
                    }
                }

                let data = null;

                // 1. Try Hierarchical Path (Professional Structure)
                if (businessId) {
                    const docRef = doc(getCollectionRef(businessId, 'transactions'), orderId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) data = { id: docSnap.id, ...docSnap.data() };
                }

                // 2. Try Legacy/Root Path if not found
                if (!data) {
                    const legacyRef = doc(db, 'transactions', orderId);
                    const legacySnap = await getDoc(legacyRef);
                    if (legacySnap.exists()) {
                        data = { id: legacySnap.id, ...legacySnap.data() };
                        // If we found data but didn't know businessId yet, try to fetch profile using data.businessId
                        if (!activeBusinessId && data.businessId) {
                            const bizRef = doc(db, 'businesses', data.businessId);
                            const bizSnap = await getDoc(bizRef);
                            if (bizSnap.exists()) setBusinessProfile(bizSnap.data());
                        }
                    }
                }

                // 3. Fallback: Collection Group Search (requires index, but good as last resort)
                if (!data) {
                    const q = query(collectionGroup(db, 'transactions'), where('id', '==', orderId));
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        data = { id: snap.docs[0].id, ...snap.docs[0].data() };
                        // Try to fetch profile using found businessId
                        if (!activeBusinessId && data.businessId) {
                            const bizRef = doc(db, 'businesses', data.businessId);
                            const bizSnap = await getDoc(bizRef);
                            if (bizSnap.exists()) setBusinessProfile(bizSnap.data());
                        }
                    }
                }

                if (data) {
                    setTransaction(data);
                } else {
                    setError('Invoice not found.');
                }
            } catch (err) {
                console.error("Error fetching invoice:", err);
                setError('Unable to load invoice.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [orderId, businessId]);

    // ... (rest of the file)

    // Helper to get fallback or dynamic values
    const bizName = businessProfile?.name || 'The Classic Confection'; // Fallback for legacy
    const bizAddress = businessProfile?.address || 'Mahavir Marg, opp. Hotel Shyam Palace\nGandhi Chowk, Kishanganj, Bihar 855108';
    const bizPhone = businessProfile?.phone || '+91 82945 56416';
    const bizFooter = businessProfile?.footer || 'Thank you for visiting!';
    const bizMapLink = businessProfile?.mapLink || 'https://maps.app.goo.gl/83qhC3mrtegUR7XM6'; // Default fallback

    const isBooking = transaction?.type === 'ORDER_BOOKING';

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Loader2 className="animate-spin" size={32} />
        </div>
    );

    if (error) return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '1rem' }}>
            <AlertCircle size={48} color="red" />
            <p>{error}</p>
        </div>
    );

    return (
        <div className="invoice-container">
            {/* Header Icon & Title */}
            <div className="app-header" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#e2e8f0', fontWeight: '600', letterSpacing: '1px', fontSize: '1rem' }}>
                <ChefHat size={24} strokeWidth={1.5} />
                <span style={{ textTransform: 'uppercase', letterSpacing: '2px' }}>{isBooking ? 'BOOKING RECEIPT' : 'TAX INVOICE'}</span>
            </div>

            {/* The Receipt Card */}
            <div className="receipt-card">
                {/* 1. Header Section */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', fontFamily: '"Outfit", sans-serif', letterSpacing: '-0.5px', color: '#111827' }}>{bizName}</h1>
                    <div style={{ fontSize: '0.8rem', color: '#4b5563', lineHeight: '1.5', whiteSpace: 'pre-wrap', maxWidth: '80%', margin: '0 auto' }}>
                        {bizAddress}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '4px' }}>
                        {bizPhone}
                    </div>
                </div>

                {/* 2. Meta Data Rows - Swapped ORDER DETAILS (Left) and DATE (Right) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem', fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span>Order Details</span>
                    <span>Date</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>#{transaction.id?.slice(-6).toUpperCase()}</span>
                    <span>{transaction.date ? new Date(transaction.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</span>
                </div>

                {/* 3. Items Header */}
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 3rem 4rem', paddingBottom: '0.75rem', borderBottom: '2px dashed #e5e7eb', fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>
                    <span>Item</span>
                    <span style={{ textAlign: 'center' }}>Qty</span>
                    <span style={{ textAlign: 'right' }}>Price</span>
                </div>

                {/* Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {(transaction.items || []).map((item, index) => (
                        <div key={index} style={{ display: 'grid', gridTemplateColumns: '4fr 1fr 2fr 2fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                            <span style={{ fontWeight: '500', color: '#1f2937' }}>{item.name}</span>
                            <span style={{ textAlign: 'center', color: '#4b5563' }}>{item.qty || item.quantity}</span>
                            <span style={{ textAlign: 'right', color: '#4b5563' }}>{Number(item.price).toFixed(2)}</span>
                            <span style={{ textAlign: 'right', fontWeight: '500', color: '#111827' }}>{Number(item.price * (item.qty || item.quantity)).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                {/* Totals Section */}
                <div style={{ borderTop: '1px dashed #e5e7eb', marginTop: '1rem', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '700', color: '#111827' }}>
                        <span>Total Amount</span>
                        <span>₹{Number(transaction.totalValue || transaction.amount || 0).toFixed(2)}</span>
                    </div>

                    {/* show advance/balance if booking or partial payment */}
                    {(transaction.payment?.balanceMethod || transaction.advancePaid > 0) && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#15803d' }}>
                                <span>Advance Paid</span>
                                <span>- ₹{Number(transaction.payment?.advance || transaction.advancePaid || 0).toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: '600', color: '#b91c1c' }}>
                                <span>Balance Due</span>
                                <span>₹{Number(transaction.payment?.balance || transaction.balanceDue || 0).toFixed(2)}</span>
                            </div>
                        </>
                    )}
                </div>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#374151' }}>
                    {bizName}
                    <div style={{ fontWeight: '500', color: '#9ca3af', fontSize: '0.65rem', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {isBooking ? (
                            <>
                                * PLEASE BRING THIS SLIP *<br />
                                <span style={{ textTransform: 'none', fontWeight: 'normal' }}>Order is subject to confirmation.</span>
                            </>
                        ) : (
                            bizFooter
                        )}
                    </div>
                </div>
            </div>
        </div>

            {/* EXPICIT SPACER to clear Fixed Footer */ }
            <div style={{ width: '100%', height: '180px', flexShrink: 0 }}></div>

            <div className="app-footer">
                <a href={bizMapLink} target="_blank" rel="noreferrer" className="share-btn" style={{ textDecoration: 'none', background: '#374151', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <MapPin size={18} fill="#fca5a5" color="#ef4444" />
                    <span style={{ color: 'white' }}>LOCATE / RATE US</span>
                </a>
            </div>
        </div >
    );
};

export default PublicInvoice;
