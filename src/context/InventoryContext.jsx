import React, { createContext, useContext, useState, useEffect } from 'react';
import { get, set } from 'idb-keyval'; // Using IndexedDB for safe large storage

const InventoryContext = createContext();

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }) => {
    // Initial Seed Data 
    const defaultItems = [
        { id: '1', name: 'Veg Puff', price: 25, category: 'Snacks', stock: 45, image: '🥐' },
        { id: '2', name: 'Black Forest (1kg)', price: 800, category: 'Cakes', stock: 2, image: '🎂' },
        { id: '3', name: 'Chocolate Truffle', price: 550, category: 'Cakes', stock: 5, image: '🍫' },
        { id: '4', name: 'Pineapple Cake', price: 450, category: 'Cakes', stock: 3, image: '🍰' },
        { id: '5', name: 'Coke (300ml)', price: 40, category: 'Drinks', stock: 45, image: '🥤' },
        { id: '6', name: 'Chicken Puff', price: 35, category: 'Snacks', stock: 8, image: '🍖' },
        { id: '7', name: 'Cupcake', price: 60, category: 'Pastries', stock: 15, image: '🧁' },
        { id: '8', name: 'Donut', price: 80, category: 'Pastries', stock: 10, image: '🍩' },
        { id: '9', name: 'Cold Coffee', price: 65, category: 'Drinks', stock: 20, image: '☕' },
    ];

    const [items, setItems] = useState(defaultItems); // Optimistic Init
    const [loading, setLoading] = useState(true);

    // 1. Load from IDB on Mount
    useEffect(() => {
        get('inventory_items').then((val) => {
            if (val) {
                setItems(val);
            } else {
                setItems(defaultItems);
                set('inventory_items', defaultItems);
            }
            setLoading(false);
        }).catch(err => {
            console.error("IDB Error:", err);
            // Fallback
            setItems(defaultItems);
            setLoading(false);
        });
    }, []);

    // 2. Persist to IDB whenever items change
    useEffect(() => {
        if (!loading) {
            set('inventory_items', items).catch(err => console.error("IDB Save Fail:", err));
        }
    }, [items, loading]);

    const addItem = (newItem) => {
        setItems(prev => [...prev, newItem]);
    };

    const updateItem = (id, updates) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const deleteItem = (id) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const getItemsByCategory = (category) => {
        if (category === 'All') return items;
        return items.filter(i => i.category === category);
    };

    return (
        <InventoryContext.Provider value={{ items, addItem, updateItem, deleteItem, getItemsByCategory }}>
            {children}
        </InventoryContext.Provider>
    );
};
