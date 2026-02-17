import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Search, AlertTriangle, ArrowUp } from 'lucide-react';
import { useInventory } from '../../../context/InventoryContext';
import { triggerHaptic } from '../../../utils/haptics';

const BulkEditModal = ({ isOpen, onClose, highlightLowStock = false }) => {
    const { items, updateItem } = useInventory();
    const [editItems, setEditItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [changedIds, setChangedIds] = useState(new Set());
    const [isSaving, setIsSaving] = useState(false);

    // Initialize local state when modal opens
    useEffect(() => {
        if (isOpen) {
            // Deep copy items to local state
            setEditItems(JSON.parse(JSON.stringify(items)));
            setChangedIds(new Set());
            setSearchTerm('');
        }
    }, [isOpen, items]);

    const handleChange = (id, field, value) => {
        setEditItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
        setChangedIds(prev => new Set(prev).add(id));
    };

    const handleSave = async () => {
        setIsSaving(true);
        triggerHaptic('success');

        // Filter only changed items
        const itemsToUpdate = editItems.filter(item => changedIds.has(item.id));

        for (const item of itemsToUpdate) {
            // Validate numbers
            const updates = {
                price: parseFloat(item.price) || 0,
                stock: parseInt(item.stock) || 0,
                category: item.category // In case we add category editing later
            };

            await updateItem(item.id, updates);
        }

        setIsSaving(false);
        onClose();
    };

    // Filter and Sort list
    const filteredList = useMemo(() => {
        let list = editItems.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (highlightLowStock) {
            // Sort: Low stock items (<=5) first, then by name
            list = [...list].sort((a, b) => {
                const aLow = (a.trackStock !== false && a.stock <= 5);
                const bLow = (b.trackStock !== false && b.stock <= 5);

                if (aLow && !bLow) return -1;
                if (!aLow && bLow) return 1;
                return a.name.localeCompare(b.name);
            });
        }

        return list;
    }, [editItems, searchTerm, highlightLowStock]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', // Darker backdrop for better isolation
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px'
        }}>
            <div style={{
                width: '100%', maxWidth: '500px', // [CHANGED] Much narrower for compact view
                background: 'var(--color-bg-surface)',
                borderRadius: '20px',
                border: '1px solid var(--color-border)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', // Stronger shadow
                display: 'flex', flexDirection: 'column',
                height: '80vh',
                color: 'var(--color-text-main)',
                transition: 'all 0.3s ease',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-surface)' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        Bulk Stock Editor
                    </h2>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {changedIds.size > 0 && (
                            <div style={{ padding: '4px 10px', background: 'var(--color-primary)', color: '#fff', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                                {changedIds.size} Modified
                            </div>
                        )}
                        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}><X size={20} /></button>
                    </div>
                </div>

                {/* Search */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-surface)' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Find item..."
                            autoFocus
                            style={{
                                width: '100%', padding: '8px 12px 8px 36px',
                                background: 'var(--color-bg-secondary)',
                                border: '1px solid transparent', // Cleaner look
                                borderRadius: '10px',
                                color: 'var(--color-text-main)',
                                fontSize: '0.9rem',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>

                {/* Table Content */}
                <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0', background: 'var(--color-bg-surface)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--color-bg-surface)', zIndex: 10, borderBottom: '1px solid var(--color-border)' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Item</th>
                                <th style={{ textAlign: 'center', padding: '10px 4px', color: 'var(--color-text-muted)', width: '80px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price</th>
                                <th style={{ textAlign: 'center', padding: '10px 16px', color: 'var(--color-text-muted)', width: '80px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stock</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredList.map(item => {
                                const isDirty = changedIds.has(item.id);
                                const isLowStock = item.trackStock !== false && item.stock <= 5;
                                const shouldHighlight = highlightLowStock && isLowStock;

                                return (
                                    <tr key={item.id} style={{
                                        borderBottom: '1px solid var(--color-border)',
                                        height: '60px',
                                        backgroundColor: shouldHighlight ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                                        transition: 'background-color 0.3s ease'
                                    }}>
                                        <td style={{ padding: '0 16px', maxWidth: '180px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.category}</div>
                                                </div>
                                                {isLowStock && (
                                                    <div style={{
                                                        padding: '2px 6px',
                                                        backgroundColor: '#fee2e2',
                                                        color: '#ef4444',
                                                        borderRadius: '4px',
                                                        fontSize: '0.65rem',
                                                        fontWeight: 700,
                                                        textTransform: 'uppercase',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        Low Stock
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '0 4px', verticalAlign: 'middle' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-secondary)', borderRadius: '8px', padding: '2px', height: '36px' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '4px' }}>₹</span>
                                                <input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={(e) => handleChange(item.id, 'price', e.target.value)}
                                                    style={{
                                                        width: '100%', textAlign: 'center',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: isDirty ? 'var(--color-primary)' : 'var(--color-text-main)',
                                                        fontWeight: 600,
                                                        fontSize: '0.95rem',
                                                        outline: 'none',
                                                        height: '100%',
                                                        paddingRight: '4px'
                                                    }}
                                                />
                                            </div>
                                        </td>
                                        <td style={{ padding: '0 16px 0 4px', verticalAlign: 'middle' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.trackStock === false ? 'transparent' : 'var(--color-bg-secondary)', borderRadius: '8px', padding: '2px', height: '36px', border: item.trackStock === false ? '1px dashed var(--color-border)' : 'none' }}>
                                                <input
                                                    type="number"
                                                    value={item.trackStock === false ? '' : item.stock}
                                                    placeholder={item.trackStock === false ? '∞' : '0'}
                                                    disabled={item.trackStock === false}
                                                    onChange={(e) => handleChange(item.id, 'stock', e.target.value)}
                                                    style={{
                                                        width: '100%', textAlign: 'center',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: item.trackStock === false ? 'var(--color-text-muted)' : (isDirty ? 'var(--color-primary)' : 'var(--color-text-main)'),
                                                        opacity: item.trackStock === false ? 0.5 : 1,
                                                        fontWeight: 700,
                                                        fontSize: '0.95rem',
                                                        outline: 'none',
                                                        height: '100%'
                                                    }}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer Save Action */}
                <div style={{ padding: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '12px', background: 'var(--color-bg-surface)' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={changedIds.size === 0 || isSaving}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: changedIds.size > 0 ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                            color: changedIds.size > 0 ? 'white' : 'var(--color-text-muted)',
                            border: 'none', borderRadius: '12px', fontWeight: 700,
                            cursor: changedIds.size > 0 ? 'pointer' : 'not-allowed',
                            boxShadow: changedIds.size > 0 ? '0 4px 12px rgba(var(--color-primary-rgb), 0.3)' : 'none',
                            opacity: (changedIds.size === 0 && !isSaving) ? 0.7 : 1,
                            transition: 'all 0.2s'
                        }}
                    >
                        {isSaving ? 'Saving...' : `Save Changes`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkEditModal;
