import React from 'react';
import { User, Shield, Lock } from 'lucide-react';
import Modal from './Modal';
import { triggerHaptic } from '../utils/haptics';

const RoleInfoModal = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Role Hierarchy (Circuit Style) 🕶️">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>

                {/* Munna Bhai */}
                <div style={{
                    padding: '16px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.05))',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    display: 'flex', gap: '12px', alignItems: 'flex-start'
                }}>
                    <div style={{ padding: '10px', background: 'rgba(255, 215, 0, 0.2)', borderRadius: '12px', color: '#F59E0B' }}>
                        <Shield size={24} />
                    </div>
                    <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>Munna Bhai 🕶️</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.4, fontStyle: 'italic' }}>
                            "Asli Boss. Hisab-kitab, tod-phod (delete), sab yahi karega."
                        </p>
                    </div>
                </div>

                {/* Circuit */}
                <div style={{
                    padding: '16px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.05))',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    display: 'flex', gap: '12px', alignItems: 'flex-start'
                }}>
                    <div style={{ padding: '10px', background: 'rgba(34, 197, 94, 0.2)', borderRadius: '12px', color: '#10B981' }}>
                        <User size={24} />
                    </div>
                    <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>Circuit 🔌</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.4, fontStyle: 'italic' }}>
                            "Bhai ka right hand. Entry karega, par mitane (delete) ka haq nahi."
                        </p>
                    </div>
                </div>

                {/* Mamu */}
                <div style={{
                    padding: '16px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(248, 113, 113, 0.05))',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    display: 'flex', gap: '12px', alignItems: 'flex-start'
                }}>
                    <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '12px', color: '#EF4444' }}>
                        <Lock size={24} />
                    </div>
                    <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>Mamu 🤕</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.4, fontStyle: 'italic' }}>
                            "Sirf dekhne ka. Haath nahi lagane ka."
                        </p>
                    </div>
                </div>

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
                        color: 'var(--color-text-primary)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginTop: '8px'
                    }}
                >
                    Samajh Gaya (Got it)
                </button>
            </div>
        </Modal>
    );
};

export default RoleInfoModal;
