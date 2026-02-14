import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, where, serverTimestamp, increment, writeBatch } from 'firebase/firestore';
import { useToast } from './useToast';
import { useAuth } from './useAuth';
import { getCollectionRef } from '../utils/dataService';


const CustomerContext = createContext();

export const useCustomers = () => useContext(CustomerContext);

export const CustomerProvider = ({ children }) => {
    const [customers, setCustomers] = useState({}); // Cache by Phone Number
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const { businessId, loading: authLoading } = useAuth();


    // 1. Initial Load (Build Cache)
    useEffect(() => {
        if (authLoading || !businessId) {
            setCustomers({});
            return;
        }

        const fetchCustomers = async () => {
            try {
                const q = query(
                    getCollectionRef(businessId, 'customers'),
                    where('businessId', '==', businessId)
                );
                const snapshot = await getDocs(q);

                const cache = {};
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.phone) {
                        cache[data.phone] = { id: doc.id, ...data };
                    }
                });

                setCustomers(cache);
                setLoading(false);
            } catch (error) {
                console.error("Failed to load customers:", error);
                // Fail silently, don't block app
                setLoading(false);
            }
        };

        fetchCustomers();
    }, [businessId, authLoading]);

    // 2. Add or Update Customer (Called on Checkout)
    const addOrUpdateCustomer = async (transactionData) => {
        const { customer } = transactionData;

        // Skip if no valid phone
        if (!customer || !customer.phone || customer.phone.length !== 10) return;

        const phone = customer.phone;
        const name = customer.name || 'Unknown';
        const customerRef = doc(getCollectionRef(businessId, 'customers'), phone);

        try {
            const exists = customers[phone];

            const updates = {
                phone,
                businessId, // Inject businessId
                name, // Always update name to latest used
                lastVisit: serverTimestamp(),
                visitCount: increment(1),
                totalSpent: increment(transactionData.amount || 0)
            };

            // If they provided a note, append or update it? For now, we only update if provided.
            if (customer.note) {
                updates.lastNote = customer.note;
            }

            // Optimistic Cache Update
            setCustomers(prev => ({
                ...prev,
                [phone]: {
                    ...prev[phone],
                    name,
                    visitCount: (exists?.visitCount || 0) + 1,
                    totalSpent: (exists?.totalSpent || 0) + (transactionData.amount || 0),
                    lastVisit: new Date().toISOString() // Approximate
                }
            }));

            // Async Firestore Update
            await setDoc(customerRef, updates, { merge: true });

        } catch (error) {
            console.error("Error saving customer:", error);
            // Silent error, don't stop checkout
        }
    };

    // 3. Fast Lookup
    const getCustomerByPhone = (phone) => {
        if (!phone) return null;
        return customers[phone] || null;
    };

    const clearAllCustomers = async () => {
        try {
            const hierarchicalRef = query(getCollectionRef(businessId, 'customers'), where('businessId', '==', businessId));
            const hierarchicalSnap = await getDocs(hierarchicalRef);

            const legacyRef = query(collection(db, 'customers'), where('businessId', '==', businessId));
            const legacySnap = await getDocs(legacyRef);

            if (hierarchicalSnap.size > 0) {
                const batch = writeBatch(db);
                hierarchicalSnap.docs.forEach(d => batch.delete(d.ref));
                await batch.commit();
            }
            if (legacySnap.size > 0) {
                const batch = writeBatch(db);
                legacySnap.docs.forEach(d => batch.delete(d.ref));
                await batch.commit();
            }
            setCustomers({});
            showToast("Customer database cleared.", "success");
        } catch (error) {
            console.error("Error clearing customers:", error);
            showToast("Failed to clear customers.", "error");
        }
    };

    const value = {
        customers,
        loading,
        addOrUpdateCustomer,
        getCustomerByPhone,
        clearAllCustomers
    };

    return (
        <CustomerContext.Provider value={value}>
            {children}
        </CustomerContext.Provider>
    );
};
