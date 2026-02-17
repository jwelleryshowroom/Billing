import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, setDoc, deleteDoc, updateDoc, doc, onSnapshot, query, orderBy, writeBatch, getDocs, where } from 'firebase/firestore';
import { useToast } from './useToast';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { TransactionContext } from './TransactionContextDef';
import { useAuth } from './useAuth';
import { getCollectionRef } from '../utils/dataService';

export const TransactionProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    // Default range: Current Month
    const [currentRange, setCurrentRange] = useState({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    });
    const { showToast } = useToast();
    const { businessId, loading: authLoading } = useAuth();

    useEffect(() => {
        if (authLoading || !businessId) {
            setTransactions([]);
            return;
        }

        // Root-level Query with Isolation
        const q = query(
            getCollectionRef(businessId, 'transactions'),
            // Removed redundant businessId filter as we are querying a specific sub-collection
            // where('businessId', '==', businessId),
            where('date', '>=', currentRange.start.toISOString()),
            where('date', '<=', currentRange.end.toISOString()),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTransactions(docs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching transactions:", error);

            // Handle specific cases
            if (error.code === 'permission-denied') {
                showToast("Access Denied: Restricted data area.", "error");
            } else if (error.code === 'failed-precondition') {
                // Usually missing index - keep it subtle or log link
                console.warn("Firestore Index Required. Check console for builder link.");
            } else {
                showToast("Failed to sync data.", "error");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentRange, showToast, businessId, authLoading]);

    // Function to update the view (Components call this to switch context)
    const setViewDateRange = React.useCallback((startDate, endDate) => {
        setLoading(true);
        // Ensure we cover the full day boundaries
        setCurrentRange({
            start: startOfDay(startDate),
            end: endOfDay(endDate)
        });
    }, []);

    const fetchTransactionsByRange = React.useCallback(async (startDate, endDate) => {
        if (!businessId) return [];
        const q = query(
            getCollectionRef(businessId, 'transactions'),
            where('date', '>=', startOfDay(startDate).toISOString()),
            where('date', '<=', endOfDay(endDate).toISOString()),
            orderBy('date', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }, [businessId]);

    const addTransaction = async (transaction) => {
        try {
            // Remove undefined fields to prevent Firestore crashes
            const cleanTransaction = JSON.parse(JSON.stringify(transaction));

            const docRef = doc(getCollectionRef(businessId, 'transactions'));
            await setDoc(docRef, {
                ...cleanTransaction,
                id: docRef.id, // Store ID inside for global lookups
                businessId,
                date: cleanTransaction.date || new Date().toISOString(),
                createdAt: new Date().toISOString()
            });
            // Silent success (User requested removal of notification)
            return docRef;
        } catch (error) {
            console.error("Error adding transaction:", error);
            showToast(`Failed: ${error.message}`, "error");
            throw error;
        }
    };

    const updateTransaction = async (id, updates) => {
        try {
            // Remove any undefined fields to prevent Firestore errors
            const cleanUpdates = JSON.parse(JSON.stringify(updates));

            await updateDoc(doc(getCollectionRef(businessId, 'transactions'), id), cleanUpdates);
            showToast("Order updated.", "success");
        } catch (error) {
            console.error("Error updating transaction:", error);
            showToast("Failed to update order.", "error");
        }
    };

    const deleteTransaction = async (id) => {
        // Find transaction data before deleting for Undo capability
        const transactionToDelete = transactions.find(t => t.id === id);

        try {
            await deleteDoc(doc(getCollectionRef(businessId, 'transactions'), id));

            if (transactionToDelete) {
                const { id: _, ...dataToRestore } = transactionToDelete;
                showToast("Transaction deleted.", "info", {
                    label: "UNDO",
                    onClick: () => addTransaction(dataToRestore) // Re-add clean data
                });
            } else {
                showToast("Transaction deleted.", "info");
            }
        } catch (error) {
            console.error("Error deleting transaction:", error);
            showToast("Failed to delete transaction.", "error");
        }
    };

    // [Refactored] Helper for Safe Batch Deletion (Chunks of 450)
    const safeBatchDelete = async (querySnapshot) => {
        const MAX_BATCH_SIZE = 450;
        const docs = querySnapshot.docs;
        const chunks = [];

        // Split docs into chunks
        for (let i = 0; i < docs.length; i += MAX_BATCH_SIZE) {
            chunks.push(docs.slice(i, i + MAX_BATCH_SIZE));
        }

        // Process chunks sequentially
        let deletedCount = 0;
        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            deletedCount += chunk.length;
            console.log(`Deleted batch of ${chunk.length} items...`);
        }
        return deletedCount;
    };

    const deleteTransactionsByDateRange = async (startDate, endDate) => {
        try {
            // 1. Hierarchical
            const hierarchicalRef = getCollectionRef(businessId, 'transactions');
            const hQuery = query(hierarchicalRef, where('date', '>=', startDate), where('date', '<=', endDate));
            const hSnap = await getDocs(hQuery);

            // 2. Legacy
            const legacyRef = collection(db, 'transactions');
            const lQuery = query(legacyRef, where('businessId', '==', businessId), where('date', '>=', startDate), where('date', '<=', endDate));
            const lSnap = await getDocs(lQuery);

            let deleted = 0;
            if (hSnap.size > 0) deleted += await safeBatchDelete(hSnap);
            if (lSnap.size > 0) deleted += await safeBatchDelete(lSnap);

            if (deleted === 0) {
                showToast("No records found in range.", "info");
            } else {
                showToast(`Cleared ${deleted} records safely.`, "success");
            }
        } catch (error) {
            console.error("Error deleting data range:", error);
            showToast("Failed to clear data.", "error");
        }
    };

    const clearAllTransactions = async () => {
        try {
            // 1. Clear Data in root (Professional/Legacy combined)
            const hierarchicalRef = query(getCollectionRef(businessId, 'transactions'), where('businessId', '==', businessId));
            const hierarchicalSnap = await getDocs(hierarchicalRef);

            // 2. Clear Legacy Data (Flat)
            const legacyRef = query(collection(db, 'transactions'), where('businessId', '==', businessId));
            const legacySnap = await getDocs(legacyRef);

            const total = hierarchicalSnap.size + legacySnap.size;
            if (total === 0) {
                showToast("Database is already empty.", "info");
                return;
            }

            let deleted = 0;
            if (hierarchicalSnap.size > 0) deleted += await safeBatchDelete(hierarchicalSnap);
            if (legacySnap.size > 0) deleted += await safeBatchDelete(legacySnap);

            showToast(`Database wiped (${deleted} records).`, "success");
        } catch (error) {
            console.error("Error clearing database:", error);
            showToast("Failed to wipe database.", "error");
        }
    };

    const value = {
        transactions,
        loading,
        currentRange,
        setViewDateRange,
        fetchTransactionsByRange,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        deleteTransactionsByDateRange,
        clearAllTransactions
    };

    return (
        <TransactionContext.Provider value={value}>
            {children}
        </TransactionContext.Provider>
    );
};
