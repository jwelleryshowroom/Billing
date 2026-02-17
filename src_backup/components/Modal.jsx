import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useInstall } from '../context/useInstall';
import { triggerHaptic } from '../utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';

const Modal = ({ isOpen, onClose, title, children, zIndex = 20002 }) => {
    const { isStandalone } = useInstall();

    // Prevent scrolling when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: zIndex,
                    display: 'flex',
                    alignItems: 'center', // Default center
                    justifyContent: 'center',
                    padding: '20px',
                }} className="modal-overlay">
                    <style>{`
                        .modal-overlay {
                            align-items: center;
                        }
                        @media (max-width: 600px) {
                            .modal-overlay {
                                alignItems: flex-start !important; /* Top aligned */
                                padding-top: ${isStandalone ? '50px' : '10px'} !important;
                            }
                        }
                    `}</style>

                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(4px)',
                        }}
                    />

                    {/* Content */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 300,
                            mass: 0.8
                        }}
                        className="modal-content"
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '450px',
                            backgroundColor: 'var(--color-bg-surface-transparent)',
                            borderRadius: '24px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            maxHeight: '95vh',
                            backdropFilter: 'blur(12px)'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '12px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid var(--color-border)',
                            flexShrink: 0
                        }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: 'var(--color-text-main)' }}>
                                {title}
                            </h2>
                            <button
                                onClick={() => {
                                    triggerHaptic('hover');
                                    onClose();
                                }}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--color-text-muted)',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body - SCROLLABLE */}
                        <div className="no-scrollbar" style={{
                            padding: '10px 20px',
                            overflowY: 'auto',
                            overscrollBehavior: 'contain',
                            flex: 1
                        }}>
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default Modal;
