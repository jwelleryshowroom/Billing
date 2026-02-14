import React, { Suspense, useState } from 'react';
import { Plus, X, Camera, Save, AlertTriangle, Smile } from 'lucide-react';
import Modal from '../../../components/Modal';

// Lazy load Image Reviewer
const ImageReviewer = React.lazy(() => import('../../../components/ImageReviewer'));

// --- Helper Functions (Moved from Inventory.jsx if not used elsewhere) ---
// Note: These could be props if we want to keep logic in hook, or local if specific to modal.
// Given strict "No Feature Loss" and they manipulate currentItem, passing them as props from a hook is best.

const AddEditProductModal = ({
    isOpen,
    onClose,
    mode,
    currentItem,
    setCurrentItem, // Needed for direct field updates
    onSave, // handleSaveItem
    fileInputRef,
    onFileChange,
    triggerImageUpload,
    selectedFile,
    setSelectedFile,
    handleImageProcessed,
    suggestedEmoji,
    // Variant Actions from Hook
    addVariant,
    removeVariant,
    updateVariant,
    updateVariantSplit,
    addSmartVariant,
    categories
}) => {

    // Derived Helpers (Non-State)
    const UNIT_Options = ['Pound', 'Kg', 'Gm', 'Litre', 'Ml', 'Pcs'];

    const [isEmojiInput, setIsEmojiInput] = useState(false);

    const parseVariantName = (name) => {
        if (!name) return { value: '', unit: 'Pound' };
        const match = name.match(/([\d\./]+)\s*(.*)/);
        if (match) return { value: match[1], unit: match[2] || 'Pound' };
        return { value: name, unit: 'Pound' };
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={mode === 'add' ? 'Add New Item' : 'Edit Item'}>
                {currentItem && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* Image Preview / Upload */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                            <div
                                onClick={!isEmojiInput ? triggerImageUpload : undefined}
                                onPaste={(e) => {
                                    if (isEmojiInput) return; // Allow normal paste in input
                                    const items = e.clipboardData.items;
                                    for (let i = 0; i < items.length; i++) {
                                        if (items[i].type.indexOf('image') !== -1) {
                                            const file = items[i].getAsFile();
                                            setSelectedFile(file);
                                            e.preventDefault();
                                            break;
                                        }
                                    }
                                }}
                                tabIndex={0}
                                style={{
                                    width: '120px', height: '120px',
                                    borderRadius: '16px',
                                    background: `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ib3BhY2l0eTogMC4xIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiM1NTUiIC8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiM1NTUiIC8+PC9zdmc+'), #fff`,
                                    backgroundSize: '20px 20px',
                                    border: '2px dashed var(--color-border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: isEmojiInput ? 'text' : 'pointer',
                                    overflow: 'hidden', position: 'relative',
                                    outline: 'none',
                                }}
                            >
                                {isEmojiInput ? (
                                    <input
                                        autoFocus
                                        value={currentItem.image && currentItem.image.length <= 5 ? currentItem.image : ''}
                                        placeholder="☺"
                                        onChange={(e) => setCurrentItem(prev => ({ ...prev, image: e.target.value }))}
                                        onBlur={() => setIsEmojiInput(false)}
                                        maxLength={5}
                                        style={{
                                            fontSize: '3.5rem',
                                            width: '100%',
                                            height: '100%',
                                            textAlign: 'center',
                                            border: 'none',
                                            background: 'transparent',
                                            outline: 'none',
                                            caretColor: 'var(--color-primary)'
                                        }}
                                    />
                                ) : (
                                    <>
                                        {currentItem.image && currentItem.image.length > 5 ? (
                                            <img
                                                src={currentItem.image}
                                                alt="Preview"
                                                style={{
                                                    width: '100%', height: '100%',
                                                    objectFit: currentItem.imageFit || 'cover',
                                                    transform: `scale(${currentItem.imageZoom || 1})`,
                                                    transition: 'transform 0.2s'
                                                }}
                                            />
                                        ) : currentItem.image ? (
                                            <span style={{ fontSize: '2.5rem', transform: `scale(${currentItem.imageZoom || 1})` }}>{currentItem.image}</span>
                                        ) : (
                                            <div style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center',
                                                padding: '12px', background: 'rgba(255, 255, 255, 0.85)', borderRadius: '12px',
                                                width: '85%', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }}>
                                                <Camera size={24} color="var(--color-primary)" />
                                                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-main)', fontWeight: 700, lineHeight: 1.2 }}>
                                                    Upload<br />or Paste Image
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Overlay Edit Button (visible on hover or always for touch) */}
                                {!isEmojiInput && !currentItem.image && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsEmojiInput(true);
                                        }}
                                        style={{
                                            position: 'absolute', bottom: '4px', right: '4px',
                                            padding: '4px', borderRadius: '50%', border: 'none',
                                            background: 'var(--color-bg-surface)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                            cursor: 'pointer', color: 'var(--color-text-muted)'
                                        }}
                                        title="Use Emoji"
                                    >
                                        <Smile size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Suggested Emoji */}
                            {suggestedEmoji && (!currentItem.image || currentItem.image.length < 5) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeIn 0.3s ease-out' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Try:</span>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentItem(prev => ({ ...prev, image: suggestedEmoji }))}
                                        style={{
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            border: '1px solid var(--color-primary)',
                                            background: 'rgba(76, 175, 80, 0.1)',
                                            color: 'var(--color-primary)',
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <span>{suggestedEmoji}</span>
                                        <Plus size={14} />
                                    </button>
                                </div>
                            )}

                            {/* Image Controls */}
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                                <div style={{ display: 'flex', background: 'var(--color-bg-secondary)', borderRadius: '8px', padding: '2px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsEmojiInput(true)}
                                        style={{
                                            padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem',
                                            background: isEmojiInput ? 'var(--color-bg-surface)' : 'transparent',
                                            color: isEmojiInput ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                            boxShadow: isEmojiInput ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                            display: 'flex', alignItems: 'center', gap: '4px'
                                        }}
                                        title="Use Emoji"
                                    >
                                        <Smile size={14} /> Emoji
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentItem(prev => ({ ...prev, imageFit: 'cover' }))}
                                        style={{
                                            padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem',
                                            background: (currentItem.imageFit || 'cover') === 'cover' ? 'var(--color-bg-surface)' : 'transparent',
                                            color: (currentItem.imageFit || 'cover') === 'cover' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                            boxShadow: (currentItem.imageFit || 'cover') === 'cover' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                        }}
                                    >Fill</button>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentItem(prev => ({ ...prev, imageFit: 'contain' }))}
                                        style={{
                                            padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem',
                                            background: currentItem.imageFit === 'contain' ? 'var(--color-bg-surface)' : 'transparent',
                                            color: currentItem.imageFit === 'contain' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                            boxShadow: currentItem.imageFit === 'contain' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                        }}
                                    >Fit</button>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Zoom</span>
                                    <input
                                        type="range"
                                        min="0.5" max="2.0" step="0.1"
                                        value={currentItem.imageZoom || 1.0}
                                        onChange={(e) => setCurrentItem(prev => ({ ...prev, imageZoom: parseFloat(e.target.value) }))}
                                        style={{ width: '60px', accentColor: 'var(--color-primary)' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Item Name</label>
                                <div
                                    onClick={() => setCurrentItem(prev => ({ ...prev, trackStock: !prev.trackStock }))}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                                        padding: '4px 10px', borderRadius: '12px',
                                        background: currentItem.trackStock ? 'rgba(34, 197, 94, 0.1)' : 'rgba(0,0,0,0.05)',
                                        border: `1px solid ${currentItem.trackStock ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                        transition: 'all 0.2s', userSelect: 'none'
                                    }}
                                >
                                    <div style={{
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        background: currentItem.trackStock ? 'var(--color-primary)' : '#9ca3af'
                                    }}></div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: currentItem.trackStock ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                                        {currentItem.trackStock ? 'STOCK TRACKING ON' : 'TRACKING OFF'}
                                    </span>
                                </div>
                            </div>
                            <input
                                value={currentItem.name}
                                onChange={e => setCurrentItem({ ...currentItem, name: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-glass-input)', color: 'var(--color-text-primary)' }}
                                placeholder="e.g. Chocolate Truffle"
                            />
                        </div>

                        {/* Variants Toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Pricing Type</label>
                            <div style={{ display: 'flex', background: 'var(--color-bg-secondary)', borderRadius: '8px', padding: '2px' }}>
                                <button
                                    onClick={() => setCurrentItem(prev => ({ ...prev, variants: [] }))}
                                    style={{
                                        padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem',
                                        background: (!currentItem.variants || currentItem.variants.length === 0) ? 'var(--color-bg-surface)' : 'transparent',
                                        color: (!currentItem.variants || currentItem.variants.length === 0) ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                        boxShadow: (!currentItem.variants || currentItem.variants.length === 0) ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                    }}
                                >Standard</button>
                                <button
                                    onClick={() => setCurrentItem(prev => ({ ...prev, variants: [{ id: Date.now().toString(), name: '1 Pound', price: '', stock: '' }] }))}
                                    style={{
                                        padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem',
                                        background: (currentItem.variants && currentItem.variants.length > 0) ? 'var(--color-bg-surface)' : 'transparent',
                                        color: (currentItem.variants && currentItem.variants.length > 0) ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                        boxShadow: (currentItem.variants && currentItem.variants.length > 0) ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                    }}
                                >Variants</button>
                            </div>
                        </div>

                        {currentItem.variants && currentItem.variants.length > 0 ? (
                            // VARIANTS EDITOR
                            <div style={{ background: 'var(--color-bg-secondary)', borderRadius: '12px', padding: '12px' }}>
                                <div style={{ marginBottom: '12px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px', display: 'block' }}>QUICK ADD PRESETS</span>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {['1/2', '1', '2', '500', '1000'].map(val => (
                                            <button
                                                key={val}
                                                type="button"
                                                onClick={() => addSmartVariant(val)}
                                                style={{
                                                    padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                                    background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)',
                                                    fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                                }}
                                            >
                                                <Plus size={12} /> {val}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>OPTIONS LIST</span>
                                    <button onClick={() => addSmartVariant('Custom')} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                                        <Plus size={14} /> Custom
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {currentItem.variants.map((variant, index) => {
                                        const { value, unit } = parseVariantName(variant.name);
                                        return (
                                            <div key={variant.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr 0.8fr 24px', gap: '6px', alignItems: 'center' }}>
                                                {/* Value */}
                                                <input
                                                    placeholder="Val"
                                                    value={value}
                                                    onChange={(e) => updateVariantSplit(variant.id, 'value', e.target.value)}
                                                    style={{ minWidth: 0, padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.85rem', background: 'var(--color-bg-glass-input)', color: 'var(--color-text-primary)' }}
                                                />
                                                {/* Unit */}
                                                <select
                                                    value={unit}
                                                    onChange={(e) => updateVariantSplit(variant.id, 'unit', e.target.value)}
                                                    style={{ minWidth: 0, padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.85rem', background: 'var(--color-bg-glass-input)', color: 'var(--color-text-primary)' }}
                                                >
                                                    {UNIT_Options.map(u => <option key={u} value={u}>{u}</option>)}
                                                </select>

                                                {/* Price */}
                                                <input
                                                    type="number"
                                                    placeholder="₹"
                                                    value={variant.price}
                                                    onChange={(e) => updateVariant(variant.id, 'price', e.target.value)}
                                                    style={{ minWidth: 0, padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.85rem', background: 'var(--color-bg-glass-input)', color: 'var(--color-text-primary)' }}
                                                />
                                                {/* Stock */}
                                                <input
                                                    type="number"
                                                    placeholder="Qty"
                                                    value={variant.stock}
                                                    disabled={!currentItem.trackStock}
                                                    onChange={(e) => updateVariant(variant.id, 'stock', e.target.value)}
                                                    style={{
                                                        minWidth: 0, padding: '8px', borderRadius: '6px',
                                                        border: '1px solid var(--color-border)', fontSize: '0.85rem',
                                                        background: currentItem.trackStock ? 'var(--color-bg-glass-input)' : 'rgba(0,0,0,0.03)',
                                                        color: currentItem.trackStock ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                                        opacity: currentItem.trackStock ? 1 : 0.6,
                                                        cursor: currentItem.trackStock ? 'text' : 'not-allowed'
                                                    }}
                                                />
                                                <button
                                                    onClick={() => removeVariant(variant.id)}
                                                    style={{ padding: '4px', borderRadius: '6px', border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            // STANDARD PRICE / STOCK
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '6px' }}>Price (₹)</label>
                                    <input
                                        type="number"
                                        value={currentItem.price}
                                        onChange={e => setCurrentItem({ ...currentItem, price: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-glass-input)', color: 'var(--color-text-primary)' }}
                                        placeholder="0"
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '6px' }}>Stock Qty</label>
                                    <input
                                        type="number"
                                        value={currentItem.stock}
                                        disabled={!currentItem.trackStock}
                                        onChange={e => setCurrentItem({ ...currentItem, stock: e.target.value })}
                                        style={{
                                            width: '100%', padding: '12px', borderRadius: '8px',
                                            border: '1px solid var(--color-border)',
                                            background: currentItem.trackStock ? 'var(--color-bg-glass-input)' : 'rgba(0,0,0,0.03)',
                                            color: currentItem.trackStock ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                            opacity: currentItem.trackStock ? 1 : 0.6,
                                            cursor: currentItem.trackStock ? 'text' : 'not-allowed'
                                        }}
                                        placeholder={currentItem.trackStock ? "0" : "Unlimited"}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Category */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '6px' }}>Category</label>
                            <input
                                value={currentItem.category}
                                onChange={e => setCurrentItem({ ...currentItem, category: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-glass-input)', color: 'var(--color-text-primary)', marginBottom: '8px' }}
                                placeholder="Type or select category..."
                            />
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {categories.filter(c => c !== 'All').map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCurrentItem({ ...currentItem, category: cat })}
                                        style={{
                                            padding: '4px 12px', borderRadius: '16px', border: '1px solid var(--color-border)',
                                            background: currentItem.category === cat ? 'var(--color-primary)' : 'rgba(0,0,0,0.03)',
                                            color: currentItem.category === cat ? 'white' : 'var(--color-text-muted)',
                                            cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500
                                        }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={onSave}
                            className="btn btn-primary"
                            style={{ padding: '14px', marginTop: '10px', borderRadius: '12px', fontWeight: 700, display: 'flex', justifyContent: 'center', gap: '8px' }}
                        >
                            <Save size={18} /> {mode === 'add' ? 'Create Item' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </Modal>

            {/* Image Editor Modal - Only shows if selectedFile exists */}
            <Modal isOpen={!!selectedFile} onClose={() => { setSelectedFile(null); }} title="Edit Image">
                {selectedFile && (
                    <Suspense fallback={<div className="p-4 text-center">Loading AI...</div>}>
                        <ImageReviewer
                            file={selectedFile}
                            onConfirm={handleImageProcessed}
                            onCancel={() => setSelectedFile(null)}
                        />
                    </Suspense>
                )}
            </Modal>

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={onFileChange}
                accept="image/*"
                style={{ display: 'none' }}
            />
        </>
    );
};

export default AddEditProductModal;
