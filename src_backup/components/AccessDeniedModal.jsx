import React from 'react';
import { AlertTriangle, Lock } from 'lucide-react';
import Modal from './Modal';
import { triggerHaptic } from '../utils/haptics';

const AccessDeniedModal = ({ isOpen, onClose, title = "Access Restricted", message, role }) => {
    // Default messages if not provided
    const defaultMessage = (
        <span>
            Oye Mamu! You can only look. <br />
            Only <b>Circuit</b> or <b>Munna Bhai</b> can handle the rokda (cash). 💸
        </span>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '16px',
                padding: '20px 0'
            }}>
                <div style={{
                    padding: '24px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--color-danger)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Lock size={48} />
                </div>

                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-main)' }}>
                        {title === "Access Restricted" ? "Circuit & Munna Bhai Only! 🛑" : title}
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.5, fontSize: '0.95rem' }}>
                        {message || defaultMessage}
                    </p>
                </div>

                {role && (
                    <div style={{
                        background: 'var(--color-bg-secondary)',
                        padding: '12px',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        color: 'var(--color-text-main)',
                        marginTop: '8px',
                        width: '100%'
                    }}>
                        Your Role: <b>{role === 'staff' ? 'Circuit 🔌' : role === 'admin' ? 'Munna Bhai 🕶️' : 'Mamu 🤕'}</b>
                    </div>
                )}

                <button
                    onClick={() => {
                        triggerHaptic('light');
                        onClose();
                    }}
                    style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '14px',
                        background: 'var(--color-bg-surface)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-main)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginTop: '8px'
                    }}
                >
                    Sahi Hai Bhai (Understood)
                </button>
            </div>
        </Modal>
    );
};

export default AccessDeniedModal;
