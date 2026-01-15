import React from 'react';
import { Search, ShoppingBag, Clipboard } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

// Local Icons specific to this header
const ShoppingBagIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>;
const ClipboardIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>;

const BillingHeader = ({
    showMobileSearch,
    setShowMobileSearch,
    searchTerm,
    setSearchTerm,
    mode,
    setMode
}) => {
    return (
        <header style={{
            padding: '12px 20px',
            background: 'var(--color-bg-surface-transparent)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            height: '60px',
            position: 'relative'
        }}>
            {/* A. MOBILE SEARCH OVERLAY */}
            {showMobileSearch ? (
                <div style={{ position: 'absolute', inset: 0, background: 'var(--color-bg-surface)', display: 'flex', alignItems: 'center', padding: '0 12px', zIndex: 50 }}>
                    <Search size={18} style={{ marginRight: '12px', color: '#666' }} />
                    <input
                        autoFocus
                        placeholder="Search Item..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ flex: 1, background: 'transparent', border: 'none', fontSize: '1rem', outline: 'none', height: '100%', color: 'var(--color-text-primary)' }}
                    />
                    <button onClick={() => {
                        triggerHaptic('light');
                        setShowMobileSearch(false);
                    }} style={{ padding: '8px', background: 'transparent', border: 'none', color: '#666' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            ) : (
                /* B. NORMAL HEADER CONTENT */
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.5px' }}>⚡ BILLING</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>


                        {/* Mode Switcher */}
                        <div style={{ display: 'flex', background: 'var(--color-bg-surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                            <button onClick={() => { triggerHaptic('light'); setMode('quick'); }} style={{ padding: '6px 16px', borderRadius: '6px', background: mode === 'quick' ? '#4CAF50' : 'transparent', color: mode === 'quick' ? 'white' : '#888', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                                <ShoppingBagIcon /> <span className="hide-mobile">QUICK</span>
                            </button>
                            <div style={{ width: '1px', background: 'var(--color-border)', margin: '4px 0' }}></div>
                            <button onClick={() => { triggerHaptic('light'); setMode('order'); }} style={{ padding: '6px 16px', borderRadius: '6px', background: mode === 'order' ? '#FF9800' : 'transparent', color: mode === 'order' ? 'black' : '#888', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                                <ClipboardIcon /> <span className="hide-mobile">ORDER</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </header>
    );
};

export default BillingHeader;
