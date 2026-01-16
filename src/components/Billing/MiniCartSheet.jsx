import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronUp, X, ArrowRight, Plus, Minus } from 'lucide-react';
import { useTheme } from '../../context/useTheme';
import { useSettings } from '../../context/SettingsContext';
import { triggerHaptic } from '../../utils/haptics';

const MiniCartSheet = ({ cart, onViewCart, savings = 0, updateQty }) => {
    const { theme } = useTheme();
    const { navVisible } = useSettings();
    const isDark = theme === 'dark';
    const [isExpanded, setIsExpanded] = useState(false);

    // Filter valid items
    const validItems = cart.filter(i => i.qty > 0);
    const itemCount = validItems.length;

    // Calculate total
    const totalAmount = validItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const finalSavings = savings || 0; // fallback

    // If empty, don't show anything
    if (itemCount === 0) return null;

    // Animation Variants
    const containerVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                damping: 25,
                stiffness: 300,
                mass: 0.5
            }
        },
        exit: { y: 20, opacity: 0 }
    };

    const handleExpandToggle = (e) => {
        e.stopPropagation();
        triggerHaptic('light');
        setIsExpanded(!isExpanded);
    };

    const handleViewCartClick = (e) => {
        e.stopPropagation();
        triggerHaptic('medium');
        onViewCart();
    };

    return (
        <AnimatePresence>
            {itemCount > 0 && (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={containerVariants}
                    style={{
                        position: 'fixed',
                        bottom: navVisible ? '96px' : '16px',
                        left: '16px',
                        right: '16px',
                        paddingBottom: '0',
                        zIndex: 10000,
                        pointerEvents: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}
                >
                    <div style={{ pointerEvents: 'auto', width: '100%', maxWidth: '500px', position: 'relative', display: 'flex', flexDirection: 'column' }}>

                        {/* Expanded Content (List Preview) - NOW ON TOP */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                    style={{
                                        width: '100%',
                                        backgroundColor: isDark ? '#1E1B18' : 'white',
                                        marginBottom: '-24px', // Connect to card below
                                        paddingTop: '20px',
                                        paddingBottom: '32px', // Space for overlap
                                        paddingLeft: '16px',
                                        paddingRight: '16px',
                                        borderTopLeftRadius: '24px',
                                        borderTopRightRadius: '24px',
                                        border: isDark ? '1px solid #332b29' : '1px solid #f4f4f5',
                                        borderBottom: 'none',
                                        boxShadow: isDark ? '0 -10px 40px -10px rgba(0,0,0,0.8)' : '0 -10px 30px -5px rgba(0, 0, 0, 0.15)',
                                        zIndex: 1,
                                        maxHeight: '50vh',
                                        overflowY: 'auto'
                                    }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {/* Header for Review */}
                                        <div style={{ paddingBottom: '8px', borderBottom: isDark ? '1px solid #332b29' : '1px solid #f4f4f5', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: isDark ? '#a1a1aa' : '#71717a' }}>Review Items</span>
                                        </div>

                                        {validItems.map(item => (
                                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                                    <div style={{
                                                        width: '32px', height: '32px',
                                                        borderRadius: '6px',
                                                        backgroundColor: isDark ? '#27272a' : '#f4f4f5',
                                                        border: `1px solid ${isDark ? '#3f3f46' : '#e4e4e7'}`,
                                                        backgroundImage: (item.image && item.image.length > 5) ? `url(${item.image})` : 'none',
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '1rem',
                                                        flexShrink: 0
                                                    }}>
                                                        {!(item.image && item.image.length > 5) && (item.imageEmoji || item.emoji || '🧁')}
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: '0.9rem', color: isDark ? '#e4e4e7' : '#3f3f46', fontWeight: 500 }}>
                                                            {item.name}
                                                        </span>
                                                        <span style={{ fontSize: '0.8rem', color: isDark ? '#a1a1aa' : '#71717a' }}>
                                                            ₹{item.price * item.qty}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Quantity Control */}
                                                <div style={{
                                                    display: 'flex', alignItems: 'center',
                                                    background: isDark ? '#27272a' : 'white',
                                                    borderRadius: '8px',
                                                    border: `1px solid ${isDark ? '#3f3f46' : '#e4e4e7'}`,
                                                    height: '28px',
                                                    overflow: 'hidden',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                }}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); updateQty(item.id, -1); }}
                                                        style={{ width: '28px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: isDark ? '#e4e4e7' : '#3f3f46' }}
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '16px', textAlign: 'center', color: isDark ? '#e4e4e7' : '#3f3f46' }}>
                                                        {item.qty}
                                                    </span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); updateQty(item.id, 1); }}
                                                        style={{ width: '28px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: isDark ? '#e4e4e7' : '#3f3f46' }}
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Main Card - NOW ON BOTTOM */}
                        <div
                            onClick={handleExpandToggle}
                            style={{
                                backgroundColor: isDark ? '#1E1B18' : 'white',
                                borderRadius: '24px',
                                padding: '12px 16px',
                                boxShadow: isDark ? '0 10px 40px -10px rgba(0,0,0,0.8)' : '0 10px 30px -5px rgba(0, 0, 0, 0.15)',
                                border: isDark ? '1px solid #332b29' : '1px solid #f4f4f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                position: 'relative',
                                zIndex: 2 // Keep above expanded content
                            }}
                        >
                            {/* Left: Product Preview + Count */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {/* Image Stack Preview */}
                                <div style={{ position: 'relative', width: '48px', height: '48px' }}>
                                    {[...validItems].reverse().slice(0, 3).map((item, idx) => (
                                        <div
                                            key={item.id}
                                            style={{
                                                position: 'absolute',
                                                top: idx * 2 + 'px', left: idx * 2 + 'px',
                                                width: '40px', height: '40px',
                                                borderRadius: '8px',
                                                backgroundColor: isDark ? '#27272a' : '#f4f4f5',
                                                border: `1px solid ${isDark ? '#3f3f46' : 'white'}`,
                                                backgroundImage: (item.image && item.image.length > 5) ? `url(${item.image})` : 'none',
                                                backgroundSize: 'cover',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1.2rem',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                zIndex: 3 - idx
                                            }}
                                        >
                                            {!(item.image && item.image.length > 5) && (item.imageEmoji || item.emoji || '🧁')}
                                        </div>
                                    ))}
                                </div>

                                {/* Text Info */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontWeight: 800, fontSize: '1rem', color: isDark ? '#fff7ed' : '#18181b' }}>
                                            {itemCount} Items
                                        </span>
                                        <ChevronUp size={16}
                                            style={{
                                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.3s',
                                                color: isDark ? '#a1a1aa' : '#71717a'
                                            }}
                                        />
                                    </div>
                                    {finalSavings > 0 ? (
                                        <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                                            You saved ₹{finalSavings}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.8rem', color: isDark ? '#a1a1aa' : '#71717a' }}>
                                            Total: ₹{totalAmount}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: View Cart Button */}
                            <button
                                onClick={handleViewCartClick}
                                style={{
                                    backgroundColor: '#2563eb', // Standard Blue or Brand Color
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '16px',
                                    fontSize: '0.95rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                                }}
                            >
                                View Cart
                            </button>
                        </div>
                    </div>
                </motion.div>
            )
            }
        </AnimatePresence >
    );
};

export default MiniCartSheet;
