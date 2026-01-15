import React from 'react';
import { CheckCircle, Printer, Send } from 'lucide-react';
import Modal from '../../../components/Modal';
import { triggerHaptic } from '../../../utils/haptics';

const DeliveryModal = ({
    isOpen, onClose,
    deliveryModal, // object with { order, step }
    settleMethod, setSettleMethod,
    onConfirm,
    onPrint,
    onShare
}) => {
    const { order, step } = deliveryModal;

    // Helper for Glassy Modal Styles
    const glassyCardStyle = {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '16px',
        color: 'var(--color-text-main)',
        textAlign: 'center'
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={step === 'success' ? "Settled!" : "Delivery & Settlement"}>
            {order && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0px 0px 10px 0px' }}>

                    {step === 'confirm' ? (
                        <>
                            {/* Order Summary */}
                            <div style={{ ...glassyCardStyle, background: 'var(--color-bg-secondary)', color: 'var(--color-text-main)' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Order #{order.id.slice(-6).toUpperCase()}</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{order.customer?.name || 'Walk-in'}</div>
                            </div>

                            {/* Balance Logic */}
                            {(order.payment?.balance || 0) > 0 ? (
                                <div style={{ ...glassyCardStyle, background: 'rgba(255, 82, 82, 0.08)', borderColor: 'rgba(255, 82, 82, 0.2)' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#ff5252', fontWeight: 700, marginBottom: '4px', letterSpacing: '1px' }}>BALANCE DUE</div>
                                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#e53935', lineHeight: '1', marginBottom: '12px' }}>₹{order.payment.balance}</div>

                                    <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.5)', padding: '10px', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: '8px', fontWeight: 600 }}>Payment Method:</div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => {
                                                    triggerHaptic('light');
                                                    setSettleMethod('cash');
                                                }}
                                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: settleMethod === 'cash' ? '2px solid #4CAF50' : '1px solid #ddd', background: settleMethod === 'cash' ? '#4CAF50' : 'white', color: settleMethod === 'cash' ? 'white' : '#555', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                                            >
                                                💵 Cash
                                            </button>
                                            <button
                                                onClick={() => {
                                                    triggerHaptic('light');
                                                    setSettleMethod('upi');
                                                }}
                                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: settleMethod === 'upi' ? '2px solid #2196F3' : '1px solid #ddd', background: settleMethod === 'upi' ? '#2196F3' : 'white', color: settleMethod === 'upi' ? 'white' : '#555', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                                            >
                                                📱 UPI
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ ...glassyCardStyle, background: 'rgba(76, 175, 80, 0.08)', borderColor: 'rgba(76, 175, 80, 0.2)', padding: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#2e7d32', marginBottom: '8px' }}>
                                        <CheckCircle size={40} />
                                    </div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2e7d32' }}>Fully Paid</div>
                                    <div style={{ fontSize: '0.85rem', color: '#66bb6a', fontWeight: 500 }}>No pending balance.</div>
                                </div>
                            )}

                            {/* Actions */}
                            <button
                                onClick={() => {
                                    triggerHaptic('light');
                                    onConfirm();
                                }}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    borderRadius: '16px',
                                    background: 'var(--color-primary)',
                                    color: 'white',
                                    border: 'none',
                                    fontWeight: 800,
                                    fontSize: '1.1rem',
                                    cursor: 'pointer',
                                    marginTop: '16px',
                                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                                    transition: 'transform 0.1s ease'
                                }}
                                className="hover-scale"
                            >
                                Confirm Delivery
                            </button>
                        </>
                    ) : (
                        // SUCCESS STEP
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
                            <div style={{ width: '80px', height: '80px', background: '#e8f5e9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                <CheckCircle size={48} color="#2e7d32" />
                            </div>
                            <h2 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}>Success!</h2>
                            <p style={{ margin: '0 0 24px 0', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
                                Order marked as Delivered.<br />Payment settled successfully.
                            </p>

                            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                <button
                                    onClick={() => {
                                        triggerHaptic('light');
                                        onPrint(order);
                                    }}
                                    style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#333', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    <Printer size={16} /> Print
                                </button>
                                <button
                                    onClick={() => {
                                        triggerHaptic('light');
                                        onShare(order);
                                    }}
                                    style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#25D366', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    <Send size={16} /> Share
                                </button>
                            </div>

                            <button
                                onClick={() => {
                                    triggerHaptic('light');
                                    onClose();
                                }}
                                style={{ marginTop: '16px', color: '#999', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Close
                            </button>
                        </div>
                    )}

                </div>
            )}
        </Modal>
    );
};

export default DeliveryModal;
