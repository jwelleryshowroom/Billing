import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, LayoutGrid, List, ArrowUpDown, ArrowUp, ArrowDown, Upload, X, Edit3 } from 'lucide-react';
import { triggerHaptic } from '../../../utils/haptics';
import ProfileMenu from '../../../components/ProfileMenu';
import { useAuth } from '../../../context/useAuth';

const InventoryFilters = ({
    isMobile,
    searchTerm, setSearchTerm,
    selectedCategory, setSelectedCategory,
    categories,
    // viewMode, setViewMode removed
    sortBy, setSortBy,
    showSortMenu, setShowSortMenu,
    onAddClick,
    onImportClick,
    onBulkEditClick
}) => {
    const { role } = useAuth();
    const canAdd = role === 'admin' || role === 'staff';

    // --- Mobile Header ---
    if (isMobile) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Top Row: Title + Profile */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Menu & Stock</h1>
                    <ProfileMenu />
                </div>

                {/* Row 2: Search + Add */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '8px 30px 8px 36px', borderRadius: '12px', border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', fontSize: '0.95rem', outline: 'none'
                            }}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => {
                                    triggerHaptic('light');
                                    setSearchTerm('');
                                }}
                                style={{
                                    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'transparent', border: 'none', color: 'var(--color-text-muted)',
                                    cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center'
                                }}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    {canAdd && (
                        <button
                            onClick={onAddClick}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'var(--color-primary)', color: 'white', border: 'none',
                                padding: '10px 20px', borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontWeight: 600,
                                fontSize: '0.9rem'
                            }}
                        >
                            <Plus size={18} style={{ marginRight: '6px' }} />
                            Add Item
                        </button>
                    )}
                </div>

                {/* Categories */}
                <div className="no-scrollbar" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {categories.map(cat => (
                        <button
                            key={cat} onClick={() => {
                                triggerHaptic('light');
                                setSelectedCategory(cat);
                            }}
                            style={{
                                padding: '8px 20px', borderRadius: '25px', border: '1px solid',
                                borderColor: selectedCategory === cat ? 'var(--color-primary)' : 'var(--color-border)',
                                background: selectedCategory === cat ? 'var(--color-primary)' : 'var(--color-surface)',
                                color: selectedCategory === cat ? 'white' : 'var(--color-text-muted)',
                                fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // --- Desktop Header ---
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top Row: Title + Search (Middle) + Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, whiteSpace: 'nowrap' }}>Menu & Inventory</h1>

                {/* Search Bar (Middle) */}
                <div style={{ flex: 1, maxWidth: '500px', position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search items, price or category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '12px 36px 12px 48px', borderRadius: '16px',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)',
                            fontSize: '1rem', outline: 'none',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => {
                                triggerHaptic('light');
                                setSearchTerm('');
                            }}
                            style={{
                                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                background: 'transparent', border: 'none', color: 'var(--color-text-muted)',
                                cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center'
                            }}
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {/* Sort Dropdown */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowSortMenu(!showSortMenu)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)',
                                border: '1px solid var(--color-border)', padding: '10px 16px', borderRadius: '12px',
                                fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
                            }}
                        >
                            <ArrowUpDown size={18} />
                        </button>
                        {showSortMenu && (
                            <>
                                <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowSortMenu(false)}></div>
                                <div style={{
                                    position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                                    background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
                                    borderRadius: '12px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 100, minWidth: '160px'
                                }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSortBy('name-asc'); }}
                                        style={{
                                            padding: '10px 12px', borderRadius: '8px', border: 'none',
                                            background: sortBy === 'name-asc' ? 'var(--color-primary)' : 'transparent',
                                            color: sortBy === 'name-asc' ? 'white' : 'var(--color-text-primary)',
                                            textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem',
                                            display: 'flex', alignItems: 'center', gap: '12px', fontWeight: sortBy === 'name-asc' ? 600 : 400
                                        }}
                                    >Default</button>
                                    {[
                                        { label: 'Name', key: 'name', defaultDir: 'asc' },
                                        { label: 'Price', key: 'price', defaultDir: 'asc' },
                                        { label: 'Stock', key: 'stock', defaultDir: 'asc' },
                                    ].map(opt => {
                                        const isActive = sortBy.startsWith(opt.key);
                                        const direction = isActive ? sortBy.split('-')[1] : null;
                                        return (
                                            <button
                                                key={opt.key}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isActive) {
                                                        setSortBy(`${opt.key}-${direction === 'asc' ? 'desc' : 'asc'}`);
                                                    } else {
                                                        setSortBy(`${opt.key}-${opt.defaultDir}`);
                                                    }
                                                }}
                                                style={{
                                                    padding: '10px 12px', borderRadius: '8px', border: 'none',
                                                    background: isActive ? 'var(--color-primary)' : 'transparent',
                                                    color: isActive ? 'white' : 'var(--color-text-primary)',
                                                    textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                                                    fontWeight: isActive ? 600 : 400
                                                }}
                                            >
                                                <span>{opt.label}</span>
                                                {isActive ? (direction === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />) : <ArrowUpDown size={16} style={{ opacity: 0.5 }} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>

                    {canAdd && (
                        <>
                            <button
                                onClick={onImportClick}
                                style={{
                                    padding: '0 16px', height: '44px', borderRadius: '14px', border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)',
                                    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                                    fontSize: '0.9rem', fontWeight: 600
                                }}
                            >
                                <Upload size={18} /> Import
                            </button>

                            <button
                                onClick={onBulkEditClick}
                                style={{
                                    padding: '0 16px', height: '44px', borderRadius: '14px', border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)',
                                    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                                    fontSize: '0.9rem', fontWeight: 600
                                }}
                            >
                                <Edit3 size={18} /> Bulk Edit
                            </button>

                            <button
                                onClick={onAddClick}
                                style={{
                                    padding: '0 20px', height: '44px', borderRadius: '14px', border: 'none',
                                    background: 'var(--color-primary)', color: 'white',
                                    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                                    fontSize: '0.9rem', fontWeight: 700,
                                    boxShadow: '0 4px 12px rgba(139, 69, 19, 0.2)'
                                }}
                            >
                                <Plus size={20} style={{ strokeWidth: 3 }} /> Add Item
                            </button>
                        </>
                    )}
                    <ProfileMenu />
                </div>
            </div>

            {/* Bottom Row: Categories */}
            <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', maxWidth: '100%' }}>
                {categories.map(cat => (
                    <button
                        key={cat} onClick={() => {
                            triggerHaptic('light');
                            setSelectedCategory(cat);
                        }}
                        style={{
                            padding: '8px 16px', borderRadius: '20px', border: '1px solid',
                            borderColor: selectedCategory === cat ? 'var(--color-primary)' : 'var(--color-border)',
                            background: selectedCategory === cat ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                            color: selectedCategory === cat ? 'white' : 'var(--color-text-secondary)',
                            fontSize: '0.9rem', whiteSpace: 'nowrap'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>
    );
};


export default InventoryFilters;
