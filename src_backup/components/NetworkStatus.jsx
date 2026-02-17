import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showBackOnline, setShowBackOnline] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowBackOnline(true);
            setTimeout(() => setShowBackOnline(false), 3000);
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    style={{
                        position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)',
                        background: 'rgba(239, 68, 68, 0.9)', // Red with slight transparency
                        backdropFilter: 'blur(8px)',
                        color: 'white',
                        padding: '12px 24px', borderRadius: '50px',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                        zIndex: 10000,
                        fontSize: '0.9rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}
                >
                    <WifiOff size={18} />
                    <span>No Internet Connection</span>
                </motion.div>
            )}

            {isOnline && showBackOnline && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    style={{
                        position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)',
                        background: 'rgba(16, 185, 129, 0.9)', // Green with slight transparency
                        backdropFilter: 'blur(8px)',
                        color: 'white',
                        padding: '12px 24px', borderRadius: '50px',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                        zIndex: 10000,
                        fontSize: '0.9rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}
                >
                    <Wifi size={18} />
                    <span>Back Online</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NetworkStatus;
