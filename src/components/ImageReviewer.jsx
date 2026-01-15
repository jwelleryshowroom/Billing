import React, { useState, useRef, useEffect } from 'react';
import { Eraser, Undo, Scissors, Save, X } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import AccessDeniedModal from './AccessDeniedModal';

const ImageReviewer = ({ file, onConfirm, onCancel }) => {
    const { role } = useAuth();
    const [showAccessDenied, setShowAccessDenied] = useState(false);
    const canvasRef = useRef(null);
    const [originalImage, setOriginalImage] = useState(null);
    const [history, setHistory] = useState([]);

    // Config
    const tolerance = 40; // Sensitivity for color matching

    useEffect(() => {
        if (file) {
            const img = new Image();
            img.onload = () => {
                setOriginalImage(img);
                initCanvas(img);
            };
            img.src = URL.createObjectURL(file);
        }
    }, [file]);

    const initCanvas = (img) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Limit size to stay under 1MB Firestore limit (Optimized for Mobile Performance)
        const maxDim = 300; // Reduced from 600 for performance
        let w = img.width;
        let h = img.height;

        if (w > maxDim || h > maxDim) {
            if (w > h) { h = (h / w) * maxDim; w = maxDim; }
            else { w = (w / h) * maxDim; h = maxDim; }
        }

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        saveState(); // Initial state
    };

    const saveState = () => {
        const canvas = canvasRef.current;
        setHistory(prev => [...prev.slice(-9), canvas.toDataURL('image/png')]); // Keep last 10 states as PNG for transparency
    };

    // --- Actions ---
    const handleUndo = () => {
        if (history.length <= 1) return;
        const newHistory = history.slice(0, -1);
        const previousState = newHistory[newHistory.length - 1];

        const img = new Image();
        img.onload = () => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear
            ctx.drawImage(img, 0, 0); // Restore
            setHistory(newHistory);
        };
        img.src = previousState;
    };

    const handleCanvasClick = (e) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        // Calculate scale in case canvas is displayed smaller than actual size
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = Math.floor((e.clientX - rect.left) * scaleX);
        const y = Math.floor((e.clientY - rect.top) * scaleY);

        try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Get Target Color
            const targetIdx = (y * canvas.width + x) * 4;
            const tr = data[targetIdx];
            const tg = data[targetIdx + 1];
            const tb = data[targetIdx + 2];
            // const ta = data[targetIdx + 3]; // Ignore alpha for target matching usually? Or strictly match?

            // Simple Color Replacement (Magic Eraser Global)
            // Ideally this should be a Flood Fill if we want contiguous, but Global is often easier/expected for "Remove Background" on simple logos
            // Let's do Global replacement for "White Background" removal use case

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // const a = data[i + 3];

                // Check distance
                if (
                    Math.abs(r - tr) < tolerance &&
                    Math.abs(g - tg) < tolerance &&
                    Math.abs(b - tb) < tolerance
                ) {
                    data[i + 3] = 0; // Make Transparent
                }
            }

            ctx.putImageData(imageData, 0, 0);
            saveState();
        } catch (err) {
            console.error("Canvas manipulation error:", err);
        }
    };

    const handleSave = () => {
        if (role === 'guest') {
            setShowAccessDenied(true);
            return;
        }

        // Use PNG to preserve transparency
        const url = canvasRef.current.toDataURL('image/png');
        onConfirm(url);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>

            <div style={{
                position: 'relative',
                border: '2px dashed #444',
                borderRadius: '8px',
                overflow: 'hidden',
                background: `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ib3BhY2l0eTogMC4xIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiM1NTUiIC8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiM1NTUiIC8+PC9zdmc+')`,
                maxWidth: '100%',
                maxHeight: '60vh'
            }}>
                <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    style={{ display: 'block', maxWidth: '100%', cursor: 'crosshair', touchAction: 'none' }}
                />

                {/* Instruction Overlay */}
                <div style={{ position: 'absolute', bottom: 10, left: 0, width: '100%', textAlign: 'center', pointerEvents: 'none' }}>
                    <span style={{ background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem' }}>
                        👆 Tap a color to erase it
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button
                    onClick={handleUndo}
                    disabled={history.length <= 1}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', background: '#333', color: history.length <= 1 ? '#555' : 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                    <Undo size={18} /> Undo
                </button>
                <button
                    onClick={onCancel}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', background: '#333', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    style={{ flex: 1.5, padding: '12px', borderRadius: '8px', background: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                    <Save size={18} /> Save
                </button>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#888', textAlign: 'center', maxWidth: '300px' }}>
                Simple Magic Eraser: Tap on the background color (like white) to instantly remove it.
            </div>

            {/* Access Denied Modal */}
            <AccessDeniedModal
                isOpen={showAccessDenied}
                onClose={() => setShowAccessDenied(false)}
            />
        </div>
    );
};

export default ImageReviewer;
