import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        // Return a default object to prevent crashes during tree transitions
        return {
            businessName: 'Loading...',
            businessLogo: '🍰',
            businessLogoUrl: '',
            primaryColor: '#ff4757',
            menuBarMode: 'sticky',
            iconStyle: 'emoji',
            showMenuLabels: true,
            showMilestoneModal: false,
            homeLayoutMode: 'bento',
            isSettingsOpen: false,
            openSettings: () => { },
            closeSettings: () => { },
            openData: () => { },
            closeData: () => { },
            setBusinessName: () => { },
            setBusinessLogo: () => { },
            setBusinessLogoUrl: () => { },
            setPrimaryColor: () => { },
            setMenuBarMode: () => { },
            setIconStyle: () => { },
            setShowMenuLabels: () => { },
            setShowMilestoneModal: () => { },
            setNavVisible: () => { },
            handleLogoUpload: () => { }
        };
    }
    return context;
};

// Default Configurations
const DEFAULT_MOBILE_SETTINGS = {
    menuBarMode: 'disappearing',
    iconStyle: 'emoji',
    showMenuLabels: false,
    showMilestoneModal: false, // Changed to OFF by default
    homeLayoutMode: 'bento'
};

const DEFAULT_DESKTOP_SETTINGS = {
    menuBarMode: 'disappearing',
    iconStyle: 'emoji',
    showMenuLabels: true,
    showMilestoneModal: false, // Changed to OFF by default
    homeLayoutMode: 'bento'
};

export const SettingsProvider = ({ children }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const { businessId, loading: authLoading } = useAuth();
    const { showToast } = useToast();

    // 2. Business Profile & Branding
    const [businessName, setBusinessName] = useState('Lekha Kosh');
    const [businessAddress, setBusinessAddress] = useState('');
    const [businessPhone, setBusinessPhone] = useState('');
    const [businessFooter, setBusinessFooter] = useState('Thank you for visiting!');
    const [businessMapLink, setBusinessMapLink] = useState(''); // [NEW] Map Link
    const [publicUrl, setPublicUrl] = useState(''); // For public links
    const [businessLogo, setBusinessLogo] = useState('🏦');
    const [businessLogoUrl, setBusinessLogoUrl] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#6366f1');

    // 3. UI Settings (Sync with Firestore)
    const [mobileSettings, setMobileSettings] = useState(DEFAULT_MOBILE_SETTINGS);
    const [desktopSettings, setDesktopSettings] = useState(DEFAULT_DESKTOP_SETTINGS);
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 4. Remote Sync (Firestore -> App)
    useEffect(() => {
        if (authLoading || !businessId) return;

        const docRef = doc(db, "businesses", businessId);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            try {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const name = data.name || 'Lekha Kosh';
                    const address = data.address || '';
                    const phone = data.phone || '';
                    const footer = data.footer || 'Thank you for visiting!';
                    const mapLink = data.mapLink || '';
                    const pUrl = data.publicUrl || '';
                    const logo = data.logo || '🏦';
                    const logoUrl = data.logoUrl || '';
                    const color = data.primaryColor || '#6366f1';

                    setBusinessName(name);
                    setBusinessAddress(address);
                    setBusinessPhone(phone);
                    setBusinessFooter(footer);
                    setBusinessMapLink(mapLink);
                    setPublicUrl(pUrl);
                    setBusinessLogo(logo);
                    setBusinessLogoUrl(logoUrl);
                    setPrimaryColor(color);

                    // Cache for Splash Screen (index.html)
                    localStorage.setItem('cached_business_name', name);
                    localStorage.setItem('cached_business_logo', logo);
                    localStorage.setItem('cached_business_logo_url', logoUrl);
                    localStorage.setItem('cached_primary_color', color);

                    // Inject CSS variable
                    document.documentElement.style.setProperty('--color-primary', color);

                    if (data.uiSettings) {
                        if (data.uiSettings.mobile) setMobileSettings(prev => ({ ...prev, ...data.uiSettings.mobile }));
                        if (data.uiSettings.desktop) setDesktopSettings(prev => ({ ...prev, ...data.uiSettings.desktop }));
                    }
                    setSettingsLoaded(true);
                } else {
                    // Initialize default business doc if missing
                    console.log("No business profile found. Creating defaults for:", businessId);
                    setDoc(docRef, {
                        name: 'Lekha Kosh',
                        address: '',
                        phone: '',
                        footer: 'Thank you for visiting!',
                        mapLink: '',
                        publicUrl: '',
                        logo: '🏦',
                        logoUrl: '',
                        primaryColor: '#6366f1',
                        uiSettings: {
                            mobile: DEFAULT_MOBILE_SETTINGS,
                            desktop: DEFAULT_DESKTOP_SETTINGS
                        }
                    }, { merge: true });
                }
            } catch (err) {
                console.error("Settings Processing Error:", err);
            }
        }, (error) => {
            console.error("Settings Sync Error:", error);
            // Don't crash the app, just use defaults
            setSettingsLoaded(true);
        });

        return () => unsubscribe();
    }, [businessId, authLoading]);

    // 5. Persist Changes to Firestore (Throttled/Helper)
    const persistSettings = async (updates) => {
        if (!businessId) return;
        try {
            const docRef = doc(db, "businesses", businessId);
            await updateDoc(docRef, updates);
        } catch (error) {
            console.error("Failed to save settings:", error);
        }
    };


    // 4. Resolve Current Settings based on Device
    const currentSettings = isMobile ? mobileSettings : desktopSettings;
    const updateSettings = isMobile ? setMobileSettings : setDesktopSettings;

    // Helper to update specific key
    const updateSetting = (key, value) => {
        const newSettings = { ...(isMobile ? mobileSettings : desktopSettings), [key]: value };

        // Optimistic UI update
        if (isMobile) setMobileSettings(newSettings);
        else setDesktopSettings(newSettings);

        // Sync to cloud
        persistSettings({
            [`uiSettings.${isMobile ? 'mobile' : 'desktop'}.${key}`]: value
        });
    };

    // 5. Global / Shared Settings (NOT device specific)
    const [hapticDebug, setHapticDebug] = useState(() => {
        const saved = localStorage.getItem('hapticDebug');
        return saved !== null ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        localStorage.setItem('hapticDebug', JSON.stringify(hapticDebug));
    }, [hapticDebug]);

    // Drawer States (Ephemeral)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const openSettings = () => setIsSettingsOpen(true);
    const closeSettings = () => setIsSettingsOpen(false);

    const [isDataOpen, setIsDataOpen] = useState(false);
    const openData = () => setIsDataOpen(true);
    const closeData = () => setIsDataOpen(false);

    const [navVisible, setNavVisible] = useState(true);

    const value = {
        // Exposed Values (Proxied to current profile)
        menuBarMode: currentSettings.menuBarMode,
        setMenuBarMode: (val) => updateSetting('menuBarMode', val),

        iconStyle: currentSettings.iconStyle,
        setIconStyle: (val) => updateSetting('iconStyle', val),

        showMenuLabels: currentSettings.showMenuLabels,
        setShowMenuLabels: (val) => updateSetting('showMenuLabels', val),

        showMilestoneModal: currentSettings.showMilestoneModal,
        setShowMilestoneModal: (val) => updateSetting('showMilestoneModal', val),

        homeLayoutMode: currentSettings.homeLayoutMode,
        setHomeLayoutMode: (val) => updateSetting('homeLayoutMode', val),

        // Branding Properties
        businessName,
        setBusinessName: (val) => { setBusinessName(val); persistSettings({ name: val }); },
        businessAddress,
        setBusinessAddress: (val) => { setBusinessAddress(val); persistSettings({ address: val }); },
        businessPhone,
        setBusinessPhone: (val) => { setBusinessPhone(val); persistSettings({ phone: val }); },
        businessFooter,
        setBusinessFooter: (val) => { setBusinessFooter(val); persistSettings({ footer: val }); },
        businessMapLink,
        setBusinessMapLink: (val) => { setBusinessMapLink(val); persistSettings({ mapLink: val }); },
        publicUrl,
        setPublicUrl: (val) => { setPublicUrl(val); persistSettings({ publicUrl: val }); },
        businessLogo,
        setBusinessLogo: (val) => { setBusinessLogo(val); persistSettings({ logo: val }); },
        businessLogoUrl,
        setBusinessLogoUrl: (val) => { setBusinessLogoUrl(val); persistSettings({ logoUrl: val }); },
        primaryColor,
        setPrimaryColor: (val) => { setPrimaryColor(val); persistSettings({ primaryColor: val }); },

        // Global
        hapticDebug,
        setHapticDebug,
        isSettingsOpen,
        openSettings,
        closeSettings,
        isDataOpen,
        openData,
        closeData,
        navVisible,
        setNavVisible,

        // Meta
        isMobile,

        // Upload (Uses Base64 for reliability and zero-config)
        handleLogoUpload: async (file) => {
            if (!file) return;
            if (!businessId) {
                showToast("Business ID not loaded yet. Try again in a second.", "info");
                return;
            }

            try {
                // 1. Process & Compress Image regardless of input size
                const reader = new FileReader();
                const base64Promise = new Promise((resolve, reject) => {
                    reader.onload = (e) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            // Target size: Max 512px (high quality for icons)
                            const MAX_DIM = 512;
                            let width = img.width;
                            let height = img.height;
                            if (width > height) {
                                if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; }
                            } else {
                                if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; }
                            }
                            canvas.width = width; canvas.height = height;

                            const ctx = canvas.getContext('2d');
                            ctx.clearRect(0, 0, width, height); // Ensure transparency
                            ctx.imageSmoothingEnabled = true;
                            ctx.imageSmoothingQuality = 'high';
                            ctx.drawImage(img, 0, 0, width, height);

                            // PNG preserves transparency, fixing the 'white strip' issue
                            const dataUrl = canvas.toDataURL('image/png');
                            resolve(dataUrl);
                        };
                        img.onerror = reject;
                        img.src = e.target.result;
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                const dataUrl = await base64Promise;

                // 3. Update State & Firestore
                setBusinessLogoUrl(dataUrl);
                await persistSettings({ logoUrl: dataUrl });

                showToast("Logo updated successfully! 🖼️", "success");
                return dataUrl;
            } catch (error) {
                console.error("Logo update failed:", error);
                showToast("Failed to process image.", "error");
                throw error;
            }
        }
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};
