import { db } from '../firebase';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { getCollectionRef } from './dataService';

/**
 * Professional Migration Utility
 * Moves data from legacy flat collections to hierarchical sub-collections.
 */
export const migrateBusinessData = async (businessId) => {
    if (!businessId) return { success: false, error: "Missing businessId" };

    const collectionsToMigrate = ['transactions', 'inventory_items', 'customers'];
    let totalMoved = 0;

    try {
        for (const colName of collectionsToMigrate) {
            console.log(`Migrating ${colName} for ${businessId}...`);
            const legacyRef = collection(db, colName);
            const q = query(legacyRef, where('businessId', '==', businessId));
            const snap = await getDocs(q);

            if (snap.empty) continue;

            const targetRef = getCollectionRef(businessId, colName === 'inventory_items' ? 'inventory' : colName);

            // Process in batches
            const docs = snap.docs;
            for (let i = 0; i < docs.length; i += 450) {
                const batch = writeBatch(db);
                const chunk = docs.slice(i, i + 450);

                chunk.forEach(oldDoc => {
                    const newDocRef = doc(targetRef, oldDoc.id);
                    batch.set(newDocRef, oldDoc.data());
                    // Option: delete old doc? Let's keep for safety until verified
                    // batch.delete(oldDoc.ref); 
                });

                await batch.commit();
                totalMoved += chunk.length;
            }
        }
        return { success: true, count: totalMoved };
    } catch (err) {
        console.error("Migration failed:", err);
        return { success: false, error: err.message };
    }
};
