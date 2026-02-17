import React from 'react';
import { format } from 'date-fns';
import { Printer, Share2 } from 'lucide-react';

import { useSettings } from '../context/SettingsContext';
import PrintArea from './PrintArea';

const ReceiptPrinter = ({ transaction, type = 'TAX_INVOICE' }) => {
    const isBooking = type === 'ORDER_BOOKING';
    const { businessName, businessAddress, businessPhone, businessFooter } = useSettings();

    // Formatting Helpers
    const formatCurrency = (amount) => Number(amount).toFixed(2);
    const formatDate = (dateString) => format(new Date(dateString), 'dd-MMM-yyyy');

    // Fixed width text helper (simple padding)
    const padRight = (str, len) => str.padEnd(len, ' ').slice(0, len);
    const padLeft = (str, len) => str.padStart(len, ' ').slice(-len);

    // The separator line - CSS based for responsiveness (works on 58mm and 80mm)
    const SeparatorLine = () => (
        <div style={{
            borderBottom: '1px dashed black',
            margin: '5px 0',
            width: '100%',
            height: '1px'
        }} />
    );

    const Header = () => (
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>{businessName}</div>
            {businessAddress && <div style={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>{businessAddress}</div>}
            {businessPhone && <div style={{ fontSize: '12px', marginTop: '2px' }}>Ph: {businessPhone}</div>}
        </div>
    );

    // Common Container Styles for the receipt paper itself
    const containerStyle = {
        width: '100%',
        maxWidth: '80mm', // Constraint for desktop, fully responsive for float
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: '12px',
        lineHeight: '1.2',
        color: 'black',
        background: 'white',
        padding: '5px 5px', // Minimal padding
        whiteSpace: 'pre-wrap',
        margin: '0 auto',
        // Shadow is now handled by the parent wrapper in PublicInvoice
        boxShadow: 'none'
    };

    // Print CSS
    // Simplified Print CSS - RELIES ON PARENT PrintArea TO HANDLE VISIBILITY
    const printStyle = `
        @media print {
            @page { size: auto; margin: 0mm; }
            html, body {
                height: auto !important;
                overflow: visible !important;
                background: white !important;
            }
            
            /* Ensure the receipt itself is visible and styled correctly */
            #printable-receipt {
                width: 100% !important; /* Full width of the paper */
                max-width: 100% !important; /* Allow filling small papers */
                padding: 2px 2px !important; /* Absolute minimum padding for thermal */
                margin: 0 !important; /* Let printer driver handle margins */
                background: white !important;
                /* Match the nice font stack from the preview */
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
                color: black !important;
                font-size: 12px !important;
                line-height: 1.2 !important;
                white-space: pre-wrap !important;
            }

            /* Ensure all children are visible */
            #printable-receipt * {
                visibility: visible !important; 
                color: black !important;
            }
            
            .no-print { display: none !important; }
        }
    `;

    const handlePrint = () => {
        window.print();
    };

    const handleShare = () => {
        // FORCE the Network IP for the link so it works on phones even if generated from localhost
        const PUBLIC_HOST = 'http://192.168.1.30:5173';
        const link = `${PUBLIC_HOST}/view/${transaction.id}`;
        const phone = transaction.customer?.phone || transaction.customerPhone || '';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        // Use \n for newlines, we will encode it later
        const message = `*THE CLASSIC CONFECTION* 🧁\n` +
            `Hello *${transaction.customer?.name || transaction.customerName || 'Customer'}*,\n` +
            `Here is your receipt link for Order *#${transaction.id.slice(-6).toUpperCase()}*:\n` +
            `${link}\n\n` +
            `Please visit us again! 🙏\n` +
            `(Generated: ${new Date().toLocaleTimeString()})`; // Force unique message

        // Properly encode the message
        const encodedMessage = encodeURIComponent(message);

        // Only show alert if user is on localhost to warn them
        if (isLocalhost) {
            alert(`⚠️ WARNING: You are on 'localhost'. \nThis link will fail with 'SSL Error' on some browsers and WON'T work on phones.\n\nLINK: ${link}\n\nPlease open the app using your Network IP to generate shareable links.`);
        }

        const url = phone
            ? `https://wa.me/91${phone}?text=${encodedMessage}`
            : `https://wa.me/?text=${encodedMessage}`;
        window.open(url, '_blank');
    };

    // Render Content Logic
    const renderContent = () => {
        if (!isBooking) {
            // 1. QUICK MODE (INVOICE)
            return (
                <>
                    <SeparatorLine />
                    <Header />
                    <SeparatorLine />

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>INVOICE NO: #{transaction.id?.slice(-8).toUpperCase() || 'POS-8921'}</span>
                        <span>Date: {formatDate(transaction.date || transaction.createdAt)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Cashier: Ankit</span>
                        <span>Time: {format(new Date(transaction.date || transaction.createdAt), 'hh:mm a')}</span>
                    </div>
                    {/* Customer Details if present (even in Quick Mode sometimes) */}
                    {transaction.customerName && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                            <span>CUSTOMER:</span>
                            <span className="uppercase">{transaction.customerName}</span>
                        </div>
                    )}

                    <SeparatorLine />
                    {/* Header Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '18fr 6fr 9fr 9fr' }}>
                        <span>ITEM</span>
                        <span style={{ textAlign: 'center' }}>QTY</span>
                        <span style={{ textAlign: 'right' }}>RATE</span>
                        <span style={{ textAlign: 'right' }}>AMT</span>
                    </div>
                    <SeparatorLine />

                    {/* Items */}
                    {(transaction.items || []).map((item, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '18fr 6fr 9fr 9fr', marginBottom: '4px' }}>
                            <span>{item.name}</span>
                            <span style={{ textAlign: 'center' }}>{item.qty || item.quantity}</span>
                            <span style={{ textAlign: 'right' }}>{formatCurrency(item.price)}</span>
                            <span style={{ textAlign: 'right' }}>{formatCurrency(item.price * (item.qty || item.quantity))}</span>
                        </div>
                    ))}

                    <SeparatorLine />
                    <div>Total Qty: {(transaction.items || []).reduce((acc, i) => acc + (i.qty || i.quantity || 0), 0)}</div>
                    <SeparatorLine />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 'bold' }}>
                        <span>GRAND TOTAL:</span>
                        <span>{formatCurrency(transaction.totalValue || transaction.amount)}</span>
                    </div>

                    <SeparatorLine />
                    <SeparatorLine />

                    {transaction.payment?.balanceMethod ? (
                        <div style={{ fontSize: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Advance Paid ({transaction.payment.method?.toUpperCase()}):</span>
                                <span>{formatCurrency(transaction.payment.advance || transaction.advancePaid || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Balance Paid ({transaction.payment.balanceMethod?.toUpperCase()}):</span>
                                <span>{formatCurrency((transaction.totalValue || transaction.amount) - (transaction.payment.advance || transaction.advancePaid || 0))}</span>
                            </div>
                        </div>
                    ) : (
                        <div>Payment Mode: {transaction.payment?.method?.toUpperCase() || 'CASH'}</div>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '10px' }}>
                        <div>Thank you for visiting!</div>
                        <div>Have a sweet day! 🧁</div>
                    </div>
                    <SeparatorLine />
                </>
            );
        } else {
            // 2. ORDER MODE (BOOKING SLIP)
            return (
                <>
                    <SeparatorLine />
                    <Header />
                    <div style={{ textAlign: 'center', fontWeight: 'bold', marginTop: '5px' }}>** ORDER BOOKING SLIP **</div>
                    <SeparatorLine />

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Ref: #{transaction.id?.slice(-6).toUpperCase() || 'BK-104'}</span>
                        <span>Date: {formatDate(transaction.date || transaction.createdAt)}</span>
                    </div>

                    <SeparatorLine />
                    <div style={{ fontWeight: 'bold' }}>CUSTOMER DETAILS</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'min-content auto', gap: '10px' }}>
                        <span>Name:</span>
                        <span>{transaction.customer?.name || transaction.customerName || 'Walk-in'}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'min-content auto', gap: '10px' }}>
                        <span>Phone:</span>
                        <span>{transaction.customer?.phone || transaction.customerPhone || 'N/A'}</span>
                    </div>



                    <SeparatorLine />
                    <div style={{ fontWeight: 'bold' }}>📦 DELIVERY DUE:</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                        📅 {transaction.delivery ? format(new Date(transaction.delivery.date), 'dd-MMM-yyyy (EEEE)') :
                            (transaction.dueDate ? format(new Date(transaction.dueDate), 'dd-MMM-yyyy') : 'ASAP')}
                    </div>
                    {transaction.delivery?.time || transaction.dueTime ? (
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                            🕒 {transaction.delivery ? format(new Date(`2000-01-01T${transaction.delivery.time}`), 'hh:mm a') :
                                (transaction.dueTime ? format(new Date(`2000-01-01T${transaction.dueTime}`), 'hh:mm a') : '')}
                        </div>
                    ) : null}

                    <SeparatorLine />
                    <div style={{ fontWeight: 'bold' }}>ITEM DETAILS</div>
                    <SeparatorLine />

                    {(transaction.items || []).map((item, i) => (
                        <div key={i} style={{ marginBottom: '8px' }}>
                            <div style={{ fontWeight: 'bold' }}>{i + 1}. {item.name}</div>
                            <div style={{ paddingLeft: '15px' }}>
                                {item.note && <div>- Note: "{item.note}"</div>}
                                <div>- Rate: {formatCurrency(item.price)} x {item.qty || item.quantity}</div>
                            </div>
                        </div>
                    ))}

                    {/* Special Instructions - MOVED HERE & INLINE */}
                    {(transaction.customer?.note || transaction.note) && (
                        <>
                            <SeparatorLine />
                            <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                                NOTE: {transaction.customer?.note || transaction.note}
                            </div>
                        </>
                    )}

                    <SeparatorLine />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Amount:</span>
                        <span style={{ fontWeight: 'bold' }}>₹ {formatCurrency(transaction.totalValue || transaction.amount)}</span>
                    </div>
                    {!transaction.payment?.balanceMethod && (
                        <>
                            <SeparatorLine />
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>ADVANCE PAID:</span>
                                <span>₹ {formatCurrency(transaction.payment?.advance || transaction.advancePaid || 0)}</span>
                            </div>
                            <SeparatorLine />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 'bold' }}>
                                <span>⚠️ BALANCE DUE:</span>
                                <span>₹ {formatCurrency(transaction.payment?.balance || transaction.balanceDue || 0)}</span>
                            </div>
                        </>
                    )}
                    <SeparatorLine />

                    <div style={{ textAlign: 'center', marginTop: '5px' }}>
                        <div style={{ fontWeight: 'bold' }}>* PLEASE BRING THIS SLIP *</div>
                        <div style={{ fontSize: '11px' }}>Order is subject to confirmation.</div>
                    </div>
                    <SeparatorLine />
                </>
            );
        }
    };

    return (
        <>
            {/* Screen View - Visible only on screen, hidden automatically by PrintArea during print */}
            <div className="flex flex-col items-center gap-4 py-4 max-w-full overflow-hidden">
                <div style={containerStyle}>
                    {renderContent()}
                </div>
            </div>

            {/* Print View - Rendered in a top-level portal, visible only during print */}
            <PrintArea>
                <div id="printable-receipt">
                    <style>{printStyle}</style>
                    {renderContent()}
                </div>
            </PrintArea>
        </>
    );
};

export default ReceiptPrinter;
