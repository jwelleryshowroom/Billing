import React from 'react';

const SuspenseLoader = () => {
    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-bg-primary)',
            color: 'var(--color-primary)',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 9999
        }}>
            <div className="spinner" style={{
                width: '40px',
                height: '40px',
                border: '4px solid rgba(0, 0, 0, 0.1)',
                borderLeftColor: 'var(--color-primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '16px'
            }}></div>
            <div style={{
                fontWeight: 600,
                letterSpacing: '0.5px',
                fontSize: '0.9rem',
                opacity: 0.8
            }}>
                Loading Module...
            </div>
            <style>
                {`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                `}
            </style>
        </div>
    );
};

export default SuspenseLoader;
