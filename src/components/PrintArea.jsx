import React from 'react';
import { createPortal } from 'react-dom';

/**
 * PrintArea Component
 * 
 * Renders its children into a portal attached to document.body.
 * The content is hidden on screen but visible when printing.
 * This bypasses all modal/animation contexts that break printing.
 */
const PrintArea = ({ children }) => {
    // If no children, render nothing
    if (!children) return null;

    return createPortal(
        <div id="print-area-global">
            <style>{`
                /* Hide on screen */
                #print-area-global {
                    display: none;
                }

                /* Show in print */
                @media print {
                    /* Hide EVERYTHING else */
                    body > *:not(#print-area-global) {
                        display: none !important;
                    }

                    /* Show this container */
                    #print-area-global {
                        display: block !important;
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        background: white;
                        z-index: 2147483647; /* Max z-index */
                    }

                    /* Reset body */
                    body, html {
                        overflow: visible !important;
                        height: auto !important;
                        background: white !important;
                    }
                }
            `}</style>
            {children}
        </div>,
        document.body
    );
};

export default PrintArea;
