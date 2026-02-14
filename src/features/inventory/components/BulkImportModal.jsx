import React, { useState, useRef } from 'react';
import { Download, Upload, FileText, CheckCircle2, AlertTriangle, X, Check } from 'lucide-react';
import { useInventory } from '../../../context/InventoryContext';
import { triggerHaptic } from '../../../utils/haptics';

const BulkImportModal = ({ isOpen, onClose }) => {
    const { addItem, updateItem, items } = useInventory(); // [CHANGED] Get existing items & update fn
    const [step, setStep] = useState('upload'); // 'upload', 'preview', 'importing', 'success'
    const [parsedData, setParsedData] = useState([]);
    const [fileError, setFileError] = useState('');
    const [progress, setProgress] = useState(0);
    const [skipDuplicates, setSkipDuplicates] = useState(true); // [NEW] Toggle state
    const fileInputRef = useRef(null);

    // 1. Template Download
    const downloadTemplate = () => {
        const headers = ['Name,Price,Category,Stock'];
        const rows = [
            'Chocolate Cake,500,Cakes,10',
            'Samosa,15,Snacks,Unlimited',
            'Vanilla Pastry,80,Pastries,20'
        ];
        const csvContent = headers.concat(rows).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'classic_confection_template.csv';
        link.click();
        triggerHaptic('light');
    };

    // 2. File Parsing
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            setFileError('Please upload a valid CSV file.');
            return;
        }

        setFileError('');
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            parseCSV(text);
        };
        reader.readAsText(file);
    };

    const parseCSV = (text) => {
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].toLowerCase().split(',');

        // Simple Validation
        if (!headers.includes('name') || !headers.includes('price')) {
            setFileError('Invalid CSV format. Missing "Name" or "Price" columns.');
            return;
        }

        const newItems = [];
        const existingNames = new Set(items.map(i => i.name.toLowerCase().trim())); // [NEW] Index existing names

        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split(',');
            if (row.length < 2) continue; // Skip empty rows

            const name = row[0]?.trim() || '';
            const price = parseFloat(row[1]?.trim()) || 0;
            const category = row[2]?.trim() || 'General';

            const rawStock = (row[3] || '').trim().toLowerCase();
            const isUnlimited = rawStock === 'unlimited' || rawStock === 'inf' || rawStock === 'infinity' || rawStock === '';
            const stockValue = isUnlimited ? 0 : (parseInt(rawStock) || 0);

            const isDuplicate = existingNames.has(name.toLowerCase());

            const item = {
                name, price, category,
                stock: stockValue,
                trackStock: !isUnlimited,
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                isDuplicate
            };

            if (name && price > 0) {
                newItems.push(item);
            }
        }

        if (newItems.length === 0) {
            setFileError('No valid items found in file.');
        } else {
            setParsedData(newItems);
            setStep('preview');
            triggerHaptic('success');
        }
    };

    // 3. Import Process
    const processImport = async () => {
        setStep('importing');
        setProgress(0);

        // Filter items based on user choice
        // If skipDuplicates is TRUE: Only take non-duplicates
        // If skipDuplicates is FALSE (Update Mode): Take ALL items
        const itemsToProcess = skipDuplicates
            ? parsedData.filter(item => !item.isDuplicate)
            : parsedData;

        for (let i = 0; i < itemsToProcess.length; i++) {
            // Artificial delay for UI feedback
            await new Promise(r => setTimeout(r, 20));

            const { isDuplicate, ...cleanItem } = itemsToProcess[i];

            if (isDuplicate) {
                // UPDATE LOGIC
                // Find original item ID by Name
                const existingItem = items.find(ex => ex.name.toLowerCase() === cleanItem.name.toLowerCase());
                if (existingItem) {
                    // Update relevant fields (Price, Stock, Category)
                    // We preserve the original ID and Image if not provided (CSV doesn't have image usually)
                    await updateItem(existingItem.id, {
                        price: cleanItem.price,
                        category: cleanItem.category,
                        stock: cleanItem.stock,
                        trackStock: cleanItem.trackStock
                        // Don't update name or id
                    });
                }
            } else {
                // ADD LOGIC
                await addItem(cleanItem);
            }

            setProgress(Math.round(((i + 1) / itemsToProcess.length) * 100));
        }

        triggerHaptic('success');
        setStep('success');
    };

    const handleReset = () => {
        setStep('upload');
        setParsedData([]);
        setFileError('');
        setProgress(0);
    };

    if (!isOpen) return null;

    const duplicatesCount = parsedData.filter(i => i.isDuplicate).length;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', // [CHANGED] Darker bg for contrast
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
        }}>
            <div className="glass" style={{
                width: '100%', maxWidth: '550px',
                background: '#1a1a1a', // [CHANGED] Solid dark bg for visibility
                borderRadius: '24px',
                border: '1px solid var(--color-border)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                maxHeight: '85vh',
                color: '#fff' // [CHANGED] Global text color white
            }}>
                {/* Header */}
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                        <Upload size={20} color="var(--color-primary)" /> Bulk Import Items
                    </h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff' }}><X size={24} /></button>
                </div>

                {/* Content */}
                <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>

                    {/* STEP 1: UPLOAD */}
                    {step === 'upload' && (
                        <div>
                            {/* Template Section */}
                            <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>

                                {/* Action 1: New Template */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, marginBottom: '4px', color: '#fff' }}>1. Download Template</div>
                                        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>For adding new items.</div>
                                    </div>
                                    <button onClick={downloadTemplate} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#333', color: '#fff', border: '1px solid #777', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                                        <Download size={16} /> Blank Template
                                    </button>
                                </div>

                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>

                                {/* Action 2: Existing Stock (Smart Idea) */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, marginBottom: '4px', color: '#bbf7d0' }}>2. Bulk Update Stocks</div>
                                        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>Download {items.filter(i => i.trackStock).length} items, edit stock, and re-upload.</div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const trackableItems = items.filter(i => i.trackStock || i.trackStock === undefined); // Include items without explicit trackStock too
                                            const header = 'Name,Price,Category,Stock\n';
                                            const rows = trackableItems.map(i =>
                                                `${i.name},${i.price},${i.category},${i.stock}`
                                            ).join('\n');

                                            const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
                                            const link = document.createElement('a');
                                            link.href = URL.createObjectURL(blob);
                                            link.download = `inventory_stock_${new Date().toISOString().slice(0, 10)}.csv`;
                                            link.click();
                                            triggerHaptic('success');
                                        }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                        <Download size={16} /> Current Stock
                                    </button>
                                </div>
                            </div>

                            {/* Upload Section */}
                            <div style={{ fontWeight: 600, marginBottom: '12px', color: '#fff' }}>2. Upload Filled CSV</div>
                            <div
                                onClick={() => fileInputRef.current.click()}
                                style={{
                                    border: '2px dashed #888', borderRadius: '16px',
                                    padding: '40px', textAlign: 'center', cursor: 'pointer',
                                    background: 'rgba(0,0,0,0.3)', transition: 'all 0.2s',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = '#888'}
                            >
                                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FileText size={24} color="#fff" />
                                </div>
                                <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 500 }}>
                                    Drag & drop or <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Browse</span>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                />
                            </div>

                            {fileError && (
                                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 500 }}>
                                    <AlertTriangle size={16} /> {fileError}
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 2: PREVIEW */}
                    {step === 'preview' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                                <div style={{ fontWeight: 700, color: '#fff' }}>Preview ({parsedData.length} items)</div>
                                <button onClick={handleReset} style={{ fontSize: '0.85rem', color: 'var(--color-primary)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Change File</button>
                            </div>

                            {/* [NEW] Duplicate Warning */}
                            {duplicatesCount > 0 && (
                                <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontSize: '0.9rem' }}>
                                        <AlertTriangle size={18} />
                                        <span>Found {duplicatesCount} existing item{duplicatesCount !== 1 ? 's' : ''}.</span>
                                    </div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#fff' }}>
                                        <input
                                            type="checkbox"
                                            checked={!skipDuplicates} // Inverted logic: Checked = Update (Don't Skip)
                                            onChange={(e) => setSkipDuplicates(!e.target.checked)}
                                            style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
                                        />
                                        Update Existing
                                    </label>
                                </div>
                            )}

                            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #333', borderRadius: '12px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead style={{ background: '#222', position: 'sticky', top: 0 }}>
                                        <tr>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#aaa', borderBottom: '1px solid #333' }}>Name</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#aaa', borderBottom: '1px solid #333' }}>Price</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#aaa', borderBottom: '1px solid #333' }}>Category</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedData.map((item, i) => (
                                            <tr key={i} style={{
                                                borderBottom: '1px solid #333',
                                                background: item.isDuplicate ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                                                opacity: 1,
                                                textDecoration: (item.isDuplicate && skipDuplicates) ? 'line-through' : 'none',
                                                color: (item.isDuplicate && skipDuplicates) ? '#aaa' : '#fff'
                                            }}>
                                                <td style={{ padding: '12px', color: (item.isDuplicate && skipDuplicates) ? '#ccc' : '#fff' }}>
                                                    {item.name}
                                                    {item.isDuplicate && <span style={{ fontSize: '0.7rem', marginLeft: '6px', border: '1px solid #ef4444', color: '#ef4444', padding: '1px 4px', borderRadius: '4px', textDecoration: 'none', display: 'inline-block', fontWeight: 600 }}>DUPLICATE</span>}
                                                </td>
                                                <td style={{ padding: '12px', color: (item.isDuplicate && skipDuplicates) ? '#ccc' : '#fff' }}>₹{item.price}</td>
                                                <td style={{ padding: '12px' }}>
                                                    <span style={{ padding: '2px 8px', background: '#333', borderRadius: '10px', fontSize: '0.8rem', color: '#ccc' }}>{item.category}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: IMPORTING */}
                    {step === 'importing' && (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <div style={{ marginBottom: '20px', fontWeight: 600, fontSize: '1.1rem', color: '#fff' }}>Importing Items...</div>
                            <div style={{ width: '100%', height: '8px', background: '#333', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.2s ease' }}></div>
                            </div>
                            <div style={{ marginTop: '10px', color: '#aaa' }}>{progress}% Complete</div>
                        </div>
                    )}

                    {/* STEP 4: SUCCESS */}
                    {step === 'success' && (
                        <div style={{ textAlign: 'center', padding: '10px 0' }}>
                            <div style={{ width: '60px', height: '60px', background: 'var(--color-success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)' }}>
                                <Check size={32} color="white" />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>Import Successful!</h3>
                            <p style={{ color: '#aaa', marginBottom: '30px' }}>
                                Successfully added {parsedData.filter(i => !skipDuplicates || !i.isDuplicate).length} items.
                                {duplicatesCount > 0 && skipDuplicates && <span style={{ display: 'block', fontSize: '0.85rem', color: '#ef4444', marginTop: '4px' }}>Skipped {duplicatesCount} duplicates.</span>}
                            </p>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                <button
                                    onClick={handleReset}
                                    style={{
                                        padding: '12px 24px',
                                        background: 'transparent',
                                        border: '1px solid #555',
                                        borderRadius: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontSize: '0.95rem',
                                        color: '#fff',
                                        display: 'flex', alignItems: 'center', gap: '8px'
                                    }}
                                >
                                    <Upload size={16} /> Import More
                                </button>
                                <button
                                    onClick={onClose}
                                    style={{
                                        padding: '12px 30px',
                                        background: 'var(--color-primary)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontSize: '0.95rem',
                                        boxShadow: '0 4px 12px rgba(var(--color-primary-rgb), 0.3)'
                                    }}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions (Only for Preview) */}
                {
                    step === 'preview' && (
                        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '12px' }}>
                            <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #555', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', color: '#fff' }}>Cancel</button>
                            <button
                                onClick={processImport}
                                style={{
                                    flex: 1, padding: '12px',
                                    background: 'var(--color-primary)', color: 'white',
                                    border: 'none', borderRadius: '12px', fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(var(--color-primary-rgb), 0.3)'
                                }}
                            >
                                Import {(skipDuplicates ? parsedData.filter(i => !i.isDuplicate).length : parsedData.length)} Items
                            </button>
                        </div>
                    )
                }
            </div>
        </div>
    );
};

export default BulkImportModal;
