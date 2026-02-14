import { useState } from 'react';
import { useTransactions } from '../../../context/useTransactions';
import { useAuth } from '../../../context/useAuth';
import { generateWhatsAppLink } from '../../../utils/smartHelpers';

import { useSettings } from '../../../context/SettingsContext';

const useOrderActions = () => {
    const { updateTransaction, addTransaction } = useTransactions();
    const { role, businessId } = useAuth();
    const { businessName, publicUrl, businessFooter } = useSettings();

    // --- Receipt State ---
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);

    // --- Delivery Modal State ---
    const [deliveryModal, setDeliveryModal] = useState({ open: false, order: null, step: 'confirm' });
    const [settleMethod, setSettleMethod] = useState('cash');

    // --- Access Denied State ---
    const [accessDeniedModal, setAccessDeniedModal] = useState(false);

    // --- Actions ---

    const handlePrint = (order) => {
        setSelectedOrder(order);
        setShowReceipt(true);
    };

    const handleSmartShare = (order) => {
        const url = generateWhatsAppLink(order, businessId, { businessName, publicUrl, businessFooter });
        window.open(url, '_blank');
    };

    const handleMarkReady = async (orderId) => {
        // Role Check
        if (role === 'guest') {
            setAccessDeniedModal(true);
            return;
        }
        try {
            await updateTransaction(orderId, { status: 'ready' });
        } catch (error) {
            console.error("Mark Ready Failed:", error);
        }
    };

    const openDeliveryModal = (order) => {
        // Role Check
        if (role === 'guest') {
            setAccessDeniedModal(true);
            return;
        }
        setDeliveryModal({ open: true, order, step: 'confirm' });
        setSettleMethod('cash'); // Default
    };

    const confirmDelivery = async () => {
        const order = deliveryModal.order;
        if (!order) return;

        try {
            const balance = order.payment?.balance || 0;
            const updates = {
                status: 'completed',
                deliveryStatus: 'delivered',
            };

            // Cash-Basis: If there's a balance, we collect it NOW -> New Transaction
            if (balance > 0) {
                // 1. Update the original order to show it's paid
                updates.payment = {
                    ...order.payment,
                    status: 'paid',
                    balance: 0,
                    balanceMethod: settleMethod,
                    balancePaidDate: new Date().toISOString()
                };

                // 2. Create a NEW Settlement Transaction
                const settlementTx = {
                    type: 'settlement', // Distinct type for reports
                    amount: balance, // The cash collected now
                    date: new Date().toISOString(),
                    description: `Settlement for Order #${order.id.slice(-6).toUpperCase()}`,
                    customer: order.customer,
                    payment: { type: settleMethod, status: 'paid' },
                    relatedOrderId: order.id,
                    mode: 'settlement'
                };

                await addTransaction(settlementTx);

            } else {
                // Already paid
                updates.payment = { ...order.payment, status: 'paid' };
            }

            await updateTransaction(order.id, updates);

            // Update local state for the success screen
            const updatedOrder = { ...order, ...updates };

            setDeliveryModal(prev => ({
                ...prev,
                step: 'success',
                order: updatedOrder
            }));

        } catch (error) {
            console.error("Delivery Update Failed:", error);
            alert("Failed to update order. See console.");
        }
    };

    return {
        // State
        selectedOrder, setSelectedOrder,
        showReceipt, setShowReceipt,
        deliveryModal, setDeliveryModal,
        settleMethod, setSettleMethod,
        accessDeniedModal, setAccessDeniedModal,
        // Handlers
        handlePrint,
        handleSmartShare,
        handleMarkReady,
        openDeliveryModal,
        confirmDelivery
    };
};

export default useOrderActions;
