import React, { useMemo, useState, useEffect } from 'react';
import { useTransactions } from '../context/useTransactions';
import { useInventory } from '../context/InventoryContext';
import { useTheme } from '../context/useTheme';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, isSameDay, subDays } from 'date-fns';
import { TrendingUp, TrendingDown, ShoppingBag, Wallet, ArrowRight, Plus, FileBarChart, PieChart, Utensils, IndianRupee, Clock, AlertTriangle, Trash2, CheckCircle, Smartphone, Banknote } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import TransactionForm from './TransactionForm';
import Modal from './Modal';
import Reports from './Reports';
import { triggerHaptic } from '../utils/haptics';
import { useOrderFilters } from '../features/orders/hooks/useOrderFilters';

const DesktopHome = ({ setCurrentView }) => {
    const transactionsContext = useTransactions();
    const transactions = transactionsContext?.transactions || [];
    const deleteTransaction = transactionsContext?.deleteTransaction || (() => { });

    const inventoryContext = useInventory();
    const inventoryItems = inventoryContext?.items || [];
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const navigate = useNavigate();

    // Helper for Glass Styles
    const glassCardStyle = isDark ? {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
        color: 'white'
    } : {
        backgroundColor: 'white',
        border: '1px solid #f4f4f5',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        color: '#27272a'
    };

    const glassTextStyle = isDark ? 'white' : '#27272a';
    const glassSubTextStyle = isDark ? '#a1a1aa' : '#71717a';

    // --- Window Size Tracking for Responsiveness ---
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isLargeDesktop = windowWidth >= 1400;
    const isSmallDesktop = windowWidth < 1200 && windowWidth > 768;

    // Helper for Transaction Display (COMPACT for Dashboard)
    const getTransactionTitle = (t) => {
        if (t.type === 'order') {
            const name = t.customer?.name || 'Customer';
            const isBooking = t.status === 'pending' || (t.payment && t.payment.balance > 0);
            return isBooking ? `Booking: ${name}` : `Order: ${name}`;
        }
        if (t.type === 'sale') return 'Quick Sale';
        // Fallback: Use truncated description or Type
        return t.description ? (t.description.length > 25 ? t.description.slice(0, 25) + '...' : t.description) : t.type.toUpperCase();
    };

    // Helper for FULL Description (For Popup)
    const getFullDescription = (t) => {
        if (t.description) return t.description;
        return getTransactionTitle(t);
    };

    // --- Live Orders Logic ---
    const {
        filteredOrders,
        statusFilter,
        setStatusFilter,
        setSortBy
    } = useOrderFilters(transactions);

    useEffect(() => {
        setSortBy('amount-desc');
        setStatusFilter('pending');
    }, [setSortBy, setStatusFilter]);

    // Modals State
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [transactionType, setTransactionType] = useState('sale');
    const [showReportsModal, setShowReportsModal] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);

    // --- AGGREGATE STATS & Recent Activity ---
    const {
        totalSales, todaySales,
        totalExpenses, todayExpenses,
        totalOrders, todayOrders,
        totalProfit, todayProfit,
        totalCash, todayCash,
        totalUPI, todayUPI,
        pendingOrders,
        recentActivity
    } = useMemo(() => {
        const now = new Date();

        let tSales = 0, tExpenses = 0, tOrders = 0, tPending = 0;
        let dSales = 0, dExpenses = 0, dOrders = 0;
        let tCash = 0, dCash = 0;
        let tUPI = 0, dUPI = 0;

        const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
        const recent = sorted.slice(0, 50);

        transactions.forEach(t => {
            const amount = Number(t.amount);
            const isToday = isSameDay(new Date(t.date), now);

            if (t.type === 'sale' || t.type === 'order' || t.type === 'settlement') {
                // TOTAL
                tSales += amount;
                if (t.type === 'order') {
                    tOrders++;
                    if (t.status === 'pending') tPending++;
                }

                // Payment Method Stats
                const payMethod = t.payment?.type || 'cash';
                if (payMethod === 'cash') tCash += amount;
                if (payMethod === 'upi') tUPI += amount;

                // TODAY
                if (isToday) {
                    dSales += amount;
                    if (t.type === 'order') dOrders++;
                    if (payMethod === 'cash') dCash += amount;
                    if (payMethod === 'upi') dUPI += amount;
                }
            } else if (t.type === 'expense') {
                // TOTAL
                tExpenses += amount;

                // TODAY
                if (isToday) {
                    dExpenses += amount;
                }
            }
        });

        const tProfit = tSales - tExpenses;
        const dProfit = dSales - dExpenses;

        return {
            totalSales: tSales, todaySales: dSales,
            totalExpenses: tExpenses, todayExpenses: dExpenses,
            totalOrders: tOrders, todayOrders: dOrders,
            totalProfit: tProfit, todayProfit: dProfit,
            totalCash: tCash, todayCash: dCash,
            totalUPI: tUPI, todayUPI: dUPI,
            pendingOrders: tPending,
            recentActivity: recent
        };
    }, [transactions]);

    // --- LOW STOCK ALERT LOGIC (High Sales + Low Stock) ---
    const lowStockAlerts = useMemo(() => {
        // 1. Calculate sales frequency per item from last 200 transactions (for performance)
        const itemSales = {};
        transactions.slice(0, 200).forEach(t => {
            if ((t.type === 'order' || t.type === 'sale') && t.status !== 'cancelled' && t.items) {
                t.items.forEach(i => {
                    const name = i.name;
                    itemSales[name] = (itemSales[name] || 0) + (Number(i.qty) || 1);
                });
            }
        });

        // 2. Filter Inventory: Stock < 15 AND Has Sales
        // Only show items that are actually being sold to avoid irrelevant alerts
        const alerts = inventoryItems.filter(i => {
            const isLow = (Number(i.stock) || 0) < 15; // Set threshold to 15
            const hasSales = (itemSales[i.name] || 0) > 0;
            return isLow && hasSales;
        });

        // 3. Sort by Sales Frequency DESC
        alerts.sort((a, b) => (itemSales[b.name] || 0) - (itemSales[a.name] || 0));

        // 4. Return Top 4 (or 2 if small)
        return alerts.slice(0, 4);
    }, [transactions, inventoryItems]);



    const handleOpenTransactionModal = (type) => {
        setTransactionType(type);
        setShowTransactionModal(true);
    };

    const handleOrderClick = (orderId) => {
        navigate('/orders', { state: { highlightOrderId: orderId } });
    };

    const handleDeleteTransaction = (e, id) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this transaction?")) {
            deleteTransaction(id);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', padding: '24px', overflowY: 'auto', paddingBottom: '40px' }}>

            {/* 1. TOP ROW - STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                <StatsCard
                    title="Total Sales"
                    value={`₹${totalSales.toLocaleString()}`}
                    subValue={`+ ₹${todaySales.toLocaleString()} Today`}
                    icon={<TrendingUp size={20} color={isDark ? '#4ade80' : "#15803d"} />}
                    bg={isDark ? 'rgba(74, 222, 128, 0.1)' : "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)"}
                    borderColor={isDark ? 'rgba(74, 222, 128, 0.2)' : "#bbf7d0"}
                    textColor={isDark ? '#4ade80' : "#166534"}
                    isDark={isDark}
                />
                <StatsCard
                    title="Total Expense"
                    value={`₹${totalExpenses.toLocaleString()}`}
                    subValue={`+ ₹${todayExpenses.toLocaleString()} Today`}
                    icon={<TrendingDown size={20} color={isDark ? '#f87171' : "#b91c1c"} />}
                    bg={isDark ? 'rgba(248, 113, 113, 0.1)' : "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)"}
                    borderColor={isDark ? 'rgba(248, 113, 113, 0.2)' : "#fecaca"}
                    textColor={isDark ? '#f87171' : "#991b1b"}
                    isDark={isDark}
                />
                <StatsCard
                    title="Total Orders"
                    value={`${totalOrders} Orders`}
                    subValue={`${pendingOrders} Pending`}
                    icon={<ShoppingBag size={20} color={isDark ? '#2dd4bf' : "#0f766e"} />}
                    bg={isDark ? 'rgba(45, 212, 191, 0.1)' : "linear-gradient(135deg, #ccfbf1 0%, #f0fdfa 100%)"}
                    borderColor={isDark ? 'rgba(45, 212, 191, 0.2)' : "#99f6e4"}
                    textColor={isDark ? '#2dd4bf' : "#115e59"}
                    isDark={isDark}
                />
                <StatsCard
                    title="Net Profit"
                    value={`₹${totalProfit.toLocaleString()}`}
                    subValue={`+ ₹${todayProfit.toLocaleString()} Today`}
                    icon={<Wallet size={20} color={isDark ? '#fbbf24' : "#854d0e"} />}
                    bg={isDark ? 'rgba(251, 191, 36, 0.1)' : "linear-gradient(135deg, #fefce8 0%, #fffbeb 100%)"}
                    borderColor={isDark ? 'rgba(251, 191, 36, 0.2)' : "#fde047"}
                    textColor={isDark ? '#fbbf24' : "#a16207"}
                    isDark={isDark}
                />
            </div>

            {/* 2. MAIN SECTION - 3 COLUMNS */}
            {/* [FIX] Changed columns to 2fr 1fr 1fr and gap to 16px to match Top Cards exactly */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', flex: 1, minHeight: 0, paddingBottom: '40px' }}>

                {/* COL 1: LIVE ORDERS & LOW STOCK */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto', padding: '8px 8px 8px 0' }} className="hide-scrollbar">

                    {/* A. Live Orders */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* UPI & CASH KPIs - Responsive */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: isSmallDesktop ? '0' : '8px' }}
                        >
                            <StatsCard
                                title="Cash Received"
                                value={`₹${totalCash.toLocaleString()}`}
                                subValue={`+ ₹${todayCash.toLocaleString()} Today`}
                                icon={<Banknote size={18} color={isDark ? '#4ade80' : "#15803d"} />}
                                bg={isDark ? 'rgba(74, 222, 128, 0.05)' : "rgba(16, 185, 129, 0.05)"}
                                borderColor={isDark ? 'rgba(74, 222, 128, 0.1)' : "rgba(16, 185, 129, 0.1)"}
                                textColor={isDark ? '#4ade80' : "#15803d"}
                                isDark={isDark}
                                compact
                            />
                            <StatsCard
                                title="UPI Received"
                                value={`₹${totalUPI.toLocaleString()}`}
                                subValue={`+ ₹${todayUPI.toLocaleString()} Today`}
                                icon={<Smartphone size={18} color={isDark ? '#818cf8' : "#4338ca"} />}
                                bg={isDark ? 'rgba(129, 140, 248, 0.05)' : "rgba(79, 70, 229, 0.05)"}
                                borderColor={isDark ? 'rgba(129, 140, 248, 0.1)' : "rgba(79, 70, 229, 0.1)"}
                                textColor={isDark ? '#818cf8' : "#4338ca"}
                                isDark={isDark}
                                compact
                            />
                        </motion.div>

                        {!isSmallDesktop && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', color: glassTextStyle }}>Live Orders</h3>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    {['pending', 'ready', 'all'].map(status => (
                                        <div
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            style={{
                                                color: statusFilter === status ? '#166534' : (isDark ? '#71717a' : '#a1a1aa'),
                                                fontWeight: statusFilter === status ? 700 : 500,
                                                cursor: 'pointer',
                                                textTransform: 'capitalize',
                                                borderBottom: statusFilter === status ? '2px solid #166534' : '2px solid transparent',
                                                paddingBottom: '2px',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            {status}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {!isSmallDesktop && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {filteredOrders.slice(0, 4).map(order => (
                                <div
                                    key={order.id}
                                    onClick={() => handleOrderClick(order.id)}
                                    style={{
                                        ...glassCardStyle,
                                        padding: '16px', borderRadius: '16px',
                                        display: 'flex', flexDirection: 'column', justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        minHeight: '100px'
                                    }}
                                    className="order-card"
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div style={{ fontWeight: 800, fontSize: '1rem', color: isDark ? 'white' : '#27272a' }}>#{order.id.slice(-6).toUpperCase()}</div>
                                        <div style={{ fontWeight: 800, color: '#b91c1c', fontSize: '1rem' }}>+₹{order.totalValue}</div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                        <div style={{ fontSize: '0.85rem', color: isDark ? '#e4e4e7' : '#27272a', fontWeight: 600 }}>
                                            {order.customer?.name || 'Walk-in'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: glassSubTextStyle }}>
                                            {format(new Date(order.date), 'hh:mm a')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredOrders.length === 0 && (
                                <div style={{
                                    gridColumn: '1 / -1', padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa',
                                    borderRadius: '16px',
                                    border: isDark ? '1px dashed rgba(255,255,255,0.1)' : '1px dashed #d4d4d8',
                                    color: glassSubTextStyle
                                }}>
                                    No orders found
                                </div>
                            )}
                        </div>
                    )}


                    {/* B. Low Stock Alerts (Inventory Card Look) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, marginTop: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: glassTextStyle }}>Low Stock Alert</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', flex: 1 }}>
                            {lowStockAlerts.map(item => (
                                <div
                                    key={item.id}
                                    className="low-stock-card"
                                    onClick={() => navigate('/inventory', { state: { openBulkEdit: true, highlightLowStock: true } })}
                                    style={{
                                        ...glassCardStyle,
                                        borderRadius: '16px',
                                        padding: '8px',
                                        display: 'flex', flexDirection: 'column', gap: '8px',
                                        height: isLargeDesktop ? '180px' : 'auto', // Reduced height on large screens
                                        cursor: 'pointer'
                                    }}
                                >
                                    {/* Large Image Area */}
                                    <div style={{
                                        width: '100%', height: isLargeDesktop ? '80px' : '120px', // Reduced height for image
                                        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#f9fafb', borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        overflow: 'hidden'
                                    }}>
                                        {/* Use Image logic similar to ProductGrid */}
                                        {item.image && item.image.length > 5 ? (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                style={{
                                                    width: '100%', height: '100%',
                                                    objectFit: 'contain',
                                                    padding: '8px'
                                                }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: '3.5rem' }}>
                                                {item.image || '📦'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: glassTextStyle, lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.name}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: glassSubTextStyle }}>
                                            {item.category}
                                        </div>

                                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                                            <div style={{ fontWeight: 700, color: glassTextStyle, fontSize: '0.9rem' }}>₹{item.price}</div>
                                            <div style={{
                                                backgroundColor: '#ffe4e6', color: '#be123c',
                                                padding: '2px 6px', borderRadius: '4px',
                                                fontSize: '0.7rem', fontWeight: 700
                                            }}>
                                                Stock: {item.stock}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {lowStockAlerts.length === 0 && (
                                <div style={{
                                    gridColumn: '1 / -1', flex: 1, padding: '24px', borderRadius: '16px',
                                    backgroundColor: isDark ? 'rgba(74, 222, 128, 0.1)' : '#f0fdf4',
                                    border: isDark ? '1px dashed rgba(74, 222, 128, 0.2)' : '1px dashed #bbf7d0',
                                    color: isDark ? '#4ade80' : '#166534',
                                    fontSize: '0.9rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}>
                                    <CheckCircle size={32} />
                                    <span>Inventory is healthy!</span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* COL 2: RECENT ACTIVITY (Scrollable, Compact) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '100%', overflow: 'hidden' }}>
                    <div
                        onClick={() => setShowActivityModal(true)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                    >
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: glassTextStyle }}>Recent Activity</h3>
                        <ArrowRight size={16} color={glassSubTextStyle} />
                    </div>

                    <div style={{
                        ...glassCardStyle,
                        borderRadius: '16px',
                        flex: 1, overflowY: 'auto',
                        padding: '8px' // Internal padding for scroll
                    }} className="hide-scrollbar">
                        {recentActivity.map((t, i) => (
                            <div key={t.id || i} style={{
                                display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '12px',
                                padding: '12px 4px', borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f4f4f5', alignItems: 'center'
                            }}>
                                {/* Info */}
                                <div>
                                    <div style={{ fontSize: '0.9rem', color: glassTextStyle, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                                        {getTransactionTitle(t)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: glassSubTextStyle }}>
                                        {format(new Date(t.date), 'hh:mm a')}
                                    </div>
                                </div>

                                {/* Amount */}
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 600, color: t.type === 'expense' ? '#b91c1c' : '#166534', fontSize: '0.9rem' }}>
                                        {t.type === 'expense' ? '-' : '+'}₹{t.amount}
                                    </div>
                                    {/* Show DUE amount if Booking */}
                                    {t.type === 'order' && Number(t.totalValue) > Number(t.amount) && (
                                        <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600, marginTop: '2px' }}>
                                            Due: ₹{Number(t.totalValue) - Number(t.amount)}
                                        </div>
                                    )}
                                </div>

                                {/* Delete Action */}
                                <div
                                    onClick={(e) => handleDeleteTransaction(e, t.id)}
                                    style={{ cursor: 'pointer', padding: '4px', opacity: 0.4, transition: 'opacity 0.2s' }}
                                    onMouseEnter={(e) => e.target.style.opacity = 1}
                                    onMouseLeave={(e) => e.target.style.opacity = 0.4}
                                >
                                    <Trash2 size={14} color="#ef4444" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COL 3: QUICK ACTIONS (2x2 Grid, Glass Style, FIXED HEIGHT) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: glassTextStyle }}>Quick Actions</h3>

                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'repeat(2, 1fr)', gap: '16px',
                        flex: 1, maxHeight: '500px' // [UPDATED] Prevent stretching too much
                    }}>
                        {/* Daily Sale */}
                        {/* [FIX] Restored Gradient backgrounds */}
                        <ActionButton
                            onClick={() => { triggerHaptic('medium'); handleOpenTransactionModal('sale'); }}
                            label="New Sale"
                            subLabel=""
                            icon={<div style={{ fontSize: '3rem' }}>🧁</div>}
                            bg={isDark ? 'rgba(236, 252, 203, 0.1)' : "linear-gradient(135deg, #ecfccb 0%, #f7fee7 100%)"}
                            accentColor={isDark ? '#bef264' : "#365314"}
                            border={isDark ? '1px solid rgba(190, 242, 100, 0.2)' : "1px solid #d9f99d"}
                            isCentered
                            isDark={isDark}
                        />
                        {/* Add Expense */}
                        <ActionButton
                            onClick={() => { triggerHaptic('medium'); handleOpenTransactionModal('expense'); }}
                            label="Add Expense"
                            subLabel=""
                            icon={<div style={{ fontSize: '3rem' }}>💸</div>}
                            bg={isDark ? 'rgba(255, 228, 230, 0.1)' : "linear-gradient(135deg, #ffe4e6 0%, #fff1f2 100%)"}
                            accentColor={isDark ? '#fda4af' : "#881337"}
                            border={isDark ? '1px solid rgba(253, 164, 175, 0.2)' : "1px solid #fecaca"}
                            isCentered
                            isDark={isDark}
                        />

                        {/* Reports */}
                        <ActionButton
                            onClick={() => { triggerHaptic('light'); setShowReportsModal(true); }}
                            label="View Reports"
                            subLabel=""
                            icon={<div style={{ fontSize: '3rem' }}>📄</div>}
                            bg={isDark ? 'rgba(224, 242, 254, 0.1)' : "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)"}
                            accentColor={isDark ? '#7dd3fc' : "#0369a1"}
                            border={isDark ? '1px solid rgba(125, 211, 252, 0.2)' : "1px solid #bae6fd"}
                            isCentered
                            isDark={isDark}
                        />

                        {/* Analytics */}
                        <ActionButton
                            onClick={() => { triggerHaptic('light'); setCurrentView('analytics'); }}
                            label="View Analytics"
                            subLabel=""
                            icon={<div style={{ fontSize: '3rem' }}>📊</div>}
                            bg={isDark ? 'rgba(255, 237, 213, 0.1)' : "linear-gradient(135deg, #ffedd5 0%, #fff7ed 100%)"} // Light Orange
                            accentColor={isDark ? '#fdba74' : "#c2410c"}
                            border={isDark ? '1px solid rgba(253, 186, 116, 0.2)' : "1px solid #fed7aa"}
                            isCentered
                            isDark={isDark}
                        />
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* Quick Action Modal */}
            <Modal
                isOpen={showTransactionModal}
                onClose={() => setShowTransactionModal(false)}
                title={transactionType === 'sale' ? 'Add Daily Sale' : 'Add Expense'}
            >
                <TransactionForm
                    initialType={transactionType}
                    onSuccess={() => setShowTransactionModal(false)}
                />
            </Modal>

            {/* Reports Modal (Centered Popup) */}
            {showReportsModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 60,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        width: '100%', maxWidth: '650px', // [COMPACT] Narrower width
                        height: '750px', // [FIX] Increased height to show more rows
                        maxHeight: '90vh',
                        backgroundColor: 'transparent',
                        boxShadow: 'none',
                        overflow: 'visible', // Allow buttons to float outside if needed
                        display: 'flex', flexDirection: 'column', position: 'relative'
                    }}>
                        <Reports isModal={true} onClose={() => setShowReportsModal(false)} />
                    </div>
                </div>
            )}

            {/* Recent Activity Full Modal */}
            <Modal
                isOpen={showActivityModal}
                onClose={() => setShowActivityModal(false)}
                title="Recent Activity"
            >
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {recentActivity.map((t, i) => (
                        <div key={t.id || i} style={{ padding: '16px', borderBottom: '1px solid #f4f4f5', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    {/* FULL DESCRIPTION */}
                                    <div style={{ fontWeight: 600, fontSize: '1rem', color: glassTextStyle, lineHeight: '1.4' }}>
                                        {getFullDescription(t)}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: glassSubTextStyle, marginTop: '4px' }}>
                                        {format(new Date(t.date), 'dd MMM yyyy, hh:mm a')} • #{t.id ? t.id.slice(-6).toUpperCase() : '???'}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, color: t.type === 'expense' ? '#b91c1c' : '#166534', fontSize: '1.1rem' }}>
                                        {t.type === 'expense' ? '-' : '+'}₹{t.amount}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: glassSubTextStyle }}>
                                        {t.type === 'expense' ? 'Paid' : 'Received'}
                                    </div>
                                </div>
                            </div>

                            {/* EXTRA DETAILS ROW */}
                            {t.type === 'order' && (
                                <div style={{
                                    display: 'flex', gap: '12px', marginTop: '4px', paddingTop: '8px',
                                    borderTop: isDark ? '1px dashed rgba(255,255,255,0.1)' : '1px dashed #e4e4e7'
                                }}>
                                    <div style={{ fontSize: '0.85rem', color: glassSubTextStyle }}>
                                        Total Value: <span style={{ fontWeight: 600, color: glassTextStyle }}>₹{t.totalValue}</span>
                                    </div>
                                    {Number(t.totalValue) > Number(t.amount) && (
                                        <div style={{ fontSize: '0.85rem', color: '#b45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <AlertTriangle size={12} />
                                            Pending: ₹{Number(t.totalValue) - Number(t.amount)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Modal>

            <style>{`
                .order-card:hover, .stats-card:hover, .action-card:hover, .low-stock-card:hover { 
                    transform: translateY(-4px) scale(1.01); 
                    box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15); 
                    border-color: #d4d4d8; 
                }
                .order-card, .stats-card, .action-card, .low-stock-card {
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
                }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

const StatsCard = ({ title, value, subValue, icon, bg, borderColor, textColor, isDark, compact = false }) => (
    <div className="stats-card" style={{
        padding: compact ? '16px' : '24px', borderRadius: '16px', background: bg,
        border: `1px solid ${borderColor}`,
        display: 'flex', flexDirection: 'column', gap: compact ? '4px' : '8px',
        backdropFilter: isDark ? 'blur(12px)' : 'none',
        boxShadow: isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.2)' : 'none',
        cursor: 'pointer'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: textColor, opacity: 1 }}>
            {icon}
            <span style={{ fontSize: compact ? '0.8rem' : '0.9rem', fontWeight: 600 }}>{title}</span>
        </div>
        <div style={{ fontSize: compact ? '1.2rem' : '2rem', fontWeight: 800, color: isDark ? 'white' : '#3f3f46' }}>
            {value}
        </div>
        <div style={{ fontSize: compact ? '0.75rem' : '0.85rem', color: textColor, fontWeight: 500 }}>
            {subValue}
        </div>
    </div>
);

const ActionButton = ({ onClick, label, subLabel, icon, bg, accentColor, border = 'none', style = {}, isSmall = false, isCentered = false, isDark }) => (
    <button
        onClick={onClick}
        className="glass-button action-card"
        style={{
            ...style,
            width: '100%', padding: '16px', borderRadius: '24px',
            background: bg, border: border,
            display: 'flex', flexDirection: isCentered ? 'column' : (isSmall ? 'column' : 'row'),
            alignItems: 'center',
            justifyContent: 'center',
            gap: isCentered ? '8px' : (isSmall ? '8px' : '16px'),
            cursor: 'pointer', textAlign: 'center',
            boxShadow: border === 'none' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none',
            transition: 'transform 0.1s, box-shadow 0.2s',
            backdropFilter: 'blur(12px)'
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
        </div>
        <div style={{ flex: isCentered || isSmall ? 0 : 1 }}>
            <div style={{ fontSize: isCentered ? '1rem' : (isSmall ? '0.9rem' : '1.1rem'), fontWeight: 700, color: accentColor }}>{label}</div>
            {!isSmall && !isCentered && <div style={{ fontSize: '0.85rem', color: isDark ? '#a1a1aa' : '#71717a' }}>{subLabel}</div>}
        </div>
        {!isSmall && !isCentered && border === 'none' && (
            <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', padding: '8px', borderRadius: '8px' }}>
                <Plus size={20} color={accentColor} />
            </div>
        )}
    </button>
);

export default DesktopHome;
