import React, { useState, useEffect } from 'react';
import { useTransactions } from '../context/useTransactions';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { Plus, Minus, Search, ShoppingCart, User, Calendar, Clock, CreditCard, ChevronRight, Printer, Clipboard, NotebookPen, Save, CheckCircle, Phone } from 'lucide-react';
import { format } from 'date-fns';
import Modal from './Modal';

import ReceiptPrinter from './ReceiptPrinter';
import { toTitleCase, getSmartEmoji } from '../utils/smartHelpers';

const Billing = () => {
    const { addTransaction } = useTransactions();
    const { items: allItems, addItem: addInventoryItem } = useInventory();
    const { user } = useAuth();
    const { showToast } = useToast();

    // Mode State: 'quick' | 'order'
    const [mode, setMode] = useState('quick');
    const [handoverMode, setHandoverMode] = useState('later'); // 'now' | 'later' (Only relevant for Order Mode)

    // Items now come from Context!

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');

    // Cart State
    const [cart, setCart] = useState([]);

    // Order Mode Specific State
    const [customerDetails, setCustomerDetails] = useState({ name: '', phone: '', note: '' });
    // Default Delivery = Now + 2 Hours
    const [deliveryDetails, setDeliveryDetails] = useState(() => {
        const now = new Date();
        const future = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2 Hours
        return {
            date: format(future, 'yyyy-MM-dd'),
            time: format(future, 'HH:mm')
        };
    });
    const [payment, setPayment] = useState({ advance: '', type: 'cash' }); // cash, upi

    // Receipt Preview State
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState(null);

    // Smart Search State
    // Smart Search State
    const [newItemDetails, setNewItemDetails] = useState({ price: '', category: '', stock: '' });

    // --- Filter Logic ---
    const categories = ['All', ...new Set(allItems.map(i => i.category))];
    const filteredItems = allItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // --- Cart Actions ---
    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { ...item, qty: 1 }];
        });
    };

    const updateQty = (itemId, delta) => {
        setCart(prev => prev.map(i => {
            if (i.id === itemId) {
                const newQty = Math.max(0, i.qty + delta);
                return { ...i, qty: newQty };
            }
            return i;
        }).filter(i => i.qty > 0));
    };

    const updateItemNote = (itemId, note) => {
        setCart(prev => prev.map(i => i.id === itemId ? { ...i, note } : i));
    };

    // --- Calculations ---
    const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    // For 'Take Now', we consider the Advance as the Total Amount (Fully Paid)
    const advanceAmount = (mode === 'order' && handoverMode === 'now')
        ? totalAmount
        : (Number(payment.advance) || 0);
    const balanceDue = totalAmount - advanceAmount;

    // --- Helpers ---
    const createTransactionData = () => {
        if (cart.length === 0) {
            showToast("Cart is empty!", "error");
            return null;
        }

        const isOrder = mode === 'order';

        return {
            type: isOrder ? 'order' : 'sale',
            amount: isOrder ? advanceAmount : totalAmount,
            totalValue: totalAmount,
            items: cart,
            date: new Date().toISOString(),
            description: isOrder
                ? `Order for ${customerDetails.name || 'Customer'} (${handoverMode})`
                : `Quick Sale (${cart.length} items)`,
            customer: isOrder ? {
                name: customerDetails.name || 'Walk-in',
                phone: customerDetails.phone || '',
                note: customerDetails.note
            } : null,
            delivery: (isOrder && handoverMode === 'later') ? deliveryDetails : null,
            payment: {
                method: payment.type,
                advance: isOrder ? advanceAmount : 0,
                balance: isOrder ? balanceDue : 0,
                status: isOrder ? (balanceDue <= 0 ? 'paid' : 'partial') : 'paid'
            },
            status: (isOrder && handoverMode === 'later') ? 'pending' : 'completed'
        };
    };

    const resetUI = () => {
        setCart([]);
        setCustomerDetails({ name: '', phone: '', note: '' });
        setPayment({ advance: '', type: 'cash' });
        setMode('quick');
        setHandoverMode('later');
    };

    // --- Actions ---
    const handleCheckout = async (shouldPrint) => {
        const data = createTransactionData();
        if (!data) return;

        // Validation: Phone Number (If provided, must be 10 digits)
        if (mode === 'order' && customerDetails.phone && customerDetails.phone.length !== 10) {
            showToast("Please enter a valid 10-digit phone number", "error");
            return;
        }

        // 1. Save to DB
        await addTransaction(data);

        // 2. Handle Print or Simple Reset
        if (shouldPrint) {
            setPreviewData(data);
            setShowPreview(true);

            // Auto-trigger print after a short delay to allow modal render
            setTimeout(() => window.print(), 500);

            showToast(mode === 'order' ? "Order Saved & Printing..." : "Sale Saved & Printing...", "success");
        } else {
            showToast(mode === 'order' ? "Order Saved!" : "Sale Completed!", "success");
        }

        // 3. Reset
        resetUI();
    };

    // Helper Icons
    const ShoppingBagIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>;
    const ClipboardIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>;


    return (
        <div style={{ height: '100dvh', background: 'transparent', color: 'var(--color-text-primary)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* 1. THE HEADER */}
            <header style={{
                padding: '12px 20px',
                background: 'var(--color-bg-surface-transparent)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.5px' }}>⚡ BILLING</div>
                </div>
                {/* Mode Switcher (Centered in Header) */}
                <div style={{ display: 'flex', background: 'var(--color-bg-surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <button
                        onClick={() => setMode('quick')}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '6px',
                            background: mode === 'quick' ? '#4CAF50' : 'transparent',
                            color: mode === 'quick' ? 'white' : '#888',
                            fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: '6px',
                            transition: 'all 0.2s',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        <ShoppingBagIcon /> QUICK
                    </button>
                    <div style={{ width: '1px', background: 'var(--color-border)', margin: '4px 0' }}></div>
                    <button
                        onClick={() => setMode('order')}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '6px',
                            background: mode === 'order' ? '#FF9800' : 'transparent',
                            color: mode === 'order' ? 'black' : '#888',
                            fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: '6px',
                            transition: 'all 0.2s',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        <ClipboardIcon /> ORDER
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT SPLIT */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* 2. LEFT SIDE: PRODUCT GRID (65%) */}
                <div style={{ flex: '65%', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', background: 'transparent' }}>


                    {/* Search & Filter Bar */}
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                            <input
                                type="text"
                                placeholder="Search Item..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px 12px 12px 40px',
                                    background: 'var(--color-bg-secondary)', border: 'none', borderRadius: '8px',
                                    color: 'var(--color-text-primary)', fontSize: '1rem'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setFilterCategory(cat)}
                                    style={{
                                        padding: '0 16px',
                                        borderRadius: '8px',
                                        background: filterCategory === cat ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                                        color: filterCategory === cat ? 'white' : 'var(--color-text-muted)',
                                        border: '1px solid',
                                        borderColor: filterCategory === cat ? 'var(--color-primary)' : 'var(--color-border)',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
                            {filteredItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => addToCart(item)}
                                    style={{
                                        background: 'var(--color-bg-glass-input)',
                                        backdropFilter: 'blur(12px)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                                        cursor: 'pointer',
                                        height: '140px',
                                        position: 'relative',
                                        transition: 'transform 0.1s'
                                    }}
                                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    {/* Image */}
                                    <div style={{
                                        height: '100px', width: '100%',
                                        background: 'var(--color-bg-secondary)',
                                        borderRadius: '8px',
                                        marginBottom: '8px',
                                        overflow: 'hidden',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        padding: `${item.imagePadding || 0}px` // Dynamic Padding
                                    }}>
                                        {item.image && item.image.length > 5 ? (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                style={{
                                                    width: '100%', height: '100%',
                                                    objectFit: item.imageFit || 'cover', // Dynamic Fit
                                                    borderRadius: item.imagePadding ? '4px' : '0'
                                                }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: '2rem' }}>{item.image || '🍰'}</span>
                                        )}
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem', textAlign: 'left', lineHeight: '1.2', color: 'var(--color-text-primary)' }}>{item.name}</div>
                                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'end' }}>
                                        <div style={{ color: '#4CAF50', fontWeight: 700 }}>₹{item.price}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>Stock: {item.stock}</div>
                                    </div>
                                </button>
                            ))}

                            {/* SMART SEARCH - ADD ITEM CARD */}
                            {filteredItems.length === 0 && searchTerm && (
                                <div style={{
                                    background: '#2d2d2d',
                                    border: '1px dashed #666',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    display: 'flex', flexDirection: 'column',
                                    gridColumn: '1 / -1',
                                    maxWidth: '400px'
                                }}>
                                    <div style={{ color: '#FF9800', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Plus size={18} /> Add New Item?
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'white', marginBottom: '12px' }}>
                                        Name: <strong>{toTitleCase(searchTerm)}</strong>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                        <input
                                            placeholder="Price (₹)"
                                            type="number"
                                            value={newItemDetails.price}
                                            onChange={e => setNewItemDetails({ ...newItemDetails, price: e.target.value })}
                                            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #444', background: '#1a1a1a', color: 'white' }}
                                        />
                                        <select
                                            value={newItemDetails.category || (filterCategory !== 'All' ? filterCategory : '')}
                                            onChange={e => setNewItemDetails({ ...newItemDetails, category: e.target.value })}
                                            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #444', background: '#1a1a1a', color: 'white' }}
                                        >
                                            <option value="">Category?</option>
                                            {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                                            <option value="General">General</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            placeholder="Stock (Def: 99)"
                                            type="number"
                                            value={newItemDetails.stock}
                                            onChange={e => setNewItemDetails({ ...newItemDetails, stock: e.target.value })}
                                            style={{ width: '120px', padding: '8px', borderRadius: '6px', border: '1px solid #444', background: '#1a1a1a', color: 'white' }}
                                        />
                                        <button
                                            onClick={() => {
                                                if (!newItemDetails.price) {
                                                    showToast("Enter Price!", "error");
                                                    return;
                                                }
                                                const finalName = toTitleCase(searchTerm);
                                                const cat = newItemDetails.category || (filterCategory !== 'All' ? filterCategory : 'General');

                                                const newItem = {
                                                    id: Date.now().toString(),
                                                    name: finalName,
                                                    price: Number(newItemDetails.price),
                                                    category: cat,
                                                    stock: Number(newItemDetails.stock) || 99,
                                                    image: getSmartEmoji(finalName, cat) // Smart Emoji
                                                };
                                                addInventoryItem(newItem); // Add to Global Inventory
                                                addToCart(newItem); // Auto add to cart
                                                setSearchTerm(''); // Clear search
                                                setNewItemDetails({ price: '', category: '', stock: '' }); // Reset
                                                showToast(`Added '${newItem.name}' to Menu & Cart!`, "success");
                                            }}
                                            style={{ flex: 1, padding: '8px', borderRadius: '6px', background: '#4CAF50', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            Add & Bill
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. RIGHT SIDE: SMART CART (35%) */}
                <div style={{ flex: '35%', background: 'var(--color-bg-surface-transparent)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--color-border)' }}>



                    {/* SCENARIO B: ORDER DETAILS (Only if Order Mode) */}
                    {mode === 'order' && (
                        <div style={{ padding: '16px', background: 'transparent', borderBottom: '1px solid var(--color-border)' }}>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Order Details</div>

                            {/* Handover Type Toggle */}
                            <div style={{ display: 'flex', background: 'var(--color-bg-glass-tab)', padding: '4px', borderRadius: '8px', marginBottom: '12px', border: '1px solid var(--color-border)' }}>
                                <button
                                    onClick={() => setHandoverMode('now')}
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
                                    onClick={() => setHandoverMode('later')}
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
                                    Book for Later
                                </button>
                            </div>

                            {/* Customer Input */}
                            {/* Customer Input */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                <div style={{ flex: 1.5, position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#666' }} />
                                    <input
                                        placeholder="Customer Name (Opt)"
                                        value={customerDetails.name}
                                        onChange={e => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                                        style={{ width: '100%', padding: '10px 10px 10px 34px', background: 'var(--color-bg-glass-input)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)' }}
                                    />
                                </div>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <Phone size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#666' }} />
                                    <input
                                        type="tel"
                                        placeholder="Phone (10-digit)"
                                        value={customerDetails.phone}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            setCustomerDetails({ ...customerDetails, phone: val });
                                        }}
                                        style={{ width: '100%', padding: '10px 10px 10px 34px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)' }}
                                    />
                                </div>
                            </div>


                            {/* Date Picker (Only if Handover IS Later) */}
                            {handoverMode === 'later' && (
                                <div style={{ marginTop: '8px', padding: '8px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Delivery:</div>

                                    {/* Date Input */}
                                    <div style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-bg-glass-input)', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                                        <Calendar size={16} color="#FF9800" />
                                        <input
                                            type="date"
                                            value={deliveryDetails.date}
                                            onChange={e => setDeliveryDetails({ ...deliveryDetails, date: e.target.value })}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                // Explicitly set text color and ensure browser picker matches theme
                                                color: 'var(--color-text-primary)',
                                                colorScheme: 'var(--color-scheme)',
                                                width: '100%',
                                                fontFamily: 'inherit',
                                                fontSize: '0.9rem',
                                                fontWeight: 500,
                                                outline: 'none',
                                                cursor: 'pointer'
                                            }}
                                        />
                                    </div>

                                    {/* Time Input */}
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-bg-glass-input)', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                                        <Clock size={16} color="#4CAF50" />
                                        <input
                                            type="time"
                                            value={deliveryDetails.time}
                                            onChange={e => setDeliveryDetails({ ...deliveryDetails, time: e.target.value })}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--color-text-primary)',
                                                colorScheme: 'var(--color-scheme)',
                                                width: '100%',
                                                fontFamily: 'inherit',
                                                fontSize: '0.9rem',
                                                fontWeight: 500,
                                                outline: 'none',
                                                cursor: 'pointer'
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CART ITEMS LIST (Common) */}
                    <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <span style={{ fontWeight: 600, color: '#aaa' }}>CURRENT CART</span>
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>{cart.length} Items</span>
                        </div>

                        {cart.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#444', marginTop: '40px' }}>
                                <ShoppingCart size={48} style={{ opacity: 0.2, marginBottom: '10px' }} />
                                <div>Cart is empty</div>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} style={{ marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
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

                                    {/* Item Note (Only in Order Mode AND Book for Later) */}

                                </div>
                            ))
                        )}
                    </div>

                    {/* FOOTER (Morphs based on Mode) */}
                    <div style={{ padding: '20px', background: 'transparent', borderTop: '1px solid var(--color-border)' }}>

                        {/* Special Instructions (moved to footer) */}
                        {mode === 'order' && (
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ position: 'relative' }}>
                                    <NotebookPen size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#666' }} />
                                    <input
                                        placeholder="Special Instructions? (e.g. Birthday Message...)"
                                        value={customerDetails.note || ''}
                                        onChange={e => setCustomerDetails({ ...customerDetails, note: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '8px 8px 8px 34px',
                                            background: 'var(--color-bg-glass-input)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '6px',
                                            color: 'var(--color-text-primary)',
                                            fontSize: '0.85rem'
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Totals Section */}
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                                <span style={{ color: '#aaa' }}>Total</span>
                                <span style={{ color: 'white' }}>₹{totalAmount}</span>
                            </div>

                            {/* Order Mode Extras (Only if Book for Later) */}
                            {mode === 'order' && handoverMode === 'later' && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Advance Paid</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--color-bg-glass-input)', borderRadius: '4px', padding: '0 8px', border: '1px solid var(--color-border)' }}>
                                            <span style={{ color: 'var(--color-text-main)', fontSize: '0.9rem', fontWeight: 600 }}>₹</span>
                                            <input
                                                type="number"
                                                value={payment.advance}
                                                onChange={e => setPayment({ ...payment, advance: e.target.value })}
                                                style={{ width: '60px', background: 'transparent', border: 'none', color: 'var(--color-text-primary)', fontWeight: 600, textAlign: 'right', padding: '6px' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 600, paddingTop: '8px', borderTop: '1px dashed var(--color-border)' }}>
                                        <span style={{ color: '#FF5252' }}>BALANCE DUE</span>
                                        <span style={{ color: '#FF5252' }}>₹{balanceDue}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Payment Method Toggle (Common) */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            <button
                                onClick={() => setPayment({ ...payment, type: 'cash' })}
                                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: payment.type === 'cash' ? 'var(--color-bg-tertiary)' : 'transparent', color: payment.type === 'cash' ? 'var(--color-text-primary)' : 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                                💵 CASH
                            </button>
                            <button
                                onClick={() => setPayment({ ...payment, type: 'upi' })}
                                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: payment.type === 'upi' ? 'var(--color-bg-tertiary)' : 'transparent', color: payment.type === 'upi' ? 'var(--color-text-primary)' : 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                                📱 UPI
                            </button>
                        </div>

                        {/* DUAL ACTION BUTTONS (Replaces Single Button) */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {/* 1. CHECKOUT ONLY */}
                            <button
                                onClick={() => handleCheckout(false)}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-surface)',
                                    color: 'var(--color-text-primary)',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                                    transition: 'all 0.1s',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                }}
                            >
                                <Save size={18} />
                                <span>CHECKOUT</span>
                            </button>

                            {/* 2. CHECKOUT & PRINT */}
                            <button
                                onClick={() => handleCheckout(true)}
                                style={{
                                    flex: 1.2,
                                    padding: '14px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: mode === 'quick' ? '#4CAF50' : '#FF9800',
                                    color: mode === 'quick' ? 'white' : 'black',
                                    fontWeight: 800,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                    transition: 'all 0.1s'
                                }}
                            >
                                <Printer size={18} />
                                <span>PRINT & SAVE</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Receipt Preview Modal */}
            <Modal isOpen={showPreview && previewData} onClose={() => setShowPreview(false)} title="Invoice Placed">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <div style={{ color: '#4CAF50', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={24} />
                        <span>Transaction Saved Successfully!</span>
                    </div>

                    <div style={{ border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <ReceiptPrinter
                            transaction={previewData || {}}
                            type={mode === 'order' && handoverMode === 'later' ? 'ORDER_BOOKING' : 'TAX_INVOICE'}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                        <button
                            onClick={() => setShowPreview(false)}
                            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', color: '#333', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Close
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="btn-print-now"
                            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#4CAF50', color: 'white', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <Printer size={18} /> Print Again
                        </button>
                    </div>
                </div>
            </Modal>



            <style>{`
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #1a1a1a; }
                ::-webkit-scrollbar-thumb { background: #333; borderRadius: 3px; }
                
                input[type="date"], input[type="time"] {
                    color-scheme: light dark;
                }
                input[type="date"]::-webkit-calendar-picker-indicator,
                input[type="time"]::-webkit-calendar-picker-indicator {
                    opacity: 1;
                    cursor: pointer;
                }
                input[type="date"]::-webkit-calendar-picker-indicator:hover,
                input[type="time"]::-webkit-calendar-picker-indicator:hover {
                    opacity: 1;
                }
            `}</style>
        </div>
    );
};

export default Billing;
