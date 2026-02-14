import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Camera, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../../../context/useAuth';

export const InventoryCard = React.memo(({ item, isMobile, onEdit, onDelete, onQuickImageEdit }) => {
    const { role } = useAuth();
    const canEdit = role === 'admin' || role === 'staff';

    // --- Mobile Card ---
    if (isMobile) {
        return (
            <div className="inventory-card-item">
                <div className="card card-hover" style={{
                    padding: '12px',
                    display: 'flex', flexDirection: 'column', gap: '10px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '20px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                    position: 'relative'
                }}>
                    {/* Image/Emoji Area */}
                    <div
                        onClick={() => onQuickImageEdit(item)}
                        style={{
                            height: '110px',
                            width: '100%',
                            borderRadius: '16px',
                            background: 'var(--color-bg-secondary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden',
                            position: 'relative',
                            cursor: 'pointer'
                        }}
                    >
                        {item.image && item.image.length > 5 ? (
                            <img
                                src={item.image}
                                alt={item.name}
                                loading="lazy"
                                style={{
                                    width: '100%', height: '100%',
                                    objectFit: item.imageFit || 'cover',
                                    transform: `scale(${item.imageZoom || 1})`,
                                    transition: 'transform 0.2s'
                                }}
                            />
                        ) : (
                            <span style={{ fontSize: '2.5rem', transform: `scale(${item.imageZoom || 1})` }}>{item.image || '📦'}</span>
                        )}

                        {/* Edit Icon Overlay */}
                        <div
                            className="hover-edit"
                            style={{
                                position: 'absolute', inset: 0,
                                background: 'rgba(0,0,0,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: 0, transition: 'opacity 0.2s',
                                borderRadius: '16px'
                            }}
                        >
                            <Camera size={28} color="white" />
                        </div>
                    </div>

                    {/* Content Area */}
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)', marginBottom: '2px' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>{item.category}</div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
                                {item.variants && item.variants.length > 0
                                    ? `₹${Math.min(...item.variants.map(v => v.price))} - ₹${Math.max(...item.variants.map(v => v.price))}`
                                    : `₹${item.price}`}
                            </div>
                            <div style={{
                                fontSize: '0.75rem',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                background: !item.trackStock ? 'rgba(34, 197, 94, 0.1)' : ((item.stock < 5 && (!item.variants || item.variants.length === 0)) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)'),
                                color: !item.trackStock ? '#22c55e' : ((item.stock < 5 && (!item.variants || item.variants.length === 0)) ? '#ef4444' : '#22c55e'),
                                fontWeight: 700
                            }}>
                                {!item.trackStock ? 'Available' : (item.variants && item.variants.length > 0 ? `${item.variants.length} Options` : `${item.stock} left`)}
                            </div>
                        </div>
                    </div>

                    {/* Actions Bar */}
                    {canEdit && (
                        <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
                            <button
                                onClick={() => onEdit(item)}
                                style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', justifyContent: 'center', transition: 'all 0.2s' }}
                                className="hover-bg-muted"
                            >
                                <Edit2 size={18} color="var(--color-text-primary)" />
                            </button>
                            <button
                                onClick={() => onDelete(item)}
                                style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- Desktop Grid Card ---
    return (
        <div className="card card-hover" style={{
            padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', opacity: 1,
            background: 'var(--color-bg-glass-input)', backdropFilter: 'blur(12px)',
            border: '1px solid var(--color-border)', borderRadius: '16px'
        }}>
            <div
                onClick={() => onQuickImageEdit(item)}
                style={{
                    height: '100px', width: '100%', borderRadius: '12px', background: 'var(--color-bg-secondary)',
                    overflow: 'hidden', position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: `${item.imagePadding || 0}px`
                }}
            >
                {item.image && item.image.length > 5 ? (
                    <img
                        src={item.image}
                        alt={item.name}
                        style={{
                            width: '100%', height: '100%',
                            objectFit: item.imageFit || 'cover',
                            transform: `scale(${item.imageZoom || 1})`,
                            transition: 'transform 0.2s'
                        }}
                    />
                ) : (
                    <span style={{ fontSize: '2rem', transform: `scale(${item.imageZoom || 1})` }}>
                        {item.image || <UtensilsCrossed size={24} color="var(--color-text-muted)" />}
                    </span>
                )}
                <div className="hover-edit" style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(2px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.2s'
                }}>
                    <Camera size={32} color="white" />
                </div>
            </div>
            <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.category}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {item.variants && item.variants.length > 0
                        ? `₹${Math.min(...item.variants.map(v => v.price))} - ₹${Math.max(...item.variants.map(v => v.price))}`
                        : `₹${item.price}`}
                </div>
                <div style={{
                    fontSize: '0.7rem', padding: '2px 6px', borderRadius: '8px',
                    background: !item.trackStock ? '#e8f5e9' : ((item.stock < 5 && (!item.variants || item.variants.length === 0)) ? '#ffebee' : '#e8f5e9'),
                    color: !item.trackStock ? '#2e7d32' : ((item.stock < 5 && (!item.variants || item.variants.length === 0)) ? '#c62828' : '#2e7d32'),
                    fontWeight: 600
                }}>
                    {!item.trackStock ? 'In Stock' : (item.variants && item.variants.length > 0 ? `${item.variants.length} options` : `${item.stock} left`)}
                </div>
            </div>
            {canEdit && (
                <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
                    <button onClick={() => onEdit(item)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: 'var(--color-bg-surface)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}><Edit2 size={18} color="var(--color-text-primary)" /></button>
                    <button onClick={() => onDelete(item)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(255,0,0,0.1)', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}><Trash2 size={18} /></button>
                </div>
            )}
        </div>
    );
});
