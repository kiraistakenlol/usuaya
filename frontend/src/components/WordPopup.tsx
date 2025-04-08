import React, { useRef, useState, useEffect } from 'react';
// Import shared analysis types from the central location
import {AnalysisAnnotation, AnalysisByIndexEntry} from '@/types/analysis';

// Update PopupData to expect annotations with instance numbers
interface ProcessedAnnotation {
    annotation: AnalysisAnnotation;
    instanceNumber: number;
}

interface PopupData {
    word: string;
    analysisEntry?: AnalysisByIndexEntry;
    annotations?: ProcessedAnnotation[]; // Use ProcessedAnnotation type
    error?: string;
}

interface WordPopupProps {
    data: PopupData | null;
    position: { x: number; y: number } | null; // Allow null initial position
    onClose?: () => void; // Optional close handler
}

const WordPopup: React.FC<WordPopupProps> = ({data, position, onClose}) => {
    const popupRef = useRef<HTMLDivElement>(null); // Ref to measure the popup
    // State to hold the final calculated position
    const [adjustedPosition, setAdjustedPosition] = useState<{ x: number; y: number } | null>(null);
    // State to control visibility after position calculation
    const [isVisible, setIsVisible] = useState(false);

    // Effect to calculate adjusted position when data or initial position changes
    useEffect(() => {
        if (data && position && popupRef.current) {
            const popupElement = popupRef.current;
            const popupRect = popupElement.getBoundingClientRect(); // Get actual rendered size
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const offsetX = 15; // Desired offset from cursor
            const offsetY = 15;
            const margin = 10; // Margin from viewport edges

            let calculatedX = position.x + offsetX;
            let calculatedY = position.y + offsetY;

            // Adjust X position if going off-screen right
            if (calculatedX + popupRect.width + margin > viewportWidth) {
                // Try positioning to the left of the cursor
                calculatedX = position.x - popupRect.width - offsetX;
                // If it *still* goes off-screen left (small screens), clamp it
                if (calculatedX < margin) {
                   calculatedX = margin;
                }
            }
            // Ensure it doesn't go off-screen left initially
            if (calculatedX < margin) {
                calculatedX = margin;
            }

            // Adjust Y position if going off-screen bottom
            if (calculatedY + popupRect.height + margin > viewportHeight) {
                // Try positioning above the cursor
                calculatedY = position.y - popupRect.height - offsetY;
                // If it *still* goes off-screen top, clamp it
                if (calculatedY < margin) {
                   calculatedY = margin;
                }
            }
            // Ensure it doesn't go off-screen top initially
             if (calculatedY < margin) {
                calculatedY = margin;
            }

            setAdjustedPosition({ x: calculatedX, y: calculatedY });
            setIsVisible(true); // Make visible after calculation
        } else {
            // Reset if data/position is removed
             setAdjustedPosition(null);
             setIsVisible(false);
        }
    }, [data, position]); // Re-calculate when data or initial mouse position changes

    // If no data or position hasn't been calculated yet, don't render
    if (!data || !position) return null;

    const popupStyle: React.CSSProperties = {
        position: 'fixed',
        // Apply calculated position, start hidden/off-screen until calculation
        top: adjustedPosition ? `${adjustedPosition.y}px` : '-9999px',
        left: adjustedPosition ? `${adjustedPosition.x}px` : '-9999px',
        visibility: isVisible ? 'visible' : 'hidden', // Control visibility
        opacity: isVisible ? 1 : 0, // Optional: fade in
        transition: 'opacity 0.1s ease-in-out', // Optional: fade transition
        backgroundColor: '#ffffff', // Ensure solid white background
        border: '1px solid #e0e0e0', // Lighter border
        borderRadius: '10px', // Slightly more rounded corners
        padding: '12px 16px', // Adjusted padding
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)', // Softer shadow
        zIndex: 1000,
        maxWidth: '380px',
        minWidth: '220px',
        fontSize: '14px',
        color: '#444', // Slightly darker base text
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        lineHeight: '1.5',
    };

    const headerStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px', // Increased margin
        paddingBottom: '8px', // Increased padding
        borderBottom: '1px solid #f0f0f0', // Lighter separator
        // Optional: Subtle gradient background
        // background: 'linear-gradient(to bottom, #f9f9f9, #f0f0f0)',
    };

    const wordStyle: React.CSSProperties = {
        fontWeight: '600', // Slightly bolder
        fontSize: '17px', // Larger font size
        color: '#222', // Darker word color
    };

    const closeButtonStyle: React.CSSProperties = {
        background: 'none',
        border: 'none',
        fontSize: '20px', // Slightly larger close button
        cursor: 'pointer',
        color: '#999', // Lighter close button color
        padding: '0 4px',
        lineHeight: 1, // Ensure proper alignment
    };

    const errorStyle: React.CSSProperties = {
        color: '#d9534f', // Softer red
        fontWeight: 'bold',
    };

    const annotationStyle: React.CSSProperties = {
        marginTop: '12px', // Increased spacing
        paddingTop: '12px',
        borderTop: '1px dashed #e5e5e5', // Lighter dashed border
    };

    const annotationTitleStyle: React.CSSProperties = {
        fontWeight: '600',
        color: '#666', // Slightly darker annotation title
        marginBottom: '6px', // Increased spacing below title
        fontSize: '13px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    };

    const detailItemStyle: React.CSSProperties = { // Style for each detail line
        marginBottom: '4px',
    };

    const detailLabelStyle: React.CSSProperties = { // Style for labels like "Lemma:", "POS:"
        fontWeight: 600,
        color: '#555',
        display: 'inline-block',
        minWidth: '80px' // Align values
    };

    // Helper function to get badge color based on POS
    const getPosBadgeColor = (pos: string): string => {
        const lowerPos = pos.toLowerCase();
        switch (lowerPos) {
            case 'noun':
            case 'propn': // Proper Noun
                return '#1f77b4'; // Blue
            case 'verb':
            case 'aux': // Auxiliary verb
                return '#2ca02c'; // Green
            case 'adj': // Adjective
                return '#ff7f0e'; // Orange
            case 'adv': // Adverb
                return '#d62728'; // Red
            case 'pron': // Pronoun
                return '#9467bd'; // Purple
            case 'adp': // Adposition (Preposition/Postposition)
                return '#8c564b'; // Brown
            case 'conj':
            case 'cconj': // Coordinating conjunction
            case 'sconj': // Subordinating conjunction
                return '#e377c2'; // Pink
            case 'det': // Determiner
                return '#bcbd22'; // Olive
            case 'intj': // Interjection
                return '#7f7f7f'; // Gray
            case 'num': // Numeral
                return '#17becf'; // Cyan
            case 'part': // Particle
                return '#aec7e8'; // Light Blue
            case 'punct': // Punctuation
                return '#ffbb78'; // Light Orange
            case 'sym': // Symbol
                return '#98df8a'; // Light Green
            case 'x': // Other
                return '#c5b0d5'; // Light Purple
            default:
                return '#6c757d'; // Default Gray
        }
    };

    // Helper function to get badge color based on Annotation Type
    const getAnnotationTypeBadgeColor = (type: string): string => {
        const lowerType = type.toLowerCase();
        switch (lowerType) {
            case 'grammar':
                return '#1f77b4'; // Blue
            case 'slang':
                return '#2ca02c'; // Green
            case 'idiom':
                return '#9467bd'; // Purple
            case 'cultural':
            case 'cultural_note':
                return '#ff7f0e'; // Orange
            default:
                return '#6c757d'; // Default Gray
        }
    };

    const posBadgeStyle: React.CSSProperties = { // Base style for the POS badge
        display: 'inline-block',
        padding: '2px 6px',
        fontSize: '11px',
        fontWeight: 600,
        lineHeight: 1,
        color: '#fff',
        backgroundColor: '#6c757d', // Default gray badge color
        borderRadius: '4px',
        marginLeft: '8px', // Add some space after the lemma
        textTransform: 'uppercase',
    };

    const annotationTypeBadgeStyle: React.CSSProperties = { // Style for Annotation Type badge
        display: 'inline-block',
        padding: '2px 5px',
        fontSize: '10px',
        fontWeight: 600,
        lineHeight: 1,
        color: '#fff',
        borderRadius: '3px',
        marginRight: '6px', // Space between badge and label
        textTransform: 'uppercase',
        verticalAlign: 'middle', // Align with text
    };

    const renderContent = () => {
        if (data.error) {
            return (
                <div>
                    <p style={wordStyle}>{data.word}</p>
                    <p style={errorStyle}>Error: {data.error}</p>
                </div>
            );
        }

        if (!data.analysisEntry) {
            return <p style={wordStyle}>{data.word} (No analysis details)</p>;
        }

        const {analysisEntry, annotations} = data;

        return (
            <>
                {/* Removed redundant Original word display, it's in the header */}
                {/*
        <div style={detailItemStyle}>
          <span style={detailLabelStyle}>Original:</span> {analysisEntry.original_word}
        </div> 
        */}
                {analysisEntry.english_word_translation && (
                    <div style={detailItemStyle}>
                        <span style={detailLabelStyle}>Eng:</span> {analysisEntry.english_word_translation}
                    </div>
                )}
                <div style={detailItemStyle}>
                    <span style={detailLabelStyle}>Lemma:</span>
                    {analysisEntry.lemma}
                    {analysisEntry.pos && ( /* Display POS badge if available */
                        <span style={{
                            ...posBadgeStyle, // Spread the base style
                            backgroundColor: getPosBadgeColor(analysisEntry.pos) // Apply dynamic color
                        }}>
              {analysisEntry.pos}
            </span>
                    )}
                </div>

                {annotations && annotations.length > 0 && (
                    <div style={annotationStyle}>
                        <p style={annotationTitleStyle}>Annotations:</p>
                        <ul style={{paddingLeft: '20px', margin: 0}}> {/* Basic list styling */}
                            {annotations.map(({ annotation: ann, instanceNumber }, index) => (
                                <li key={`${ann.label}-${index}`}
                                    style={{marginBottom: '6px'}}> {/* Increased margin */}
                                    <span style={{ /* Annotation Type Badge */
                                        ...annotationTypeBadgeStyle,
                                        backgroundColor: getAnnotationTypeBadgeColor(ann.type)
                                    }}>
                    {ann.type}
                  </span>
                                    {/* Display Instance Number */}
                                    <sup style={{ fontWeight: 'bold', marginLeft: '3px', marginRight: '3px' }}>
                                        {instanceNumber}
                                    </sup>
                                    <strong>[{ann.label}]</strong> {ann.explanation_english}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </>
        );
    };

    return (
        // Add the ref to the main div
        <div ref={popupRef} style={popupStyle}>
            <div style={headerStyle}>
                <span style={wordStyle}>{data.word}</span>
                {onClose && (
                    <button onClick={onClose} style={closeButtonStyle} aria-label="Close popup">
                        &times;
                    </button>
                )}
            </div>
            {renderContent()}
        </div>
    );
};

export default WordPopup; 