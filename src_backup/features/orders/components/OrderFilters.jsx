import React, { useState } from 'react';
import { Search, ArrowUpDown, LayoutGrid, List, ArrowUp, ArrowDown, X } from 'lucide-react';
import ProfileMenu from '../../../components/ProfileMenu';

const OrderFilters = ({
    isMobile,
    searchTerm, setSearchTerm,
    viewMode, setViewMode,
    sortBy, setSortBy,
    statusFilter, setStatusFilter
}) => {
    const [showSortMenu, setShowSortMenu] = useState(false);

    // --- Mobile Header ---
    if (isMobile) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Orders</h1>

                    {/* Inline Search Bar */}
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '8px 30px 8px 32px', borderRadius: '12px',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-input)', // Standardized Background
                                color: 'var(--color-text-primary)',
                                fontSize: '0.9rem', outline: 'none'
                            }}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                style={{
                                    position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'transparent', border: 'none', color: 'var(--color-text-muted)',
                                    cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center'
                                }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <ProfileMenu />
                </div>

                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }} className="no-scrollbar">
                    {['pending', 'ready', 'completed'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            style={{
                                flex: '0 0 auto',
                                padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--color-border)',
                                borderColor: statusFilter === status ? 'var(--color-primary)' : 'var(--color-border)',
                                background: statusFilter === status ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                                color: statusFilter === status ? 'white' : 'var(--color-text-primary)',
                                fontWeight: 600, fontSize: '0.9rem'
                            }}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // --- Desktop Header (Inventory Style match) ---
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
            {/* Top Row: Title + Search (Middle) + Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, whiteSpace: 'nowrap' }}>Orders</h1>

                {/* Search Bar (Middle) */}
                <div style={{ flex: 1, maxWidth: '500px', position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search orders..."
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
                            onClick={() => setSearchTerm('')}
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
                    {/* View Toggle */}
                    <div style={{ background: 'var(--color-bg-surface)', borderRadius: '12px', padding: '4px', border: '1px solid var(--color-border)', display: 'flex' }}>
                        <button
                            onClick={() => setViewMode('card')}
                            style={{
                                padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                background: viewMode === 'card' ? 'var(--color-bg-secondary)' : 'transparent',
                                color: viewMode === 'card' ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
                            }}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            style={{
                                padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                background: viewMode === 'table' ? 'var(--color-bg-secondary)' : 'transparent',
                                color: viewMode === 'table' ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
                            }}
                        >
                            <List size={18} />
                        </button>
                    </div>

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
                            <ArrowUpDown size={18} /> <span style={{ marginRight: '4px' }}>{sortBy === 'default' ? 'Sort' : 'Sorted'}</span>
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
                                        onClick={() => { setSortBy('default'); setShowSortMenu(false); }}
                                        style={{
                                            padding: '10px 12px', borderRadius: '8px', border: 'none',
                                            background: sortBy === 'default' ? 'var(--color-primary)' : 'transparent',
                                            color: sortBy === 'default' ? 'white' : 'var(--color-text-primary)',
                                            textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600
                                        }}
                                    >
                                        Default
                                    </button>
                                    {[
                                        { label: 'Priority', key: 'priority', defaultDir: 'asc' },
                                        { label: 'Date', key: 'date', defaultDir: 'desc' },
                                        { label: 'Amount', key: 'amount', defaultDir: 'desc' },
                                    ].map(opt => {
                                        const isActive = sortBy.startsWith(opt.key);
                                        const currentDir = isActive ? sortBy.split('-')[1] : null;

                                        return (
                                            <button
                                                key={opt.key}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    let newSort;
                                                    if (isActive) {
                                                        const newDir = currentDir === 'asc' ? 'desc' : 'asc';
                                                        newSort = `${opt.key}-${newDir}`;
                                                    } else {
                                                        newSort = `${opt.key}-${opt.defaultDir}`;
                                                    }
                                                    setSortBy(newSort);
                                                }}
                                                style={{
                                                    padding: '10px 12px', borderRadius: '8px', border: 'none',
                                                    background: isActive ? 'var(--color-primary)' : 'transparent',
                                                    color: isActive ? 'white' : 'var(--color-text-primary)',
                                                    textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                }}
                                            >
                                                {opt.label}
                                                {isActive ? (currentDir === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />) : <ArrowUpDown size={16} style={{ opacity: 0.5 }} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>

                    <ProfileMenu />
                </div>
            </div>

            {/* Bottom Row: Status Filter Tabs (Chips) */}
            <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', maxWidth: '100%' }}>
                {['pending', 'ready', 'completed'].map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        style={{
                            padding: '8px 20px', borderRadius: '25px', border: '1px solid',
                            borderColor: statusFilter === status ? 'var(--color-primary)' : 'var(--color-border)',
                            background: statusFilter === status ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                            color: statusFilter === status ? 'white' : 'var(--color-text-secondary)',
                            fontSize: '0.9rem', whiteSpace: 'nowrap', fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default OrderFilters;
