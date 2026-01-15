import React from 'react';
import {
    Plus, Minus, ShoppingCart, User, Calendar, Clock, Phone, Trash2, Award,
    NotebookPen, Save, Printer
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';

// --- Extracted Cart Component to fix Focus Issues ---
const CartContent = ({
    isMobile = false,
    mode,
    cart,
    totalAmount,
    payment,
    setPayment,
    customerDetails,
    setCustomerDetails,
    handoverMode,
    setHandoverMode,
    deliveryDetails,
    setDeliveryDetails,
    updateQty,
    handleCheckout,
    balanceDue,
    isPrinting,
    clearCart,
    existingCustomer
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header Spacer for Mobile Modal */}
            {isMobile && <div style={{ height: '8px' }}></div>}

            {/* SCENARIO B: ORDER DETAILS (Only if Order Mode) */}
            {mode === 'order' && (
                <div style={{ padding: '16px', background: 'transparent', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Order Details</div>

                    {/* Handover Type Toggle */}
                    <div style={{ display: 'flex', background: 'var(--color-bg-glass-tab)', padding: '4px', borderRadius: '8px', marginBottom: '12px', border: '1px solid var(--color-border)' }}>
                        <button
                            onClick={() => {
                                triggerHaptic('light');
                                setHandoverMode('now');
                            }}
                            style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: '6px',
                                background: handoverMode === 'now' ? 'var(--color-bg-surface)' : 'transparent',
                                color: handoverMode === 'now' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                boxShadow: handoverMode === 'now' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: handoverMode === 'now' ? 700 : 500,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Take Now
                        </button>
                        <button
                            onClick={() => {
                                triggerHaptic('light');
                                setHandoverMode('later');
                            }}
                            style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: '6px',
                                background: handoverMode === 'later' ? 'var(--color-bg-surface)' : 'transparent',
                                color: handoverMode === 'later' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                boxShadow: handoverMode === 'later' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: handoverMode === 'later' ? 700 : 500,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Book Later
                        </button>
                    </div>

                    {/* Customer Input */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ flex: 1.5, position: 'relative' }}>
                            <User size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#666' }} />
                            <input
                                placeholder="Name"
                                value={customerDetails.name}
                                onChange={e => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                                style={{ width: '100%', padding: '10px 10px 10px 34px', background: 'var(--color-bg-glass-input)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)' }}
                            />
                        </div>

                        <div style={{ flex: 1, position: 'relative' }}>
                            <Phone size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#666' }} />
                            <input
                                type="tel"
                                placeholder="Phone"
                                value={customerDetails.phone}
                                onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setCustomerDetails(prev => ({ ...prev, phone: val }));
                                }}
                                style={{ width: '100%', padding: '10px 10px 10px 34px', background: 'var(--color-bg-glass-input)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)' }}
                            />
                        </div>
                    </div>

                    {/* Returning Customer Badge */}
                    {existingCustomer && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: 'rgba(255, 152, 0, 0.1)', color: 'var(--color-primary)',
                            padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem',
                            marginBottom: '10px', width: 'fit-content'
                        }}>
                            <Award size={14} />
                            <span style={{ fontWeight: 600 }}>Returning Customer</span>
                            <span style={{ opacity: 0.8 }}>• {existingCustomer.visitCount} Visits</span>
                        </div>
                    )}


                    {/* Date Picker (Only if Handover IS Later) */}
                    {handoverMode === 'later' && (
                        <div style={{ marginTop: '8px', padding: '8px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* Date Input */}
                            <div style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-bg-glass-input)', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                                <Calendar size={16} color="#FF9800" />
                                <input
                                    type="date"
                                    value={deliveryDetails.date}
                                    onChange={e => setDeliveryDetails(prev => ({ ...prev, date: e.target.value }))}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', colorScheme: 'var(--color-scheme)', width: '100%', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }}
                                />
                            </div>

                            {/* Time Input */}
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-bg-glass-input)', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                                <Clock size={16} color="#4CAF50" />
                                <input
                                    type="time"
                                    value={deliveryDetails.time}
                                    onChange={e => setDeliveryDetails(prev => ({ ...prev, time: e.target.value }))}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', colorScheme: 'var(--color-scheme)', width: '100%', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )
            }

            {/* CART ITEMS LIST */}
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
                {!isMobile && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ fontWeight: 600, color: '#aaa' }}>CURRENT CART</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>{cart.length} Items</span>
                            {cart.length > 0 && (
                                <button
                                    onClick={() => {
                                        triggerHaptic('medium');
                                        clearCart();
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        background: 'transparent', border: 'none',
                                        color: '#ef5350', fontSize: '0.8rem', fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={14} /> Clear
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {cart.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#444', marginTop: '40px' }}>
                        <ShoppingCart size={48} style={{ opacity: 0.2, marginBottom: '10px' }} />
                        <div>Cart is empty</div>
                    </div>
                ) : (
                    <AnimatePresence initial={false} mode="popLayout">
                        {cart.map(item => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                style={{ marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <div style={{ fontWeight: 500 }}>{item.name}</div>
                                    <div style={{ fontWeight: 700 }}>₹{item.price * item.qty}</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '0.85rem', color: '#aaa' }}>₹{item.price} each</div>
                                    {/* Qty Controls */}
                                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg-glass-input)', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                                        <button onClick={() => updateQty(item.id, -1)} style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--color-text-primary)', cursor: 'pointer' }}>-</button>
                                        <span style={{ padding: '0 8px', fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{item.qty}</span>
                                        <button onClick={() => updateQty(item.id, 1)} style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--color-text-primary)', cursor: 'pointer' }}>+</button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* FOOTER - COMPACT ON MOBILE */}
            <div style={{ padding: isMobile ? '12px' : '20px', background: 'var(--color-bg-surface)', borderTop: '1px solid var(--color-border)', marginTop: 'auto' }}>
                {mode === 'order' && (
                    <div style={{ marginBottom: isMobile ? '8px' : '16px' }}>
                        <div style={{ position: 'relative' }}>
                            <NotebookPen size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#666' }} />
                            <input
                                placeholder="Special Instructions..."
                                value={customerDetails.note || ''}
                                onChange={e => setCustomerDetails(prev => ({ ...prev, note: e.target.value }))}
                                style={{ width: '100%', padding: '8px 8px 8px 34px', background: 'var(--color-bg-glass-input)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}
                            />
                        </div>
                    </div>
                )}

                {/* Totals Section */}
                <div style={{ marginBottom: isMobile ? '8px' : '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? '1.1rem' : '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                        <span style={{ color: '#aaa' }}>Total</span>
                        <span style={{ color: 'var(--color-text-main)' }}>₹{totalAmount}</span>
                    </div>

                    {/* Order Mode Extras */}
                    {mode === 'order' && handoverMode === 'later' && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Advance</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--color-bg-glass-input)', borderRadius: '4px', padding: '0 8px', border: '1px solid var(--color-border)' }}>
                                    <span style={{ color: 'var(--color-text-main)', fontSize: '0.9rem', fontWeight: 600 }}>₹</span>
                                    <input
                                        type="number"
                                        className="no-spinner"
                                        value={payment.advance}
                                        onChange={e => setPayment(prev => ({ ...prev, advance: e.target.value }))}
                                        style={{ width: '60px', background: 'transparent', border: 'none', color: 'var(--color-text-primary)', fontWeight: 600, textAlign: 'right', padding: '6px' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 600, paddingTop: '8px', borderTop: '1px dashed var(--color-border)' }}>
                                <span style={{ color: '#FF5252' }}>BALANCE</span>
                                <span style={{ color: '#FF5252' }}>₹{balanceDue}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Payment Method Toggle */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: isMobile ? '10px' : '16px' }}>
                    <button onClick={() => { triggerHaptic('light'); setPayment(prev => ({ ...prev, type: 'cash' })); }} style={{ flex: 1, padding: isMobile ? '8px' : '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: payment.type === 'cash' ? 'var(--color-bg-tertiary)' : 'transparent', color: payment.type === 'cash' ? 'var(--color-text-primary)' : 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>💵 CASH</button>
                    <button onClick={() => { triggerHaptic('light'); setPayment(prev => ({ ...prev, type: 'upi' })); }} style={{ flex: 1, padding: isMobile ? '8px' : '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: payment.type === 'upi' ? 'var(--color-bg-tertiary)' : 'transparent', color: payment.type === 'upi' ? 'var(--color-text-primary)' : 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>📱 UPI</button>
                </div>

                {/* DUAL ACTION BUTTONS */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    {/* Hide standalone Save button on mobile to save space, or keep it small? User wanted PRINT button change primarily. keeping both but updating print text. */}
                    <button disabled={cart.length === 0} onClick={() => handleCheckout(false)} style={{ flex: 1, padding: isMobile ? '12px' : '14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', fontWeight: 700, fontSize: '0.9rem', cursor: cart.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: cart.length === 0 ? 0.5 : 1 }}>
                        <Save size={18} /> <span>SAVE</span>
                    </button>

                    <button disabled={cart.length === 0 || isPrinting} onClick={() => handleCheckout(true)} style={{ flex: 1.5, padding: isMobile ? '12px' : '14px', borderRadius: '8px', border: 'none', background: (cart.length === 0 || isPrinting) ? '#ccc' : (mode === 'quick' ? '#4CAF50' : '#FF9800'), color: (cart.length === 0 || isPrinting) ? '#666' : (mode === 'quick' ? 'white' : 'black'), fontWeight: 800, fontSize: '0.9rem', cursor: (cart.length === 0 || isPrinting) ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: (cart.length === 0 || isPrinting) ? 'none' : '0 4px 12px rgba(0,0,0,0.2)' }}>
                        <Printer size={18} /> <span>{isPrinting ? 'PROCESSING...' : 'PRINT & SAVE'}</span>
                    </button>
                </div>
            </div>
        </div >
    );
};

export default CartContent;
