import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    writeBatch,
    getDocs,
    query,
    where
} from 'firebase/firestore';
import { useToast } from './useToast';
import { useAuth } from './useAuth';
import { getCollectionRef } from '../utils/dataService';

const InventoryContext = createContext();

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }) => {
    // Initial Seed Data (Same as before)
    const defaultItems = [
        { name: 'Veg Puff', price: 25, category: 'Snacks', stock: 45, image: '🥐' },
        { name: 'Black Forest (1kg)', price: 800, category: 'Cakes', stock: 2, image: '🎂' },
        { name: 'Chocolate Truffle', price: 550, category: 'Cakes', stock: 5, image: '🍫' },
        { name: 'Pineapple Cake', price: 450, category: 'Cakes', stock: 3, image: '🍰' },
        { name: 'Coke (300ml)', price: 40, category: 'Drinks', stock: 45, image: '🥤' },
        { name: 'Chicken Puff', price: 35, category: 'Snacks', stock: 8, image: '🍖' },
        { name: 'Cupcake', price: 60, category: 'Pastries', stock: 15, image: '🧁' },
        { name: 'Donut', price: 80, category: 'Pastries', stock: 10, image: '🍩' },
        { name: 'Cold Coffee', price: 65, category: 'Drinks', stock: 20, image: '☕' },
    ];

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const { businessId, loading: authLoading } = useAuth();

    // 1. Realtime Sync with Firestore (Only when authenticated & businessId available)
    useEffect(() => {
        if (authLoading || !businessId) {
            setItems([]);
            return;
        }

        setLoading(true);
        const q = query(
            getCollectionRef(businessId, 'inventory'),
            where('businessId', '==', businessId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));

            // Auto-Seed if empty and not loading for the first time
            if (docs.length === 0 && !snapshot.metadata.hasPendingWrites) {
                checkAndSeed(docs);
            } else {
                setItems(docs);
                setLoading(false);
            }
        }, (error) => {
            console.error("Inventory Sync Error:", error);
            // Only show toast if it's NOT a permission error (to avoid spamming guests)
            if (error.code !== 'permission-denied') {
                showToast("Failed to sync inventory", "error");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [businessId, authLoading]);

    const checkAndSeed = async (currentDocs) => {
        // Double check to prevent loops
        if (currentDocs.length > 0) return;

        try {
            // Explicitly check server state once to be sure
            const q = query(
                getCollectionRef(businessId, 'inventory')
            );
            const snap = await getDocs(q);
            if (snap.size === 0) {
                console.log("Seeding Database for business:", businessId);
                const batch = writeBatch(db);
                defaultItems.forEach(item => {
                    const docRef = doc(getCollectionRef(businessId, 'inventory'));
                    batch.set(docRef, { ...item, businessId });
                });
                await batch.commit();
                showToast("Database safely seeded with default menu", "success");
            }
        } catch (err) {
            console.error("Seeding failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const addItem = async (newItem) => {
        try {
            // Remove undefined fields to prevent Firestore crashes
            const cleanItem = JSON.parse(JSON.stringify(newItem));

            await addDoc(getCollectionRef(businessId, 'inventory'), {
                ...cleanItem,
                businessId // Keeping for redundancy/indexing compatibility
            });
            showToast("Item added to menu", "success");
        } catch (error) {
            console.error("Error adding item:", error);
            const msg = error.code === 'permission-denied' ? 'Permission Denied: You are not authorized.' : error.message;
            showToast(`Failed: ${msg}`, "error");
        }
    };

    const updateItem = async (id, updates) => {
        try {
            const docRef = doc(getCollectionRef(businessId, 'inventory'), id);
            await updateDoc(docRef, updates);
            // No toast needed for minor updates usually, or keep it subtle
        } catch (error) {
            console.error("Error updating item:", error);
            showToast("Failed to update item", "error");
        }
    };

    const deleteItem = async (id) => {
        try {
            await deleteDoc(doc(getCollectionRef(businessId, 'inventory'), id));
            showToast("Item removed from menu", "success");
        } catch (error) {
            console.error("Error deleting item:", error);
            showToast("Failed to delete item", "error");
        }
    };

    const clearAllInventory = async () => {
        try {
            const hierarchicalRef = query(getCollectionRef(businessId, 'inventory'), where('businessId', '==', businessId));
            const hierarchicalSnap = await getDocs(hierarchicalRef);

            const legacyRef = query(collection(db, 'inventory_items'), where('businessId', '==', businessId));
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
            showToast("Inventory cleared.", "success");
        } catch (error) {
            console.error("Error clearing inventory:", error);
            showToast("Failed to clear inventory.", "error");
        }
    };

    // [New] Deduplicate Items
    const deduplicateInventory = async () => {
        if (!items || items.length === 0) return;

        try {
            const seen = new Set();
            const duplicates = [];
            const batch = writeBatch(db);
            let dupCount = 0;

            // Sort by creation time (if avail) or just ID to be deterministic
            // We want to keep the "first" one we see, or the "most complete" one.
            // Let's iterate and keep the first occurrence of Name+Category.

            items.forEach(item => {
                const key = `${item.name?.toLowerCase().trim()}-${item.category?.toLowerCase().trim()}`;
                if (seen.has(key)) {
                    // This is a duplicate!
                    const docRef = doc(getCollectionRef(businessId, 'inventory'), item.id);
                    batch.delete(docRef);
                    dupCount++;
                } else {
                    seen.add(key);
                }
            });

            if (dupCount > 0) {
                await batch.commit();
                showToast(`Removed ${dupCount} duplicate items.`, "success");
            } else {
                showToast("No duplicates found.", "info");
            }
        } catch (error) {
            console.error("Deduplication failed:", error);
            showToast("Failed to remove duplicates.", "error");
        }
    };

    const getItemsByCategory = (category) => {
        if (category === 'All') return items;
        return items.filter(i => i.category === category);
    };

    return (
        <InventoryContext.Provider value={{ items, addItem, updateItem, deleteItem, clearAllInventory, deduplicateInventory, getItemsByCategory, loading }}>
            {children}
        </InventoryContext.Provider>
    );
};
