import React, { useEffect, useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { AuthContext } from './AuthContextDef';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAllowed, setIsAllowed] = useState(null);

    // Backend Role & Business from Firestore
    const [backendRole, setBackendRole] = useState(null);
    const [businessId, setBusinessId] = useState(null);
    const [overrideBusinessId, setOverrideBusinessId] = useState(() => localStorage.getItem('sa_override_biz'));

    const [availableBusinesses, setAvailableBusinesses] = useState([]);

    const isSuperAdmin = user?.email?.toLowerCase() === 'msdhrsah@gmail.com';
    const activeBusinessId = (isSuperAdmin && overrideBusinessId) ? overrideBusinessId : businessId;

    useEffect(() => {
        if (isSuperAdmin && user) {
            const fetchAll = async () => {
                try {
                    const snap = await getDocs(collection(db, "businesses"));
                    setAvailableBusinesses(snap.docs.map(d => ({ id: d.id, name: d.data().name || 'Unnamed Business', ...d.data() })));
                } catch (err) {
                    console.error("Super Admin: Failed to fetch businesses list:", err);
                }
            };
            fetchAll();
        }
    }, [isSuperAdmin, user]);

    // Force 'admin' role for SA even if Firestore hasn't caught up
    const role = isSuperAdmin ? 'admin' : (backendRole || 'guest');

    const login = () => {
        return signInWithPopup(auth, googleProvider);
    };

    const logout = () => {
        return signOut(auth);
    };

    useEffect(() => {
        // 🚀 OPTIMIZATION: Check LocalStorage for cached role/user to load UI immediately
        const cachedRole = localStorage.getItem('cached_role');
        const cachedEmail = localStorage.getItem('cached_email');
        const cachedBusinessId = localStorage.getItem('cached_business_id');

        if (cachedRole && cachedEmail) {
            setBackendRole(cachedRole);
            setBusinessId(cachedBusinessId);
            setLoading(false); // Unblock UI immediately with cached data
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // If we don't have cached data, we might be loading (or if user changed)
                if (currentUser.email !== cachedEmail) {
                    setLoading(true);
                }

                setIsAllowed(null);
                try {
                    // Check if user exists in 'authorized_users' collection
                    const docRef = doc(db, "authorized_users", currentUser.email.toLowerCase());
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists() || currentUser.email?.toLowerCase() === 'msdhrsah@gmail.com') {
                        const data = docSnap.data() || {};
                        const isSA = currentUser.email?.toLowerCase() === 'msdhrsah@gmail.com';
                        const realRole = data.role || (isSA ? 'admin' : 'guest');
                        const bId = data.businessId || (isSA ? (overrideBusinessId || 'default_biz') : 'default_biz');

                        setIsAllowed(true);
                        setBackendRole(realRole);
                        setBusinessId(bId);

                        // Cache for next boot
                        localStorage.setItem('cached_role', realRole);
                        localStorage.setItem('cached_email', currentUser.email);
                        localStorage.setItem('cached_business_id', bId);
                    } else {
                        console.warn("User email not found in authorized_users collection.");
                        setIsAllowed(false);
                        setBackendRole('guest');
                        setBusinessId(null);
                        localStorage.removeItem('cached_role'); // Clear invalid cache
                        localStorage.removeItem('cached_business_id');
                    }
                } catch (error) {
                    console.error("Error checking authorization:", error);
                    setIsAllowed(false);
                }
            } else {
                setIsAllowed(false);
                setBusinessId(null);
                // Clear cache on logout
                localStorage.removeItem('cached_role');
                localStorage.removeItem('cached_email');
                localStorage.removeItem('cached_business_id');
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const userName = user?.displayName || 'User';

    const switchBusiness = (newId) => {
        if (!isSuperAdmin) return;
        setOverrideBusinessId(newId);
        if (newId) {
            localStorage.setItem('sa_override_biz', newId);
        } else {
            localStorage.removeItem('sa_override_biz');
        }
        // Force reload or just let context update? 
        // Better to reload settings context if needed.
    };

    const value = {
        user,
        isAllowed,
        role,
        businessId: activeBusinessId, // Swap official with active
        realBusinessId: businessId,   // Store original for reference
        userName,
        isSuperAdmin,
        availableBusinesses, // List of all businesses
        switchBusiness,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
