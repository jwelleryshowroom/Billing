import React, { useState } from 'react';
import { Search, UtensilsCrossed, Plus, Minus, X } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import VariantSelectionModal from './VariantSelectionModal';

const ProductGrid = ({
    searchTerm,
    setSearchTerm,
    categories,
    filterCategory,
    setFilterCategory,
    filteredItems,
    cart,
    addToCart,
    updateQty,
    isMobile,
    setShowMobileSearch,
    // Quick Add Props
    quickAddName,
    setQuickAddName,
    quickAddPrice,
    setQuickAddPrice,
    quickAddCategory,
    setQuickAddCategory,
    quickAddStock,
    setQuickAddStock,
    quickAddTrackStock,
    setQuickAddTrackStock,
    quickAddImage,
    setQuickAddImage,
    suggestedEmoji,
    handleQuickAddSubmit
}) => {
    // [NEW] Variant Selection State
    const [selectedVariantItem, setSelectedVariantItem] = useState(null);
    const [anchorRect, setAnchorRect] = useState(null);

    const handleItemClick = (item, e) => {
        triggerHaptic('light');
        if (item.variants && item.variants.length > 0) {
            // Capture clicked element's position for popover positioning
            if (e && e.currentTarget) {
                const rect = e.currentTarget.getBoundingClientRect();
                setAnchorRect(rect);
            }
            setSelectedVariantItem(item);
        } else {
            addToCart(item);
        }
    };

    const handleVariantSelect = (variant) => {
        if (!selectedVariantItem) return;

        const variantCartItem = {
            id: `${selectedVariantItem.id}-${variant.name.replace(/\s+/g, '-')}`, // Unique ID
            productId: selectedVariantItem.id,
            name: `${selectedVariantItem.name} (${variant.name})`,
            price: Number(variant.price),
            stock: Number(variant.stock),
            category: selectedVariantItem.category,
            image: selectedVariantItem.image,
            isVariant: true,
            variantId: variant.id
        };

        addToCart(variantCartItem);
        setSelectedVariantItem(null);
    };

    return (
        <div className="menu-pane" style={{ borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', background: 'transparent', position: 'relative' }}>
            {/* Variant Selection Modal */}
            <VariantSelectionModal
                isOpen={!!selectedVariantItem}
                onClose={() => setSelectedVariantItem(null)}
                item={selectedVariantItem}
                onSelect={handleVariantSelect}
                anchorRect={anchorRect}
            />

            {/* Search & Filter Bar */}
            <div className="filter-bar" style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '12px', background: 'var(--color-bg-surface-transparent)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
                <div className="search-container-desktop" style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                    <input
                        className="search-input"
                        type="text"
                        placeholder="Search Item..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'var(--color-bg-secondary)', border: 'none', borderRadius: '8px', color: 'var(--color-text-primary)' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingRight: '4px' }} className="no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => {
                                triggerHaptic('light');
                                setFilterCategory(cat);
                            }}
                            style={{
                                padding: '0 16px',
                                borderRadius: '8px',
                                background: filterCategory === cat ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                                color: filterCategory === cat ? 'white' : 'var(--color-text-muted)',
                                border: '1px solid',
                                borderColor: filterCategory === cat ? 'var(--color-primary)' : 'var(--color-border)',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontSize: '0.9rem',
                                height: '42px'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '100px' }}>
                <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
                    {filteredItems.map(item => {
                        const cartItem = cart.find(c => c.id === item.id);
                        const qty = cartItem ? cartItem.qty : 0;

                        // --- DESKTOP CARD VIEW (Restore Original) ---
                        if (!isMobile) {
                            return (
                                <button
                                    key={item.id}
                                    onClick={(e) => handleItemClick(item, e)}
                                    className="item-card"
                                    style={{
                                        background: 'var(--color-bg-glass-input)',
                                        backdropFilter: 'blur(12px)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '12px',
                                        padding: '12px',
                                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                                        cursor: 'pointer',
                                        height: 'auto',
                                        minHeight: '140px',
                                        position: 'relative',
                                        textAlign: 'left'
                                    }}
                                >
                                    <div style={{
                                        height: '100px', width: '100%',
                                        background: 'var(--color-bg-secondary)',
                                        borderRadius: '8px',
                                        marginBottom: '8px',
                                        overflow: 'hidden',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        padding: `${item.imagePadding || 0}px`
                                    }}>
                                        {item.image && item.image.length > 5 ? (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                style={{
                                                    width: '100%', height: '100%',
                                                    objectFit: item.imageFit || 'cover',
                                                    borderRadius: item.imagePadding ? '4px' : '0',
                                                    transform: `scale(${item.imageZoom || 1})`
                                                }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: '2rem', transform: `scale(${item.imageZoom || 1})` }}>
                                                {item.image ? item.image : <UtensilsCrossed size={32} color="var(--color-border)" />}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: '1.2', color: 'var(--color-text-primary)', marginBottom: '4px' }}>{item.name}</div>
                                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                        <div style={{ color: '#4CAF50', fontWeight: 700 }}>
                                            {item.variants && item.variants.length > 0
                                                ? `₹${Math.min(...item.variants.map(v => v.price))} - ₹${Math.max(...item.variants.map(v => v.price))}`
                                                : `₹${item.price}`}
                                        </div>
                                        <div style={{
                                            fontSize: '0.7rem',
                                            color: (item.trackStock === false) ? '#4CAF50' : '#666',
                                            background: 'var(--color-bg-secondary)',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontWeight: (item.trackStock === false) ? 700 : 400
                                        }}>
                                            {item.variants && item.variants.length > 0
                                                ? `${item.variants.length} opts`
                                                : (item.trackStock === false ? 'In Stock' : `${item.stock} left`)}
                                        </div>
                                    </div>
                                    {qty > 0 && (
                                        <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--color-primary)', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                            {qty}
                                        </div>
                                    )}
                                </button>
                            );
                        }

                        // --- MOBILE CARD VIEW (Swiggy Style) ---
                        return (
                            <div
                                key={item.id}
                                className="item-card"
                                style={{
                                    background: 'var(--color-bg-glass-input)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '12px',
                                    padding: '8px',
                                    display: 'flex', flexDirection: 'column',
                                    position: 'relative',
                                    textAlign: 'left',
                                    userSelect: 'none'
                                }}
                            >
                                <div style={{
                                    height: '100px', width: '100%',
                                    background: 'var(--color-bg-secondary)',
                                    borderRadius: '8px',
                                    marginBottom: '8px',
                                    // marginTop: '45px', // REVERTED
                                    overflow: 'hidden',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: `${item.imagePadding || 0}px`,
                                    position: 'relative'
                                }}>
                                    {item.image && item.image.length > 5 ? (
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            style={{
                                                width: '100%', height: '100%',
                                                objectFit: 'contain', // Changed from item.imageFit || 'cover' to prevent cropping
                                                borderRadius: item.imagePadding ? '4px' : '0',
                                                // Disable zoom on mobile to prevent cropping issues
                                                // transform: `scale(${item.imageZoom || 1})` 
                                            }}
                                        />
                                    ) : (
                                        <span style={{ fontSize: '2rem', transform: `scale(${item.imageZoom || 1})` }}>
                                            {item.image ? item.image : <UtensilsCrossed size={32} color="var(--color-border)" />}
                                        </span>
                                    )}
                                </div>

                                {/* MOBILE ACTION: Plus Icon Top-Right (Corner of Tile) */}
                                <div
                                    style={{ position: 'absolute', top: '1px', right: '1px', left: 'auto', zIndex: 10, width: 'fit-content' }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    {qty === 0 ? (
                                        <button
                                            onClick={(e) => handleItemClick(item, e)}
                                            className="swiggy-btn"
                                            style={{
                                                width: '24px', height: '24px', // Ultra Compact
                                                background: 'white', border: '1px solid var(--color-border)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                color: '#4CAF50', // Swiggy Green
                                                cursor: 'pointer',
                                                fontWeight: 800,
                                                padding: 0
                                            }}
                                        >
                                            <Plus size={16} strokeWidth={3} />
                                        </button>
                                    ) : (
                                        <div className="swiggy-btn" style={{
                                            background: 'white',
                                            display: 'flex', alignItems: 'center',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)', height: '24px',
                                            border: '1px solid var(--color-primary)',
                                            overflow: 'hidden',
                                            width: 'fit-content'
                                        }}>
                                            <button onClick={() => updateQty(item.id, -1)} style={{ width: '20px', height: '100%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', cursor: 'pointer', padding: 0 }}><Minus size={12} /></button>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', minWidth: '14px', textAlign: 'center', lineHeight: '1' }}>{qty}</span>
                                            <button onClick={() => updateQty(item.id, 1)} style={{ width: '20px', height: '100%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', cursor: 'pointer', padding: 0 }}><Plus size={12} /></button>
                                        </div>
                                    )}
                                </div>

                                <div style={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: '1.2', color: 'var(--color-text-primary)', marginBottom: '4px', flex: 1 }}>{item.name}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginTop: '4px' }}>
                                    <div style={{ color: '#4CAF50', fontWeight: 700 }}>
                                        {item.variants && item.variants.length > 0
                                            ? `₹${Math.min(...item.variants.map(v => v.price))} - ₹${Math.max(...item.variants.map(v => v.price))}`
                                            : `₹${item.price}`}
                                    </div>
                                    <div style={{
                                        fontSize: '0.7rem',
                                        color: (item.trackStock === false) ? '#4CAF50' : '#666',
                                        fontWeight: (item.trackStock === false) ? 700 : 400
                                    }}>
                                        {item.variants && item.variants.length > 0
                                            ? `${item.variants.length} opts`
                                            : (item.trackStock === false ? 'Available' : `${item.stock} left`)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* EMPTY STATE */}
                    {filteredItems.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '10px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔍</div>
                            <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '8px' }}>No items found</div>
                            <div style={{ fontSize: '0.9rem', marginBottom: '16px' }}>Add "{searchTerm}" to Inventory?</div>

                            {searchTerm && (
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.4)',
                                    backdropFilter: 'blur(12px)',
                                    padding: '16px', borderRadius: '12px',
                                    display: 'flex', flexDirection: 'column', gap: '10px',
                                    width: '100%', maxWidth: '300px',
                                    border: '1px solid var(--color-border)',
                                    textAlign: 'left',
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                                    color: 'var(--color-text-primary)'
                                }}>
                                    {/* Close Button */}
                                    <button
                                        onClick={() => setShowMobileSearch(false)}
                                        style={{
                                            position: 'absolute', top: '12px', right: '12px',
                                            background: 'transparent', border: 'none',
                                            color: 'var(--color-text-muted)', cursor: 'pointer',
                                            padding: '4px'
                                        }}
                                    >
                                        <X size={20} />
                                    </button>

                                    {/* Name & Emoji Suggestion */}
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>Name</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                value={quickAddName}
                                                onChange={e => setQuickAddName(e.target.value)}
                                                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}
                                            />
                                            {/* Emoji Suggestion / Selection */}
                                            {quickAddImage ? (
                                                <button
                                                    onClick={() => setQuickAddImage('')}
                                                    style={{
                                                        width: '36px', height: '36px', borderRadius: '6px',
                                                        border: '1px solid var(--color-primary)', background: 'var(--color-bg-surface)',
                                                        fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                    title="Clear Icon"
                                                >
                                                    {quickAddImage}
                                                </button>
                                            ) : (
                                                suggestedEmoji && (
                                                    <button
                                                        onClick={() => setQuickAddImage(suggestedEmoji)}
                                                        style={{
                                                            padding: '0 12px', borderRadius: '6px',
                                                            border: '1px dashed var(--color-primary)', background: 'transparent',
                                                            color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600,
                                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                                        }}
                                                    >
                                                        Use {suggestedEmoji}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {/* Price & Stock Row */}
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>Price (₹)</label>
                                            <input
                                                type="number"
                                                value={quickAddPrice}
                                                onChange={e => setQuickAddPrice(e.target.value)}
                                                placeholder="0"
                                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>Stock</label>
                                                {/* Tracking Toggle */}
                                                <div
                                                    onClick={() => setQuickAddTrackStock(!quickAddTrackStock)}
                                                    style={{
                                                        cursor: 'pointer', scale: '0.8', transformOrigin: 'right center',
                                                        display: 'flex', alignItems: 'center', gap: '4px',
                                                        opacity: quickAddTrackStock ? 1 : 0.6
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '28px', height: '14px', background: quickAddTrackStock ? 'var(--color-primary)' : '#ccc',
                                                        borderRadius: '10px', position: 'relative', transition: 'all 0.2s'
                                                    }}>
                                                        <div style={{
                                                            width: '10px', height: '10px', background: 'white', borderRadius: '50%',
                                                            position: 'absolute', top: '2px', left: quickAddTrackStock ? '16px' : '2px',
                                                            transition: 'all 0.2s'
                                                        }} />
                                                    </div>
                                                </div>
                                            </div>
                                            <input
                                                type="number"
                                                value={quickAddStock}
                                                disabled={!quickAddTrackStock}
                                                onChange={e => setQuickAddStock(e.target.value)}
                                                placeholder={quickAddTrackStock ? "0" : "∞"}
                                                style={{
                                                    width: '100%', padding: '8px', borderRadius: '6px',
                                                    border: '1px solid var(--color-border)',
                                                    background: quickAddTrackStock ? 'var(--color-bg-surface)' : 'rgba(0,0,0,0.05)',
                                                    color: quickAddTrackStock ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                                    opacity: quickAddTrackStock ? 1 : 0.7,
                                                    cursor: quickAddTrackStock ? 'text' : 'not-allowed'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>Category</label>
                                        <select
                                            value={quickAddCategory}
                                            onChange={e => setQuickAddCategory(e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}
                                        >
                                            {categories && categories.length > 0 ? (
                                                categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)
                                            ) : (
                                                <option value="General">General</option>
                                            )}
                                        </select>
                                    </div>

                                    <button
                                        onClick={handleQuickAddSubmit}
                                        style={{
                                            marginTop: '8px',
                                            padding: '10px', borderRadius: '8px',
                                            background: 'var(--color-primary)', color: 'white',
                                            border: 'none', fontWeight: 700, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                            boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                                        }}
                                    >
                                        <Plus size={18} /> Add & to Cart
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductGrid;
