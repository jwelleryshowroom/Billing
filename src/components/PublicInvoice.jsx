import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, doc, getDoc, collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getCollectionRef } from '../utils/dataService';
import { Loader2, AlertCircle, Phone, Share2, ChefHat, MapPin, Star } from 'lucide-react';

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
            {/* Styles... */}
            <div className="app-header">
                <ChefHat size={20} />
                <span>{isBooking ? 'BOOKING RECEIPT' : 'TAX INVOICE'}</span>
            </div>

            <div className="receipt-card">
                <div className="receipt-content">
                    <div className="store-name" style={{ textTransform: 'uppercase' }}>{bizName}</div>

                    <div className="store-address" style={{ whiteSpace: 'pre-wrap' }}>
                        {bizAddress}<br />
                        {bizPhone}
                    </div>

                    {/* ... (rest of the component) ... */}

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

            {/* EXPICIT SPACER to clear Fixed Footer */}
            <div style={{ width: '100%', height: '180px', flexShrink: 0 }}></div>

            <div className="app-footer">
                <a href={bizMapLink} target="_blank" rel="noreferrer" className="share-btn" style={{ textDecoration: 'none', background: '#374151', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <MapPin size={18} fill="#fca5a5" color="#ef4444" />
                    <span style={{ color: 'white' }}>LOCATE / RATE US</span>
                </a>
            </div>
        </div>
    );
};

export default PublicInvoice;
