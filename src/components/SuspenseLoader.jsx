import { useSettings } from '../context/SettingsContext';

const SuspenseLoader = () => {
    const { businessLogoUrl, businessName, businessLogo } = useSettings();

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-bg-body)',
            color: 'var(--color-primary)',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 9999
        }}>
            {businessLogoUrl ? (
                <div style={{ marginBottom: '24px', position: 'relative' }}>
                    <img
                        src={businessLogoUrl}
                        alt={businessName}
                        style={{
                            width: '80px',
                            height: '80px',
                            objectFit: 'cover',
                            borderRadius: '20px',
                            animation: 'pulse 2s ease-in-out infinite'
                        }}
                    />
                    <div className="spinner-ring" style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '-10px',
                        right: '-10px',
                        bottom: '-10px',
                        border: '2px solid transparent',
                        borderTopColor: 'var(--color-primary)',
                        borderRadius: '50%',
                        animation: 'spin 1.5s linear infinite'
                    }}></div>
                </div>
            ) : (
                <div className="spinner" style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid rgba(0, 0, 0, 0.1)',
                    borderLeftColor: 'var(--color-primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                }}>
                    {businessLogo}
                </div>
            )}
            <div style={{
                fontWeight: 600,
                letterSpacing: '1px',
                fontSize: '0.8rem',
                opacity: 0.6,
                textTransform: 'uppercase'
            }}>
                {businessName}
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
