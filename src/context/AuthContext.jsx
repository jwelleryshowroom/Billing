import React, { useEffect, useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { AuthContext } from './AuthContextDef';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAllowed, setIsAllowed] = useState(null);

    // Backend Role from Firestore
    const [backendRole, setBackendRole] = useState(null);

    const role = backendRole || 'guest';

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
        if (cachedRole && cachedEmail) {
            setBackendRole(cachedRole);
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
                    const docRef = doc(db, "authorized_users", currentUser.email);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        const realRole = data.role || 'guest';

                        setIsAllowed(true);
                        setBackendRole(realRole);

                        // Cache for next boot
                        localStorage.setItem('cached_role', realRole);
                        localStorage.setItem('cached_email', currentUser.email);
                    } else {
                        console.warn("User email not found in authorized_users collection.");
                        setIsAllowed(false);
                        setBackendRole('guest');
                        localStorage.removeItem('cached_role'); // Clear invalid cache
                    }
                } catch (error) {
                    console.error("Error checking authorization:", error);
                    setIsAllowed(false);
                }
            } else {
                setIsAllowed(false);
                // Clear cache on logout
                localStorage.removeItem('cached_role');
                localStorage.removeItem('cached_email');
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const value = {
        user,
        isAllowed,
        role,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
