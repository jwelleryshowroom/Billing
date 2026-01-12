import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    // Menu Bar Mode: 'sticky' | 'disappearing'
    const [menuBarMode, setMenuBarMode] = useState(() => {
        return localStorage.getItem('menuBarMode') || 'sticky';
    });

    // Icon Style: 'mono' | 'emoji'
    const [iconStyle, setIconStyle] = useState(() => {
        return localStorage.getItem('iconStyle') || 'mono';
    });

    // Show Labels: boolean
    const [showMenuLabels, setShowMenuLabels] = useState(() => {
        const saved = localStorage.getItem('showMenuLabels');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('menuBarMode', menuBarMode);
        localStorage.setItem('iconStyle', iconStyle);
        localStorage.setItem('showMenuLabels', JSON.stringify(showMenuLabels));
    }, [menuBarMode, iconStyle, showMenuLabels]);

    const value = {
        menuBarMode,
        setMenuBarMode,
        iconStyle,
        setIconStyle,
        showMenuLabels,
        setShowMenuLabels
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};
