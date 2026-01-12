import React, { useState, useRef, Suspense, useMemo } from 'react';
import {
    Plus, Edit2, Trash2, UtensilsCrossed, Camera, Image as ImageIcon,
    Loader2, Search, LayoutGrid, List, X, Save, Package, AlertTriangle
} from 'lucide-react';
import Modal from './Modal';
import { useInventory } from '../context/InventoryContext';

// Lazy load the heavy AI component
const ImageReviewer = React.lazy(() => import('./ImageReviewer'));

const Inventory = () => {
    const { items, addItem, updateItem, deleteItem } = useInventory();

    // UI State
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'

    const [currentItem, setCurrentItem] = useState(null); // Item being edited

    // Delete Confirmation State
    const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, itemId: null, itemName: '' });

    // Image Handling State
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    // Categories derived from items + static defaults
    const categories = useMemo(() => {
        const unique = new Set(items.map(i => i.category));
        return ['All', 'Cakes', 'Pastries', 'Snacks', 'Drinks', ...unique];
    }, [items]);

    // Filter Logic
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.category.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [items, searchTerm, selectedCategory]);

    // --- Actions ---

    const toTitleCase = (str) => {
        return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    };

    const getSmartEmoji = (name, category) => {
        const lowerName = name.toLowerCase();
        const lowerCat = category.toLowerCase();
        const keywords = {
            'cake': '🎂', 'pastry': '🍰', 'chocolate': '🍫', 'cookie': '🍪', 'bread': '🍞',
            'sandwich': '🥪', 'burger': '🍔', 'pizza': '🍕', 'fries': '🍟', 'coke': '🥤',
            'coffee': '☕', 'tea': '🫖', 'juice': '🧃', 'ice cream': '🍦', 'donut': '🍩',
            'chicken': '🍗', 'egg': '🥚', 'veg': '🥗', 'water': '💧', 'milk': '🥛'
        };
        for (const key in keywords) { if (lowerName.includes(key)) return keywords[key]; }
        if (lowerCat.includes('cake')) return '🎂';
        if (lowerCat.includes('pastr')) return '🍰';
        if (lowerCat.includes('snack')) return '🍿';
        if (lowerCat.includes('drink')) return '🥤';
        return '📦';
    };

    const handleEditClick = (item) => {
        setCurrentItem({ ...item }); // Clone to avoid direct mutation
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleAddClick = () => {
        setCurrentItem({
            name: '',
            category: 'Cakes',
            price: '',
            stock: 10,
            image: ''
        });
        setModalMode('add');
        setIsModalOpen(true);
    };

    const handleDeleteClick = (item) => {
        setDeleteConfirmation({
            show: true,
            itemId: item.id,
            itemName: item.name
        });
    };

    const confirmDelete = () => {
        if (deleteConfirmation.itemId) {
            deleteItem(deleteConfirmation.itemId);
            setDeleteConfirmation({ show: false, itemId: null, itemName: '' });
        }
    };

    const handleSaveItem = () => {
        if (!currentItem.name || !currentItem.price) {
            alert("Name and Price are required!");
            return;
        }

        const itemData = {
            ...currentItem,
            name: toTitleCase(currentItem.name), // Auto-Format
            price: parseFloat(currentItem.price),
            stock: parseInt(currentItem.stock) || 0,
            image: currentItem.image || getSmartEmoji(currentItem.name, currentItem.category) // Smart Emoji
        };

        if (modalMode === 'add') {
            addItem({ ...itemData, id: Date.now().toString() });
        } else {
            updateItem(itemData.id, itemData);
        }
        setIsModalOpen(false);
    };

    // Image Handlers
    const triggerImageUpload = () => fileInputRef.current.click();

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleImageProcessed = (base64Image) => {
        setCurrentItem(prev => ({ ...prev, image: base64Image }));
        setSelectedFile(null);
        // If we are NOT in the main modal (e.g. quick edit), we might want to save immediately,
        // but since we are using `currentItem` for both, we assume this happens inside the modal form usually.
        // If image editing was triggered from Grid Card directly (quick update), we need to check:
        if (!isModalOpen && currentItem?.id) {
            updateItem(currentItem.id, { image: base64Image });
        }
    };

    // Quick Image Edit from Card
    const handleQuickImageEdit = (item) => {
        setCurrentItem(item);
        triggerImageUpload();
    };


    return (
        <div className="container" style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            maxWidth: '1200px',
            margin: '0 auto',
            margin: '0 auto'
        }}>

            {/* --- Header Controls (Search etc) --- */}
            <div style={{
                marginBottom: '20px',
                flexShrink: 0,
                padding: '0 20px' // Add horizontal padding to match container
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Menu & Stock</h1>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        {/* View Toggle */}
                        <div style={{ background: 'var(--color-bg-secondary)', borderRadius: '12px', padding: '4px', display: 'flex' }}>
                            <button
                                onClick={() => setViewMode('grid')}
                                style={{
                                    padding: '8px',
                                    borderRadius: '8px',
                                    background: viewMode === 'grid' ? 'var(--color-bg-surface)' : 'transparent',
                                    color: viewMode === 'grid' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                    boxShadow: viewMode === 'grid' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <LayoutGrid size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                style={{
                                    padding: '8px',
                                    borderRadius: '8px',
                                    background: viewMode === 'table' ? 'var(--color-bg-surface)' : 'transparent',
                                    color: viewMode === 'table' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                    boxShadow: viewMode === 'table' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <List size={20} />
                            </button>
                        </div>
                        <button
                            onClick={handleAddClick}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'var(--color-primary)',
                                color: 'var(--color-primary-text)',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                            }}
                        >
                            <Plus size={20} />
                            Add Item
                        </button>
                    </div>
                </div>

                {/* Search & Filter */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 44px',
                                borderRadius: '12px',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-input)',
                                color: 'var(--color-text-main)',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                        />
                    </div>
                    {/* Categories - Horizontal Scroll */}
                    <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', maxWidth: '100%' }}>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    border: '1px solid',
                                    borderColor: selectedCategory === cat ? 'var(--color-primary)' : 'var(--color-border)',
                                    background: selectedCategory === cat ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                                    color: selectedCategory === cat ? 'var(--color-primary-text)' : 'var(--color-text-secondary)',
                                    fontSize: '0.9rem',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                .card-hover { transition: transform 0.2s, box-shadow 0.2s; }
                .card-hover:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.05) !important; }
                .hover-edit:hover { opacity: 1 !important; }
                .responsive-text { display: none; }
                @media (min-width: 600px) { .responsive-text { display: inline; } }
            `}</style>

            {/* --- Hidden File Input --- */}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />

            {/* --- Content Area --- */}

            {
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 120px 20px', minHeight: 0 }}>
                    {filteredItems.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
                            <Package size={64} style={{ opacity: 0.2, marginBottom: '20px' }} />
                            <h3>No items found</h3>
                            <p>Try clearing filters or add a new item.</p>

                            {/* Smart Search: Add Button */}
                            {searchTerm && (
                                <button
                                    onClick={() => {
                                        setCurrentItem({
                                            name: toTitleCase(searchTerm),
                                            category: selectedCategory === 'All' ? 'Snacks' : selectedCategory,
                                            price: '', stock: 10, image: '',
                                            imageFit: 'cover', imagePadding: 0
                                        });
                                        setModalMode('add');
                                        setIsModalOpen(true);
                                    }}
                                    style={{
                                        marginTop: '20px', padding: '10px 24px', borderRadius: '12px',
                                        background: 'var(--color-primary)', color: 'white', border: 'none',
                                        cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                    }}
                                >
                                    <Plus size={18} /> Add "{toTitleCase(searchTerm)}"
                                </button>
                            )}
                        </div>
                    ) : viewMode === 'grid' ? (
                        // GRID VIEW
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                            {filteredItems.map(item => (
                                <div key={item.id} className="card card-hover" style={{
                                    padding: '10px',
                                    display: 'flex', flexDirection: 'column', gap: '8px',
                                    background: 'var(--color-bg-glass-input)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '16px'
                                }}>
                                    <div
                                        onClick={() => handleQuickImageEdit(item)}
                                        tabIndex={0}
                                        style={{
                                            height: '100px', // Fixed smaller height
                                            width: '100%',
                                            borderRadius: '12px',
                                            background: 'var(--color-bg-secondary)',
                                            overflow: 'hidden',
                                            position: 'relative',
                                            cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            padding: `${item.imagePadding || 0}px` // Dynamic Padding
                                        }}
                                    >
                                        {item.image && item.image.length > 5 ? (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                style={{
                                                    width: '100%', height: '100%',
                                                    objectFit: item.imageFit || 'cover', // Dynamic Fit
                                                    borderRadius: item.imagePadding ? '8px' : '0'
                                                }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: '2rem' }}>{item.image || <UtensilsCrossed size={24} color="var(--color-text-muted)" />}</span>
                                        )}

                                        {/* Hover Overlay */}
                                        <div className="hover-edit" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                                            <Camera size={20} color="white" />
                                        </div>
                                        <style>{`.hover-edit:hover { opacity: 1 !important; }`}</style>
                                    </div>

                                    {/* Info */}
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.category}</div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>₹{item.price}</div>
                                        <div style={{
                                            fontSize: '0.7rem',
                                            padding: '2px 6px',
                                            borderRadius: '8px',
                                            background: item.stock < 5 ? '#ffebee' : '#e8f5e9',
                                            color: item.stock < 5 ? '#c62828' : '#2e7d32',
                                            fontWeight: 600
                                        }}>
                                            {item.stock} left
                                        </div>
                                    </div>

                                    {/* Actions - Compact */}
                                    <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
                                        <button onClick={() => handleEditClick(item)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: 'var(--color-bg-surface)', cursor: 'pointer', display: 'flex', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                            <Edit2 size={18} color="var(--color-text-primary)" />
                                        </button>
                                        <button onClick={() => handleDeleteClick(item)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(255,0,0,0.1)', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // TABLE VIEW
                        <div className="table-responsive" style={{ background: 'var(--color-bg-glass-input)', backdropFilter: 'blur(12px)', borderRadius: '12px', border: '1px solid var(--color-border)', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{
                                    background: 'var(--color-bg-surface)', // Fixed: Solid background
                                    borderBottom: '1px solid var(--color-border)',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 10
                                }}>
                                    <tr>
                                        <th style={{ padding: '16px' }}>Item</th>
                                        <th style={{ padding: '16px' }}>Category</th>
                                        <th style={{ padding: '16px' }}>Price</th>
                                        <th style={{ padding: '16px' }}>Stock</th>
                                        <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.map(item => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--color-bg-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {item.image && item.image.length > 5 ? (
                                                        <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <span>{item.image || <UtensilsCrossed size={16} />}</span>
                                                    )}
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{item.name}</span>
                                            </td>
                                            <td style={{ padding: '16px', color: 'var(--color-text-muted)' }}>{item.category}</td>
                                            <td style={{ padding: '16px', fontWeight: 600 }}>₹{item.price}</td>
                                            <td style={{ padding: '16px' }}>
                                                <span style={{
                                                    fontSize: '0.85rem', padding: '4px 8px', borderRadius: '12px',
                                                    background: item.stock < 5 ? '#ffebee' : '#e8f5e9',
                                                    color: item.stock < 5 ? '#c62828' : '#2e7d32', fontWeight: 600
                                                }}>
                                                    {item.stock}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                    <button onClick={() => handleEditClick(item)} className="icon-btn"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDeleteClick(item)} className="icon-btn" style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            }

            {/* --- Modals --- */}

            {/* ADD / EDIT ITEM MODAL */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'add' ? 'Add New Item' : 'Edit Item'}>
                {currentItem && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* Image Preview / Upload */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                            <div
                                onClick={triggerImageUpload}
                                onPaste={(e) => {
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
                                    background: 'var(--color-bg-secondary)',
                                    border: '2px dashed var(--color-border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', overflow: 'hidden', position: 'relative',
                                    outline: 'none',
                                    padding: `${currentItem.imagePadding || 0}px` // Apply padding
                                }}
                            >
                                {currentItem.image && currentItem.image.length > 5 ? (
                                    <img
                                        src={currentItem.image}
                                        alt="Preview"
                                        style={{
                                            width: '100%', height: '100%',
                                            objectFit: currentItem.imageFit || 'cover', // Apply fit
                                            borderRadius: currentItem.imagePadding ? '8px' : '0'
                                        }}
                                    />
                                ) : currentItem.image ? (
                                    <span style={{ fontSize: '2.5rem' }}>{currentItem.image}</span>
                                ) : (
                                    <Camera size={28} color="var(--color-text-muted)" />
                                )}
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.6rem', padding: '2px', textAlign: 'center' }}>
                                    Tap or Paste Image
                                </div>
                            </div>

                            {/* Image Controls */}
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                                {/* Fit Toggle */}
                                <div style={{ display: 'flex', background: 'var(--color-bg-secondary)', borderRadius: '8px', padding: '2px' }}>
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
                                {/* Padding Slider */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Zoom</span>
                                    <input
                                        type="range"
                                        min="0" max="30" step="5"
                                        value={currentItem.imagePadding || 0}
                                        onChange={(e) => setCurrentItem(prev => ({ ...prev, imagePadding: Number(e.target.value) }))}
                                        style={{ width: '60px', accentColor: 'var(--color-primary)' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '6px' }}>Item Name</label>
                            <input
                                value={currentItem.name}
                                onChange={e => setCurrentItem({ ...currentItem, name: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-glass-input)', color: 'var(--color-text-primary)' }}
                                placeholder="e.g. Chocolate Truffle"
                            />
                        </div>

                        {/* Row: Price & Stock */}
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
                                    onChange={e => setCurrentItem({ ...currentItem, stock: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-glass-input)', color: 'var(--color-text-primary)' }}
                                    placeholder="0"
                                />
                            </div>
                        </div>

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
                                {Array.from(new Set(['Cakes', 'Pastries', 'Snacks', 'Drinks', ...categories])).map(cat => (
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
                            onClick={handleSaveItem}
                            className="btn btn-primary"
                            style={{ padding: '14px', marginTop: '10px', borderRadius: '12px', fontWeight: 700, display: 'flex', justifyContent: 'center', gap: '8px' }}
                        >
                            <Save size={18} /> {modalMode === 'add' ? 'Create Item' : 'Save Changes'}
                        </button>

                    </div>
                )}
            </Modal>

            {/* Hidden: Image Editor Modal (reused from logic) */}
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

            {/* Delete Confirmation Modal */}
            {
                deleteConfirmation.show && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 10000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div className="glass" style={{
                            width: '85%', maxWidth: '320px', padding: '24px',
                            borderRadius: '24px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                            textAlign: 'center',
                            background: 'rgba(255, 255, 255, 0.1)' // Fallback glass
                        }}>
                            <div style={{ color: 'var(--color-danger)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                                <AlertTriangle size={48} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 700, color: 'var(--color-text-main)' }}>Delete Item?</h3>
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px', lineHeight: 1.5, fontSize: '0.95rem' }}>
                                Are you sure you want to delete <span style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>"{deleteConfirmation.itemName}"</span>? This action cannot be undone.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setDeleteConfirmation({ show: false, itemId: null, itemName: '' })}
                                    className="btn"
                                    style={{
                                        flex: 1,
                                        backgroundColor: 'rgba(0,0,0,0.05)',
                                        color: 'var(--color-text-main)',
                                        borderRadius: '12px',
                                        padding: '12px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="btn"
                                    style={{
                                        flex: 1,
                                        backgroundColor: 'var(--color-danger)',
                                        color: 'white',
                                        borderRadius: '12px',
                                        padding: '12px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Inventory;
