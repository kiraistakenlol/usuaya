import React from 'react';
import { AnalysisAnnotation, AnalysisByIndexEntry } from '../app/texts/[textId]/page';

interface PopupData {
  word: string;
  analysisEntry?: AnalysisByIndexEntry;
  annotations?: AnalysisAnnotation[];
  error?: string;
}

interface WordPopupProps {
  data: PopupData | null;
  position: { x: number; y: number };
  onClose?: () => void; // Optional close handler
}

const WordPopup: React.FC<WordPopupProps> = ({ data, position, onClose }) => {
  if (!data) return null;

  const popupStyle: React.CSSProperties = {
    position: 'fixed',
    top: position.y + 15, // Offset slightly below the cursor
    left: position.x + 15, // Offset slightly to the right of the cursor
    backgroundColor: 'white',
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '15px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 1000, // Ensure it's above other elements
    maxWidth: '350px',
    minWidth: '200px',
    fontSize: '14px',
    color: '#333',
    fontFamily: 'sans-serif',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    borderBottom: '1px solid #eee',
    paddingBottom: '5px',
  };

  const wordStyle: React.CSSProperties = {
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#1a1a1a',
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#888',
    padding: '0 5px',
  };

  const errorStyle: React.CSSProperties = {
    color: 'red',
    fontWeight: 'bold',
  };

  const annotationStyle: React.CSSProperties = {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px dashed #eee',
  };

  const annotationTitleStyle: React.CSSProperties = {
    fontWeight: 'bold',
    color: '#555',
    marginBottom: '4px',
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

    const { analysisEntry, annotations } = data;

    return (
      <>
        <p><strong>Original:</strong> {analysisEntry.original_word}</p>
        <p><strong>Lemma:</strong> {analysisEntry.lemma}</p>
        <p><strong>POS Tag:</strong> {analysisEntry.tag}</p>
        {analysisEntry.dep && (
           <p><strong>Dependency:</strong> {analysisEntry.dep} (Head: {analysisEntry.head_index !== undefined ? analysisEntry.head_index : 'N/A'})</p>
        )}

        {annotations && annotations.length > 0 && (
          <div style={annotationStyle}>
            <p style={annotationTitleStyle}>Annotations:</p>
            <ul>
              {annotations.map((ann, index) => (
                <li key={`${ann.label}-${index}`}>
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
    <div style={popupStyle}>
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