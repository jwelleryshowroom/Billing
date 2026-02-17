import { useState, useEffect, useMemo } from 'react';

export const useInventoryFilters = (items) => {
    // --- State ---
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortBy, setSortBy] = useState(() => localStorage.getItem('inventorySort') || 'default');
    const [showSortMenu, setShowSortMenu] = useState(false);

    // --- Persist Sort ---
    useEffect(() => {
        localStorage.setItem('inventorySort', sortBy);
    }, [sortBy]);

    // --- Derived Categories ---
    const categories = useMemo(() => {
        const derivedCategories = items.map(i => i.category).filter(c => c && c.toLowerCase() !== 'all' && c.toLowerCase() !== 'general');
        const defaultCategories = ['General'];
        const unique = new Set([...defaultCategories, ...derivedCategories]);
        return ['All', ...Array.from(unique)];
    }, [items]);

    // --- Filter & Sort Logic ---
    // 1. Create a truly stable base list from the prop
    const baseItems = useMemo(() => {
        return [...items];
    }, [items]);

    const effectiveSearchTerm = searchTerm;

    const filteredItems = useMemo(() => {
        const term = (effectiveSearchTerm || '').toLowerCase().trim();

        // 2. Filter ONLY from baseItems
        const filtered = baseItems.filter(item => {
            // Category Filter
            if (selectedCategory !== 'All' && item.category !== selectedCategory) {
                return false;
            }

            // Search Filter
            if (!term) return true;

            const name = (item.name || '').toLowerCase();
            const category = (item.category || '').toLowerCase();
            const price = String(item.price || '');

            // Check if term matches name, category, or any price (including variants)
            const matchesName = name.includes(term);
            const matchesCategory = category.includes(term);
            const matchesPrice = price.includes(term);
            const matchesVariantPrice = (item.variants || []).some(v => String(v.price).includes(term));

            return matchesName || matchesCategory || matchesPrice || matchesVariantPrice;
        });

        // 3. Sort the filtered results (using a fresh copy)
        return [...filtered].sort((a, b) => {
            // Priority 0: Relevance (Only if searching)
            if (term) {
                const nameA = (a.name || '').toLowerCase();
                const nameB = (b.name || '').toLowerCase();

                const aHasTerm = nameA.includes(term);
                const bHasTerm = nameB.includes(term);

                if (aHasTerm && !bHasTerm) return -1;
                if (!aHasTerm && bHasTerm) return 1;

                // If both match in name, prioritize "Starts with"
                const aStarts = nameA.startsWith(term);
                const bStarts = nameB.startsWith(term);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
            }

            const nameA = a.name || '';
            const nameB = b.name || '';

            switch (sortBy) {
                case 'default':
                case 'name-asc':
                    return nameA.localeCompare(nameB);
                case 'name-desc':
                    return nameB.localeCompare(nameA);
                case 'price-asc':
                    return (a.price || 0) - (b.price || 0);
                case 'price-desc':
                    return (b.price || 0) - (a.price || 0);
                case 'stock-asc':
                    return (a.stock || 0) - (b.stock || 0);
                case 'stock-desc':
                    return (b.stock || 0) - (a.stock || 0);
                default:
                    return 0;
            }
        });
    }, [baseItems, effectiveSearchTerm, selectedCategory, sortBy]);

    // Debug logging (Remove after verification if desired)
    useEffect(() => {
        if (process.env.NODE_ENV === 'development' && searchTerm) {
            console.log(`[InventorySearch] Source: ${baseItems.length}, Term: "${searchTerm}", Found: ${filteredItems.length}`);
        }
    }, [baseItems, searchTerm, filteredItems]);

    return {
        viewMode, setViewMode,
        searchTerm, setSearchTerm,
        selectedCategory, setSelectedCategory,
        sortBy, setSortBy,
        showSortMenu, setShowSortMenu,
        categories,
        filteredItems
    };
};
