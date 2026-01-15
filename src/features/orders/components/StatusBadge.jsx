import React, { useState } from 'react';

const StatusBadge = ({ status, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);
    const styles = {
        pending: { color: 'var(--color-warning)', bg: 'rgba(255, 193, 7, 0.1)' },
        ready: { color: 'var(--color-primary)', bg: 'rgba(76, 175, 80, 0.1)' },
        completed: { color: 'var(--color-success)', bg: 'rgba(46, 204, 113, 0.1)' },
    };
    const s = styles[status] || styles.pending;

    const canInteract = status === 'pending' && onClick;

    return (
        <span
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={canInteract ? onClick : undefined}
            style={{
                padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600,
                color: (canInteract && isHovered) ? 'white' : s.color,
                backgroundColor: (canInteract && isHovered) ? 'var(--color-success)' : s.bg,
                cursor: canInteract ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                userSelect: 'none',
                display: 'inline-block',
                minWidth: '100px',
                textAlign: 'center'
            }}
        >
            {(canInteract && isHovered) ? 'MARK READY' : status.toUpperCase()}
        </span>
    );
};

export default StatusBadge;
