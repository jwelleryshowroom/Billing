import React, { useState, useMemo } from 'react';
import { useTransactions } from '../context/useTransactions';
import { Clock, CheckCircle, Car, Phone, Printer, Search, Send, Package } from 'lucide-react';
import { format } from 'date-fns';
import ReceiptPrinter from './ReceiptPrinter';
import Modal from './Modal';

// ... (imports remain)
import { generateInvoicePDF } from '../utils/invoiceGenerator';

const Orders = () => {
    // Orders Component - Updated Invoice Sharing
    const { transactions, updateTransaction, addTransaction } = useTransactions();
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'card' - could be responsive
    const [statusFilter, setStatusFilter] = useState('pending'); // 'pending', 'completed'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);

    // Filter Logic
    const filteredOrders = useMemo(() => {
        return transactions
            .filter(t => t.type === 'order' || t.type === 'sale')
            .filter(t => statusFilter === 'all' || t.status === statusFilter)
            .filter(t => {
                if (!searchTerm) return true;
                const rawTerm = searchTerm.toLowerCase();
                const term = rawTerm.replace(/^#/, ''); // Strip leading hash for ID search

                // 1. Date Matching (Flexible Formats)
                const orderDate = new Date(t.date);
                const dateFormats = [
                    format(orderDate, 'dd MMM yyyy').toLowerCase(),  // "11 jan 2026"
                    format(orderDate, 'dd/MM/yyyy'),                 // "11/01/2026"
                    format(orderDate, 'dd-MM-yyyy'),                 // "11-01-2026"
                    format(orderDate, 'yyyy-MM-dd'),                 // "2026-01-11"
                    format(orderDate, 'do MMM'),                     // "11th jan"
                    t.date.toLowerCase()                             // ISO string
                ];
                const dateMatches = dateFormats.some(fmt => fmt.includes(rawTerm)); // Use rawTerm for dates (keep slashes)

                // 2. Item Matching
                const itemMatches = t.items.some(i => i.name.toLowerCase().includes(rawTerm));

                // 3. Status & Type Matching
                const statusMatches = t.status.toLowerCase().includes(rawTerm);

                let modeString = 'delivery'; // Default
                if (t.type === 'sale') modeString = 'instant delivery';
                else if (!t.delivery?.date) modeString = 'take away mode';

                const typeMatches = modeString.includes(rawTerm);

                // 4. ID & Customer Matching
                const idMatches = t.id?.toLowerCase().includes(term); // Use cleaned term
                const customerMatches = t.customer?.name?.toLowerCase().includes(rawTerm) ||
                    t.customer?.phone?.includes(rawTerm);

                return (
                    idMatches ||
                    customerMatches ||
                    dateMatches ||
                    itemMatches ||
                    statusMatches ||
                    typeMatches
                );
            })
            .sort((a, b) => {
                // Use delivery date if available, otherwise creation date
                const dateA = a.delivery?.date ? new Date(a.delivery.date) : new Date(a.date);
                const dateB = b.delivery?.date ? new Date(b.delivery.date) : new Date(b.date);

                // If viewing Pending, we want Urgent (earliest date) first -> Ascending
                if (statusFilter === 'pending') {
                    return dateA - dateB;
                }
                // If viewing Completed/All, we want Recent (latest date) first -> Descending
                return dateB - dateA;
            });
    }, [transactions, statusFilter, searchTerm]);

    const handlePrint = (order) => {
        setSelectedOrder(order);
        setShowReceipt(true);
    };

    const handleSmartShare = (order) => {
        const link = `${window.location.origin}/view/${order.id}`;
        const phone = order.customer?.phone || '';
        const message = `*THE CLASSIC CONFECTION* 🧁\n` +
            `Hello *${order.customer?.name || 'Customer'}*,\n` +
            `Here is your receipt link for Order *#${order.id.slice(-6).toUpperCase()}*:\n` +
            `${link}\n\n` +
            `Please visit us again! 🙏`;

        const encodedMessage = encodeURIComponent(message);
        const url = phone
            ? `https://wa.me/91${phone}?text=${encodedMessage}`
            : `https://wa.me/?text=${encodedMessage}`;
        window.open(url, '_blank');
    };

    // --- Smart Delivery Logic ---
    const [deliveryModal, setDeliveryModal] = useState({ open: false, order: null, step: 'confirm' });
    const [settleMethod, setSettleMethod] = useState('cash');

    const openDeliveryModal = (order) => {
        setDeliveryModal({ open: true, order, step: 'confirm' });
        setSettleMethod('cash'); // Default
    };

    const confirmDelivery = async () => {
        const order = deliveryModal.order;
        if (!order) return;

        try {
            // Determine updates based on balance
            const balance = order.payment?.balance || 0;
            const updates = {
                status: 'completed',
                deliveryStatus: 'delivered',
            };

            // If balance exists, we settle it
            if (balance > 0) {
                updates.payment = {
                    ...order.payment,
                    status: 'paid',
                    balance: 0,
                    balanceMethod: settleMethod, // Record explicitly how the balance was paid (Split Payment)
                    balancePaidDate: new Date().toISOString() // Track when it was settled
                    // We DO NOT overwrite 'method' here, preserving the Advance Payment method
                };
            } else {
                // Already paid, just ensure status is consistent
                updates.payment = { ...order.payment, status: 'paid' };
            }

            await updateTransaction(order.id, updates);

            // Update local state immediately so Print/Share uses the new data
            const updatedOrder = { ...order, ...updates };

            setDeliveryModal(prev => ({
                ...prev,
                step: 'success',
                order: updatedOrder
            }));

        } catch (error) {
            console.error("Delivery Update Failed:", error);
            alert("Failed to update order. See console.");
        }
    };

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


    const StatusBadge = ({ status }) => {
        const styles = {
            pending: { color: 'var(--color-warning)', bg: 'rgba(255, 193, 7, 0.1)' },
            completed: { color: 'var(--color-success)', bg: 'rgba(46, 204, 113, 0.1)' },
        };
        const s = styles[status] || styles.pending;
        return (
            <span style={{
                padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600,
                color: s.color, backgroundColor: s.bg
            }}>
                {status.toUpperCase()}
            </span>
        );
    };

    return (
        <div className="container" style={{ paddingTop: '20px', paddingBottom: '100px', maxWidth: '1200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Orders Management</h1>

                <div style={{ display: 'flex', gap: '10px', background: 'var(--color-surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    {['pending', 'completed'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: statusFilter === status ? 'var(--color-primary)' : 'transparent',
                                color: statusFilter === status ? 'white' : 'var(--color-text-muted)',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search Bar */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
                <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                    type="text"
                    placeholder="Search by Name, Order ID, or Phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px 12px 12px 40px',
                        borderRadius: '12px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-text-primary)'
                    }}
                />
            </div>

            {/* Content Area */}
            {filteredOrders.length === 0 ? (
                <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <Package size={64} style={{ opacity: 0.3, marginBottom: '20px' }} />
                    <h3>No {statusFilter} orders found</h3>
                    <p>Try changing filters or search terms.</p>
                </div>
            ) : (
                <div className="table-responsive" style={{
                    background: 'var(--color-bg-glass-input)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'calc(100vh - 220px)', /* Fixed height to enable internal scrolling */
                }}>
                    <div style={{ overflowY: 'auto', flex: 1 }}> {/* Scrollable Container */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{
                                background: 'var(--color-bg-surface-transparent)', /* Ensure readability over scrolled content */
                                backdropFilter: 'blur(12px)', /* Extra blur for header */
                                borderBottom: '1px solid var(--color-border)',
                                position: 'sticky',
                                top: 0,
                                zIndex: 10
                            }}>
                                <tr>
                                    <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>ORDER ID</th>
                                    <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>CUSTOMER</th>
                                    <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>DELIVERY</th>
                                    <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>ITEMS</th>
                                    <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>STATUS</th>
                                    <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'center' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map(order => (
                                    <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '16px', fontWeight: 600 }}>#{order.id.slice(-6).toUpperCase()}</td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontWeight: 600 }}>{order.customer?.name || "Walk-in"}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{order.customer?.phone}</div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {/* State 1: Quick Sale -> "Instant Delivery" */}
                                            {order.type === 'sale' ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-success)', fontWeight: 600 }}>
                                                        <CheckCircle size={14} />
                                                        <span>Instant Delivery</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '20px' }}>
                                                        {format(new Date(order.date), 'dd MMM yyyy, hh:mm a')}
                                                    </div>
                                                </div>
                                            ) : !order.delivery?.date ? (
                                                /* State 2: Order (Take Now) -> "Take Away Mode" */
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontWeight: 600 }}>
                                                        <Package size={14} />
                                                        <span>Take Away Mode</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '20px' }}>
                                                        {format(new Date(order.date), 'dd MMM yyyy, hh:mm a')}
                                                    </div>
                                                </div>
                                            ) : (
                                                /* State 3: Order (Book Later) -> Delivery Date */
                                                <>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Clock size={14} color="var(--color-text-muted)" />
                                                        {(order.delivery?.date) ? format(new Date(order.delivery.date), 'dd MMM yyyy') : 'N/A'}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '20px' }}>
                                                        {(order.delivery?.time) ? format(new Date(`2000-01-01T${order.delivery?.time}`), 'hh:mm a') : ''}
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {(() => {
                                                // Smart check for any note (Global or First Item Legacy)
                                                const note = order.note || order.customer?.note || order.items.find(i => i.note)?.note;
                                                const hasNote = note && note !== '-' && note.trim() !== '';

                                                return (
                                                    <>
                                                        <div style={{
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: hasNote ? 1 : 2, /* Show more lines if no note takes space */
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                            fontSize: '0.9rem',
                                                            lineHeight: '1.4',
                                                            color: 'var(--color-text-primary)'
                                                        }}>
                                                            {order.items.map(i => `${i.qty} x ${i.name}`).join(', ')}
                                                        </div>
                                                        {hasNote && (
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                Note: {note}
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <StatusBadge status={order.status} />
                                            {order.status === 'pending' && (
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: '4px', fontWeight: 600 }}>
                                                    Due: ₹{order.payment?.balance}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                <button
                                                    onClick={() => handlePrint(order)}
                                                    title="Print Bill"
                                                    className="icon-btn"
                                                    style={{ padding: '8px', borderRadius: '8px', background: '#333', border: '1px solid #444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyItems: 'center' }}
                                                >
                                                    <Printer size={18} color="white" />
                                                </button>

                                                {/* Smart Share Button */}
                                                <button
                                                    onClick={() => handleSmartShare(order)}
                                                    title="Share Invoice via WhatsApp"
                                                    className="icon-btn"
                                                    style={{ padding: '8px', borderRadius: '8px', background: '#DCF8C6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    {/* WhatsApp Logo SVG */}
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                    </svg>
                                                </button>

                                                {order.status === 'pending' && (
                                                    <button
                                                        onClick={() => openDeliveryModal(order)}
                                                        title="Mark Delivered"
                                                        className="icon-btn"
                                                        style={{ padding: '8px', borderRadius: '8px', background: '#4CAF50', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <CheckCircle size={18} color="white" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Print Modal */}
            <Modal isOpen={showReceipt} onClose={() => setShowReceipt(false)} title="Print Document" zIndex={2000}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {selectedOrder && (
                        <ReceiptPrinter
                            transaction={selectedOrder}
                            type={selectedOrder.status === 'completed' ? 'TAX_INVOICE' : 'ORDER_BOOKING'}
                        />
                    )}

                    <button
                        onClick={() => window.print()}
                        className="btn btn-primary"
                        style={{ marginTop: '20px', width: '100%' }}
                    >
                        Print Now
                    </button>
                </div>
            </Modal>

            {/* SMART DELIVERY MODAL */}
            <Modal isOpen={deliveryModal.open} onClose={() => setDeliveryModal({ ...deliveryModal, open: false })} title={deliveryModal.step === 'success' ? "Settled!" : "Delivery & Settlement"}>
                {deliveryModal.order && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0px 0px 10px 0px' }}>

                        {deliveryModal.step === 'confirm' ? (
                            <>
                                {/* Order Summary */}
                                <div style={{ ...glassyCardStyle, background: 'var(--color-bg-secondary)', color: 'var(--color-text-main)' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Order #{deliveryModal.order.id.slice(-6).toUpperCase()}</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{deliveryModal.order.customer?.name || 'Walk-in'}</div>
                                </div>

                                {/* Balance Logic */}
                                {(deliveryModal.order.payment?.balance || 0) > 0 ? (
                                    <div style={{ ...glassyCardStyle, background: 'rgba(255, 82, 82, 0.08)', borderColor: 'rgba(255, 82, 82, 0.2)' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#ff5252', fontWeight: 700, marginBottom: '4px', letterSpacing: '1px' }}>BALANCE DUE</div>
                                        <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#e53935', lineHeight: '1', marginBottom: '12px' }}>₹{deliveryModal.order.payment.balance}</div>

                                        <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.5)', padding: '10px', borderRadius: '12px' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: '8px', fontWeight: 600 }}>Payment Method:</div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => setSettleMethod('cash')}
                                                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: settleMethod === 'cash' ? '2px solid #4CAF50' : '1px solid #ddd', background: settleMethod === 'cash' ? '#4CAF50' : 'white', color: settleMethod === 'cash' ? 'white' : '#555', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                                                >
                                                    💵 Cash
                                                </button>
                                                <button
                                                    onClick={() => setSettleMethod('upi')}
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
                                    onClick={confirmDelivery}
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: 'black',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        marginTop: '4px',
                                        letterSpacing: '0.5px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                    }}
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
                                        onClick={() => handlePrint(deliveryModal.order)}
                                        style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#333', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        <Printer size={16} /> Print
                                    </button>
                                    <button
                                        onClick={() => handleSmartShare(deliveryModal.order)}
                                        style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#25D366', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        <Send size={16} /> Share
                                    </button>
                                </div>

                                <button
                                    onClick={() => setDeliveryModal({ ...deliveryModal, open: false })}
                                    style={{ marginTop: '16px', color: '#999', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    Close
                                </button>
                            </div>
                        )}

                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Orders;
