import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Save } from 'lucide-react';
import Modal from './Modal';
import { toTitleCase, getSmartEmoji } from '../utils/smartHelpers';

const ProductModal = ({ isOpen, onClose, onSave, initialItem, mode = 'add' }) => {

    const [item, setItem] = useState({
        name: '',
        category: 'Snacks',
        price: '',
        stock: 10,
        image: '',
        imageFit: 'cover',
        imagePadding: 0
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    // Load initial item when modal opens
    useEffect(() => {
        if (isOpen && initialItem) {
            setItem({
                ...initialItem,
                name: initialItem.name || '',
                category: initialItem.category || 'Snacks',
                price: initialItem.price || '',
                stock: initialItem.stock !== undefined ? initialItem.stock : 10,
                image: initialItem.image || '',
                imageFit: initialItem.imageFit || 'cover',
                imagePadding: initialItem.imagePadding || 0
            });
            setSelectedFile(null);
        }
    }, [isOpen, initialItem]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            // Create preview immediately
            setItem(prev => ({ ...prev, image: URL.createObjectURL(file) }));
        }
    };

    const triggerImageUpload = () => fileInputRef.current.click();

    const handleSaveClick = () => {
        if (!item.name || !item.price) {
            alert("Please fill in Name and Price");
            return;
        }

        const formattedName = toTitleCase(item.name);

        // Smart Emoji logic: If no file selected AND no existing image string (or it's just the old emoji/placeholder)
        // We accept if item.image is a long URL (upload) or data URI. If it's short, it might be an old emoji.
        // Simplified: If user didn't explicitly upload a file, and the current image is empty or just generic, try to smart gen.
        // Actually, let's trust the current `item.image` unless it's empty.

        let finalImage = item.image;
        if (!finalImage || finalImage.length < 5) { // < 5 means likely just an emoji or empty
            finalImage = getSmartEmoji(formattedName, item.category);
        }

        // If there's a selected file, the parent component might ideally handle the upload logic (e.g. to Firebase),
        // but for this local-only version, we'll convert to Base64 or Blob URL here/parent.
        // Since we already set preview URL in handleFileChange, we pass that. 
        // NOTE: In a real app, `onSave` should handle the async upload. 
        // We will pass the `selectedFile` object up just in case.

        const productData = {
            ...item,
            name: formattedName,
            image: finalImage
        };

        onSave(productData, selectedFile);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={mode === 'add' ? 'Add New Item' : 'Edit Item'}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* --- Image Section --- */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                    <div
                        onPaste={(e) => {
                            const items = e.clipboardData.items;
                            for (let i = 0; i < items.length; i++) {
                                if (items[i].type.indexOf('image') !== -1) {
                                    const file = items[i].getAsFile();
                                    setSelectedFile(file);
                                    setItem(prev => ({ ...prev, image: URL.createObjectURL(file) }));
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
                            overflow: 'hidden', position: 'relative',
                            outline: 'none',
                            padding: `${item.imagePadding || 0}px`
                        }}
                    >
                        {item.image && item.image.length > 5 ? (
                            <img
                                src={item.image}
                                alt="Preview"
                                onClick={(e) => e.stopPropagation()} // Prevent clicks on image from doing anything
                                style={{
                                    width: '100%', height: '100%',
                                    objectFit: item.imageFit || 'cover',
                                    borderRadius: item.imagePadding ? '8px' : '0'
                                }}
                            />
                        ) : item.image ? (
                            <span style={{ fontSize: '2.5rem' }}>{item.image}</span>
                        ) : (
                            <Camera size={28} color="var(--color-text-muted)" />
                        )}
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                triggerImageUpload();
                            }}
                            style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                background: 'rgba(0,0,0,0.7)', color: 'white',
                                fontSize: '0.7rem', padding: '6px', textAlign: 'center',
                                cursor: 'pointer',
                                fontWeight: 600,
                                backdropFilter: 'blur(4px)'
                            }}
                        >
                            Tap to Change
                        </div>
                    </div>

                    {/* Image Controls */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', background: 'var(--color-bg-secondary)', borderRadius: '8px', padding: '2px' }}>
                            <button
                                type="button"
                                onClick={() => setItem(prev => ({ ...prev, imageFit: 'cover' }))}
                                style={{
                                    padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem',
                                    background: (item.imageFit || 'cover') === 'cover' ? 'var(--color-bg-surface)' : 'transparent',
                                    color: (item.imageFit || 'cover') === 'cover' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                    boxShadow: (item.imageFit || 'cover') === 'cover' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >Fill</button>
                            <button
                                type="button"
                                onClick={() => setItem(prev => ({ ...prev, imageFit: 'contain' }))}
                                style={{
                                    padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem',
                                    background: item.imageFit === 'contain' ? 'var(--color-bg-surface)' : 'transparent',
                                    color: item.imageFit === 'contain' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                    boxShadow: item.imageFit === 'contain' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >Fit</button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Zoom</span>
                            <input
                                type="range"
                                min="0" max="30" step="5"
                                value={item.imagePadding || 0}
                                onChange={(e) => setItem(prev => ({ ...prev, imagePadding: Number(e.target.value) }))}
                                style={{ width: '60px', accentColor: 'var(--color-primary)' }}
                            />
                        </div>
                    </div>
                </div>

                {/* --- Inputs --- */}

                {/* Name */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '6px' }}>Item Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Chocolate Cake"
                        value={item.name}
                        onChange={(e) => setItem({ ...item, name: e.target.value })}
                        style={{ width: '100%', padding: '12px', background: 'var(--color-bg-secondary)', border: 'none', borderRadius: '8px', color: 'var(--color-text-primary)' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '6px' }}>Price (₹)</label>
                        <input
                            type="number"
                            placeholder="0"
                            value={item.price}
                            onChange={(e) => setItem({ ...item, price: e.target.value })}
                            style={{ width: '100%', padding: '12px', background: 'var(--color-bg-secondary)', border: 'none', borderRadius: '8px', color: 'var(--color-text-primary)' }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '6px' }}>Stock</label>
                        <input
                            type="number"
                            placeholder="0"
                            value={item.stock}
                            onChange={(e) => setItem({ ...item, stock: e.target.value })}
                            style={{ width: '100%', padding: '12px', background: 'var(--color-bg-secondary)', border: 'none', borderRadius: '8px', color: 'var(--color-text-primary)' }}
                        />
                    </div>
                </div>

                {/* Category */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '6px' }}>Category</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {['Cakes', 'Pastries', 'Snacks', 'Drinks', 'General'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setItem({ ...item, category: cat })}
                                style={{
                                    padding: '6px 12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    background: item.category === cat ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                                    color: item.category === cat ? 'white' : 'var(--color-text-primary)'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleSaveClick}
                    style={{
                        marginTop: '20px',
                        width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                        background: 'var(--color-primary)', color: 'white', fontSize: '1rem', fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                >
                    <Save size={20} /> {mode === 'add' ? 'Add Item' : 'Save Changes'}
                </button>
            </div>
        </Modal>
    );
};

export default ProductModal;
