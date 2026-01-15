import React, { useState } from 'react';
import { Search, ArrowUpDown, LayoutGrid, List, ArrowUp, ArrowDown } from 'lucide-react';
import ProfileMenu from '../../../components/ProfileMenu';

const OrderFilters = ({
    isMobile,
    searchTerm, setSearchTerm,
    viewMode, setViewMode,
    sortBy, setSortBy,
    statusFilter, setStatusFilter
}) => {
    const [showSortMenu, setShowSortMenu] = useState(false);

    return (
        <div style={{ flexShrink: 0, marginBottom: '16px' }}>
            {/* Desktop Layout: Single Row */}
            {!isMobile ? (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    background: 'var(--color-bg-secondary)', // Optional: Background to unify
                    padding: '8px 16px',
                    borderRadius: '16px'
                }}>

                    {/* Left Group: Title & Tabs */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Orders</h1>

                        {/* Tabs Inline */}
                        <div style={{ display: 'flex', gap: '4px', background: 'var(--color-surface)', padding: '4px', borderRadius: '10px' }}>
                            {['pending', 'ready', 'completed'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: statusFilter === status ? 'var(--color-primary)' : 'transparent',
                                        color: statusFilter === status ? 'white' : 'var(--color-text-muted)',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Middle: Search (Flexible) */}
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px', margin: '0 20px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 8px 8px 36px',
                                borderRadius: '10px',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-surface)',
                                color: 'var(--color-text-primary)',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>

                    {/* Right Group: View, Sort, Profile */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

                        {/* View Toggle */}
                        <div style={{ background: 'var(--color-surface)', borderRadius: '8px', padding: '3px', border: '1px solid var(--color-border)', display: 'flex' }}>
                            <button
                                onClick={() => setViewMode('card')}
                                style={{
                                    padding: '5px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                    background: viewMode === 'card' ? 'var(--color-bg-secondary)' : 'transparent',
                                    color: viewMode === 'card' ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
                                }}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                style={{
                                    padding: '5px', borderRadius: '6px', border: 'none', cursor: 'pointer',
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
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: 'var(--color-surface)', color: 'var(--color-text-primary)',
                                    border: '1px solid var(--color-border)', padding: '8px 12px', borderRadius: '8px',
                                    fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                <ArrowUpDown size={16} /> {sortBy === 'default' ? 'Sort' : 'Sorted'}
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
                                                padding: '8px 12px', borderRadius: '8px', border: 'none',
                                                background: sortBy === 'default' ? 'var(--color-primary)' : 'transparent',
                                                color: sortBy === 'default' ? 'white' : 'var(--color-text-primary)',
                                                textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
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
                                                            // Toggle direction
                                                            const newDir = currentDir === 'asc' ? 'desc' : 'asc';
                                                            newSort = `${opt.key}-${newDir}`;
                                                        } else {
                                                            // Set default
                                                            newSort = `${opt.key}-${opt.defaultDir}`;
                                                        }
                                                        setSortBy(newSort);
                                                        // Keep menu open for toggling
                                                    }}
                                                    style={{
                                                        padding: '8px 12px', borderRadius: '8px', border: 'none',
                                                        background: isActive ? 'var(--color-primary)' : 'transparent',
                                                        color: isActive ? 'white' : 'var(--color-text-primary)',
                                                        textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem',
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                    }}
                                                >
                                                    {opt.label}
                                                    {isActive && (
                                                        currentDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                                    )}
                                                    {!isActive && <ArrowUpDown size={14} style={{ opacity: 0.3 }} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Profile Menu (contains Theme Toggle internally) */}
                        <ProfileMenu />
                    </div>
                </div>
            ) : (
                // Mobile Layout (Stacked)
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Orders</h1>
                        <ProfileMenu />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 10px 10px 36px', borderRadius: '12px',
                                border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                                color: 'var(--color-text-primary)'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {['pending', 'ready', 'completed'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                style={{
                                    flex: '1 0 auto',
                                    padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--color-border)',
                                    background: statusFilter === status ? 'var(--color-primary)' : 'var(--color-surface)',
                                    color: statusFilter === status ? 'white' : 'var(--color-text-primary)',
                                    fontWeight: 600, fontSize: '0.9rem'
                                }}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderFilters;
