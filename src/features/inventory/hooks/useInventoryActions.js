import { useState, useRef, useEffect, useCallback } from 'react';
import { useInventory } from '../../../context/InventoryContext';
import { useToast } from '../../../context/useToast';
import { triggerHaptic } from '../../../utils/haptics';
import { toTitleCase, getSmartEmoji } from '../../../utils/smartHelpers';

export const useInventoryActions = () => {
    const { addItem, updateItem, deleteItem } = useInventory();
    const { showToast } = useToast();

    // --- State ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
    const [currentItem, setCurrentItem] = useState(null);
    const [suggestedEmoji, setSuggestedEmoji] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, itemId: null, itemName: '' });
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Image State
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    // --- Emoji Suggestions ---
    useEffect(() => {
        if (currentItem && (currentItem.name || currentItem.category)) {
            const suggestion = getSmartEmoji(currentItem.name, currentItem.category);
            setSuggestedEmoji(suggestion);
        } else {
            setSuggestedEmoji('');
        }
    }, [currentItem?.name, currentItem?.category]);

    // --- Global Paste Listener ---
    useEffect(() => {
        const handleGlobalPaste = (e) => {
            if (!isModalOpen) return;

            // Do not intercept if typing in a text field
            const target = e.target;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    setSelectedFile(file);
                    e.preventDefault();
                    break;
                }
            }
        };

        window.addEventListener('paste', handleGlobalPaste);
        return () => window.removeEventListener('paste', handleGlobalPaste);
    }, [isModalOpen]);


    // --- Actions ---

    const handleEditClick = (item) => {
        triggerHaptic('light');
        setCurrentItem({ ...item }); // Clone
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleAddClick = (initialName = '') => {
        triggerHaptic('medium');
        setCurrentItem({
            name: typeof initialName === 'string' ? initialName : '', // Handle event object if passed directly
            category: 'Cakes',
            price: '',
            stock: 10,
            imageZoom: 1.0,
            imageFit: 'cover',
            trackStock: true,
            variants: []
        });
        setModalMode('add');
        setIsModalOpen(true);
    };

    const handleDeleteClick = (item) => {
        triggerHaptic('medium');
        setDeleteConfirmation({
            show: true,
            itemId: item.id,
            itemName: item.name
        });
    };

    const confirmDelete = () => {
        if (deleteConfirmation.itemId) {
            triggerHaptic('heavy');
            deleteItem(deleteConfirmation.itemId);
            setDeleteConfirmation({ show: false, itemId: null, itemName: '' });
        }
    };

    const handleSaveItem = () => {
        const hasVariants = currentItem.variants && currentItem.variants.length > 0;

        if (!currentItem.name) {
            showToast("Item Name is required!", "error");
            return;
        }

        if (!hasVariants && !currentItem.price) {
            showToast("Price is required for standard items!", "error");
            return;
        }

        const itemData = {
            ...currentItem,
            name: toTitleCase(currentItem.name),
            price: currentItem.price ? parseFloat(currentItem.price) : 0,
            stock: currentItem.stock ? parseInt(currentItem.stock) : 0,
            image: currentItem.image || getSmartEmoji(currentItem.name, currentItem.category),
            trackStock: currentItem.trackStock ?? true,
            variants: currentItem.variants || []
        };

        if (modalMode === 'add') {
            addItem(itemData);
        } else {
            updateItem(itemData.id, itemData);
        }
        triggerHaptic('success');
        setIsModalOpen(false);
    };

    // --- Image Handlers ---
    const triggerImageUpload = () => fileInputRef.current.click();

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleImageProcessed = (base64Image) => {
        setCurrentItem(prev => ({ ...prev, image: base64Image }));

        // Quick Edit Save if not in modal
        if (!isModalOpen && currentItem?.id) {
            updateItem(currentItem.id, {
                image: base64Image,
                imageZoom: currentItem.imageZoom || 1.0,
                imageFit: currentItem.imageFit || 'cover'
            });
        }

        setSelectedFile(null);
    };

    const handleQuickImageEdit = (item) => {
        setCurrentItem(item);
        triggerImageUpload();
    };

    // --- Variant Helpers ---
    const addVariant = () => {
        const newVariant = { id: Date.now().toString(), name: '', price: '', stock: '' };
        setCurrentItem(prev => ({
            ...prev,
            variants: [...(prev.variants || []), newVariant]
        }));
    };

    const removeVariant = (id) => {
        setCurrentItem(prev => ({
            ...prev,
            variants: prev.variants.filter(v => v.id !== id)
        }));
    };

    const updateVariant = (id, field, value) => {
        setCurrentItem(prev => ({
            ...prev,
            variants: prev.variants.map(v => v.id === id ? { ...v, [field]: value } : v)
        }));
    };

    // Helper for updateVariantSplit
    const parseVariantName = (name) => {
        if (!name) return { value: '', unit: 'Pound' };
        const match = name.match(/([\d\./]+)\s*(.*)/);
        if (match) return { value: match[1], unit: match[2] || 'Pound' };
        return { value: name, unit: 'Pound' };
    };

    const updateVariantSplit = (id, field, partialValue) => {
        setCurrentItem(prev => ({
            ...prev,
            variants: prev.variants.map(v => {
                if (v.id !== id) return v;

                const current = parseVariantName(v.name);
                let newValue = current.value;
                let newUnit = current.unit;

                if (field === 'value') newValue = partialValue;
                if (field === 'unit') newUnit = partialValue;

                return { ...v, name: `${newValue} ${newUnit}`.trim() };
            })
        }));
    };

    const calculateSmartPrice = (basePrice, baseUnit, targetUnit) => {
        if (!basePrice || !baseUnit || !targetUnit) return '';

        const units = {
            'pound': 1, 'lb': 1, 'lbs': 1,
            'kg': 2.20462, 'kilogram': 2.20462,
            'g': 0.00220462, 'gm': 0.00220462, 'gram': 0.00220462,
            'ml': 0.0022, 'l': 2.2, 'liter': 2.2
        };

        const parseUnit = (str) => {
            const match = str.toLowerCase().match(/([\d\./]+)\s*([a-z]+)/);
            if (!match) return null;
            let val = 0;
            try {
                if (match[1].includes('/')) {
                    const [num, den] = match[1].split('/');
                    val = parseFloat(num) / parseFloat(den);
                } else {
                    val = parseFloat(match[1]);
                }
            } catch (err) { return 0; }
            let unit = match[2];
            return { val, unit };
        };

        const base = parseUnit(baseUnit);
        const target = parseUnit(targetUnit);

        if (!base || !target || !units[base.unit] || !units[target.unit]) return '';

        const baseWeight = base.val * units[base.unit];
        const targetWeight = target.val * units[target.unit];

        const pricePerPound = basePrice / baseWeight;
        const estimatedPrice = pricePerPound * targetWeight;

        return Math.round(estimatedPrice);
    };

    const addSmartVariant = (presetName) => {
        let nameToAdd = presetName;
        if (presetName === 'Custom') {
            const lastVariant = currentItem.variants[currentItem.variants.length - 1];
            if (lastVariant) {
                const { unit } = parseVariantName(lastVariant.name);
                nameToAdd = ` ${unit}`;
            } else {
                nameToAdd = ' Pound';
            }
        } else {
            if (!isNaN(presetName) || presetName.includes('/')) {
                const lastVariant = currentItem.variants[currentItem.variants.length - 1];
                const unit = lastVariant ? parseVariantName(lastVariant.name).unit : 'Pound';
                nameToAdd = `${presetName} ${unit}`;
            }
        }

        let price = '';
        if (currentItem.variants && currentItem.variants.length > 0) {
            const baseVariant = currentItem.variants.find(v => v.price && v.name);
            if (baseVariant && presetName !== 'Custom') {
                price = calculateSmartPrice(parseFloat(baseVariant.price), baseVariant.name, nameToAdd);
            }
        }

        const newVariant = { id: Date.now().toString(), name: nameToAdd.trim(), price: price, stock: '' };
        setCurrentItem(prev => ({
            ...prev,
            variants: [...(prev.variants || []), newVariant]
        }));
    };

    return {
        // Modal State
        isModalOpen, setIsModalOpen,
        modalMode, setModalMode,
        currentItem, setCurrentItem,
        suggestedEmoji,

        // Delete State
        deleteConfirmation, setDeleteConfirmation,

        // Import State
        isImportModalOpen, setIsImportModalOpen,

        // Image State
        selectedFile, setSelectedFile,
        fileInputRef,

        // Actions
        handleAddClick,
        handleEditClick,
        handleDeleteClick,
        confirmDelete,
        handleSaveItem,
        triggerImageUpload,
        handleFileChange,
        handleImageProcessed,
        handleQuickImageEdit,

        // Variants
        addVariant,
        removeVariant,
        updateVariant,
        updateVariantSplit,
        addSmartVariant
    };
};
