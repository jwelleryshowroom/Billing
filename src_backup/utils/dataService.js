import { db } from '../firebase';
import { collection, doc } from 'firebase/firestore';

/**
 * Professional Data Service Factory
 * Abstracts the hierarchical pathing for multi-tenancy.
 */
export const getCollectionRef = (businessId, type) => {
    if (!businessId) throw new Error("businessId is required for data access");

    // Map of logical collection types to their physical paths
    const paths = {
        'transactions': 'transactions',
        'inventory': 'inventory_items',
        'customers': 'customers'
    };

    // Simplified Root Paths for faster debugging and compatibility
    const collectionName = paths[type] || type;

    // UPDATED: Return Sub-Collection Ref (businesses/{id}/{collection})
    // This isolates data per business and improves scalability rules
    return collection(db, 'businesses', businessId, collectionName);
};

export const getDocRef = (businessId, type, docId) => {
    return doc(getCollectionRef(businessId, type), docId);
};

// [LEGACY SUPPORT] - Use this for a transition period if needed
export const getRootCollectionRef = (type) => {
    const paths = {
        'transactions': 'transactions',
        'inventory': 'inventory_items',
        'customers': 'customers'
    };
    return collection(db, paths[type] || type);
};
