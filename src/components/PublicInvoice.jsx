import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, doc, getDoc, collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getCollectionRef } from '../utils/dataService';
import { Loader2, AlertCircle, ChefHat, Star } from 'lucide-react';
import '../public-invoice.v2.css';

const PublicInvoice = () => {
    const { orderId, businessId } = useParams();
    const [transaction, setTransaction] = useState(null);
    const [businessProfile, setBusinessProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!orderId) throw new Error('No order ID provided');

                // A. Fetch Business Profile First
                if (businessId) {
                    const bizRef = doc(db, 'businesses', businessId);
                    const bizSnap = await getDoc(bizRef);
                    if (bizSnap.exists()) {
                        setBusinessProfile(bizSnap.data());
                    }
                }

                let data = null;

                // 1. Try Hierarchical Path (Standard)
                if (businessId) {
                    const docRef = doc(getCollectionRef(businessId, 'transactions'), orderId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) data = { id: docSnap.id, ...docSnap.data() };
                }

                // 2. Try Legacy/Root Path
                if (!data) {
                    const legacyRef = doc(db, 'transactions', orderId);
                    const legacySnap = await getDoc(legacyRef);
                    if (legacySnap.exists()) {
                        data = { id: legacySnap.id, ...legacySnap.data() };
                        if (data.businessId) {
                            const bizRef = doc(db, 'businesses', data.businessId);
                            const bizSnap = await getDoc(bizRef);
                            if (bizSnap.exists()) setBusinessProfile(bizSnap.data());
                        }
                    }
                }

                // 3. Fallback: Search all transactions (Collection Group lookup)
                if (!data) {
                    const q = query(collectionGroup(db, 'transactions'), where('id', '==', orderId));
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        data = { id: snap.docs[0].id, ...snap.docs[0].data() };
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

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a202c' }}>
            <Loader2 className="animate-spin" size={32} color="white" />
        </div>
    );

    if (error || !transaction) return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '1rem', background: '#1a202c', color: 'white' }}>
            <AlertCircle size={48} color="#ef4444" />
            <p>{error || 'Something went wrong'}</p>
        </div>
    );

    const bizName = businessProfile?.name || 'Pihu Ki Bakery';
    const bizAddress = businessProfile?.address || 'Kishanganj, Bihar';
    // Format phone with +91 if missing
    let bizPhone = businessProfile?.phone || '';
    if (bizPhone && !bizPhone.startsWith('+')) {
        bizPhone = `+91 ${bizPhone}`;
    }
    const bizFooter = businessProfile?.footer || 'Thank you for visiting!';

    // Check if it's an order/booking (not yet completed/delivered or explicitly typed as booking)
    const isBooking = transaction.type === 'ORDER_BOOKING' || (transaction.type === 'order' && transaction.status !== 'completed' && transaction.status !== 'delivered');

    return (
        <div className="invoice-container">
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#e2e8f0', fontWeight: '700', letterSpacing: '1.5px' }}>
                <ChefHat size={22} strokeWidth={2} />
                <span style={{ textTransform: 'uppercase', fontSize: '0.9rem' }}>{isBooking ? 'BOOKING RECEIPT' : 'TAX INVOICE'}</span>
            </div>

            <div className="receipt-card">
                <div style={{ textAlign: 'center', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.4rem', color: '#111827', letterSpacing: '-0.02em' }}>{bizName}</h1>
                    <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        lineHeight: '1.3',
                        maxWidth: '280px',
                        margin: '0 auto',
                        textAlign: 'center',
                        textWrap: 'balance',
                        display: 'block'
                    }}>
                        {bizAddress.replace(/\n+/g, ' ')}
                    </div>
                    {bizPhone && (
                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#374151', marginTop: '8px' }}>
                            {bizPhone}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>
                    <span>Order Details</span>
                    <span>Date</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.95rem', fontWeight: '800', color: '#111827' }}>
                    <span style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>#{String(transaction.id || orderId).slice(-6).toUpperCase()}</span>
                    <span>{transaction.date ? new Date(transaction.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(100px, 1fr) 40px 60px 80px',
                    paddingBottom: '0.75rem',
                    borderBottom: '2px dashed #f3f4f6',
                    fontSize: '0.65rem',
                    fontWeight: '800',
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    marginBottom: '1rem',
                    letterSpacing: '0.05em'
                }}>
                    <span>Item</span>
                    <span style={{ textAlign: 'center' }}>Qty</span>
                    <span style={{ textAlign: 'right' }}>Rate</span>
                    <span style={{ textAlign: 'right' }}>Total</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(transaction.items || []).map((item, index) => {
                        const qty = item.qty || item.quantity || 1;
                        const price = Number(item.price || 0);
                        const total = price * qty;
                        return (
                            <div key={index} style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, 1fr) 40px 60px 80px', gap: '4px', fontSize: '0.85rem', alignItems: 'start' }}>
                                <span style={{ fontWeight: '700', color: '#111827', textAlign: 'left' }}>{item.name}</span>
                                <span style={{ textAlign: 'center', color: '#4b5563', fontWeight: '500' }}>{qty}</span>
                                <span style={{ textAlign: 'right', color: '#4b5563' }}>{price.toFixed(2)}</span>
                                <span style={{ textAlign: 'right', fontWeight: '800', color: '#111827' }}>{total.toFixed(2)}</span>
                            </div>
                        );
                    })}
                </div>

                <div style={{ borderTop: '1px dashed #e5e7eb', marginTop: '1.5rem', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '900', color: '#111827' }}>
                        <span>Total Amount</span>
                        <span>₹{Number(transaction.totalValue || transaction.amount || 0).toFixed(2)}</span>
                    </div>

                    {(transaction.advancePaid > 0 || (transaction.payment?.advance > 0)) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: '600', color: '#16a34a', marginTop: '0.6rem' }}>
                            <span>Advance Paid</span>
                            <span>- ₹{Number(transaction.payment?.advance || transaction.advancePaid).toFixed(2)}</span>
                        </div>
                    )}
                    {(transaction.balanceDue > 0 || (transaction.payment?.balance > 0)) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: '900', color: '#dc2626', marginTop: '0.4rem' }}>
                            <span>Balance Due</span>
                            <span>₹{Number(transaction.payment?.balance || transaction.balanceDue).toFixed(2)}</span>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '2.5rem', textAlign: 'center', borderTop: '1px solid #f3f4f6', paddingTop: '1.5rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>{bizName}</div>

                    {isBooking && (
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#111827', letterSpacing: '0.5px' }}>* PLEASE BRING THIS SLIP *</div>
                            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '2px' }}>Order is subject to confirmation.</div>
                        </div>
                    )}

                    <div style={{ fontSize: '0.7rem', color: '#9ca3af', lineHeight: '1.6' }}>
                        {bizFooter}<br />
                        <span style={{ fontWeight: '600', letterSpacing: '0.5px' }}>NO RETURN • NO REFUND • NO EXCHANGE</span>
                    </div>
                </div>
            </div>

            <div className="app-footer">
                <button className="share-btn" onClick={() => window.open('https://g.page/r/your-google-review-link', '_blank')} style={{
                    background: '#374151',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    color: 'white',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}>
                    <Star size={20} fill="#fbbf24" color="#fbbf24" />
                    <span>RATE US ON GOOGLE</span>
                </button>
            </div>

            <div style={{ position: 'fixed', bottom: '2px', right: '5px', fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)' }}>
                v2.5.0
            </div>
        </div>
    );
};

export default PublicInvoice;
