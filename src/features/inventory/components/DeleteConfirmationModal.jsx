import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const DeleteConfirmationModal = ({ isOpen, itemName, onCancel, onConfirm }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 10000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <motion.div
                        className="glass"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        style={{
                            width: '85%', maxWidth: '320px', padding: '24px',
                            borderRadius: '24px',
                            border: '1px solid var(--color-border)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                            textAlign: 'center',
                            background: 'var(--color-bg-surface)'
                        }}
                    >
                        <div style={{ color: 'var(--color-danger)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                            <AlertTriangle size={48} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Delete Item?</h3>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: 1.5, fontSize: '0.95rem' }}>
                            Are you sure you want to delete <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>"{itemName}"</span>? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={onCancel}
                                className="btn"
                                style={{
                                    flex: 1,
                                    backgroundColor: 'rgba(0,0,0,0.05)',
                                    color: 'var(--color-text-main)',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                className="btn"
                                style={{
                                    flex: 1,
                                    backgroundColor: 'var(--color-danger)',
                                    color: 'white',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default DeleteConfirmationModal;
