import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
// Import central types (adjust path as needed)
// import { AnalysisData, AnalysisToken, AnalysisAnnotation, WordTiming } from '@/types'; // Assuming a central @/types file

// --- Restore Local Definitions --- START
export interface WordTiming { 
  index: number;
  word: string;
  start: number;
  end: number;
  confidence: number;
}

// Add IndexedWordSegment definition
export interface IndexedWordSegment {
  index: number;
  word: string;
  start: number;
  end: number;
  confidence: number;
}

// Add missing/renamed interfaces back locally for now
export interface AnalysisAnnotation {
  type: string;
  scope_indices: number[]; 
  label: string;
  explanation_spanish: string;
  explanation_english: string;
  // explanation_russian: string; // Removed for now
}
export interface AnalysisByIndexEntry {
  original_word: string;
  lemma: string;
  pos: string;
  english_word_translation: string | null;
  // russian_word_translation: string | null; // Removed for now
  annotation_ids: string[]; 
}

// --- Add English Types (matching page.tsx) --- START
export interface EnglishToken {
  text: string;
}

export interface EnglishData {
  tokens: EnglishToken[];
  spanish_index_to_english_indices: Record<string, number[]>;
}
// --- Add English Types (matching page.tsx) --- END

export interface AnalysisResult {
  analysis_by_index: Record<string, AnalysisByIndexEntry>; 
  annotations: Record<string, AnalysisAnnotation>;
  // english_translation_plain: string; // Removed
}

// --- Add TextAnalysisData (if not imported) --- START
// This might be redundant if imported, but ensure it exists locally for props
export interface TextAnalysisData {
  spanish_plain: string;
  word_timings: IndexedWordSegment[]; // Assuming IndexedWordSegment is defined/imported
  analysis_result: AnalysisResult;
  english_data: EnglishData; 
}
// --- Add TextAnalysisData (if not imported) --- END

// --- Restore Local Definitions --- END

// Restore Props
interface AudioPlayerProps {
  audioUrl: string; // Will receive blob URL
  wordTimings: WordTiming[];
  analysisResult: AnalysisResult | null;
  onHighlightIndexChange: (index: number | null) => void; // Callback prop
  // englishData: EnglishData | null; // Add if needed for inline English highlighting
}

// --- Restore Popup Component --- START
// ... (Paste the WordPopup component definition here again) ...
interface WordPopupProps {
  data: { 
      analysisEntry?: AnalysisByIndexEntry; 
      annotations?: AnalysisAnnotation[]; 
      error?: string; 
      word?: string; 
  } | null; 
  position: { x: number; y: number };
}

const WordPopup: React.FC<WordPopupProps> = ({ data, position }) => {
  if (!data || !position) return null;
  if (data.error) {
     return (
       <div className="word-popup error" style={{ position: 'absolute', left: `${position.x}px`, top: `${position.y}px`, transform: 'translate(10px, 10px)', zIndex: 1000 }}>
         <strong>{data.word || 'Error'}</strong> 
         <p><em>{data.error}</em></p>
       </div>
     );
  }
  const { analysisEntry, annotations } = data;
  if (!analysisEntry) return null;
  const safeAnnotations = annotations || [];
  return (
    <div className="word-popup" style={{ position: 'absolute', left: `${position.x}px`, top: `${position.y}px`, transform: 'translate(10px, 10px)', zIndex: 1000 }}>
      <strong>{analysisEntry.original_word}</strong>
      <p><em>({analysisEntry.lemma}, {analysisEntry.pos})</em></p>
      {analysisEntry.english_word_translation && <p><strong>EN:</strong> {analysisEntry.english_word_translation}</p>}
      {safeAnnotations.length > 0 && <hr style={{margin: '12px 0'}} />}
      {safeAnnotations.map((ann, idx) => (
        <div key={idx} className="annotation-block" style={{ marginTop: idx > 0 ? '10px' : '0' }}>
          <strong className="annotation-label">{ann.label} ({ann.type})</strong>
          <p><strong>ES:</strong> {ann.explanation_spanish}</p>
          <p><strong>EN:</strong> {ann.explanation_english}</p>
        </div>
      ))}
    </div>
  );
};
// --- Restore Popup Component --- END

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioUrl, 
  wordTimings, 
  analysisResult,
  onHighlightIndexChange // Destructure callback
}) => {
  // Restore State
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);
  const previousHighlightIndexRef = useRef<number | null>(null); // Ref to track previous index

  // Restore Popup State
  const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [popupData, setPopupData] = useState<any | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Restore Handlers
  const handleReady = () => {
    console.log('Player is ready.');
    setIsPlayerReady(true);
  };

  const handleProgress = (state: { playedSeconds: number }) => {
    // console.log(`Progress update: playedSeconds=${state.playedSeconds.toFixed(3)}`); // Keep commented out unless needed
    setCurrentTime(state.playedSeconds);
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleEnded = () => setIsPlaying(false);

  // Function to format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Word Click Handler (Simplified Seek) ---
  const handleWordClick = (index: number) => {
    const timing = wordTimings[index];
    if (playerRef.current && timing && isPlayerReady) {
      console.log(`Clicked word index ${index}. Seeking to: ${timing.start}`);
      playerRef.current.seekTo(timing.start, 'seconds');
      // No need for pause/resume with blob URL hopefully
    } else {
      console.log(`Clicked word index ${index}, but player not ready or timing invalid.`);
    }
  };

  // --- Restore Hover Handlers --- START
  // ... (Paste handleMouseEnter and handleMouseLeave functions here) ...
  const handleMouseEnter = (event: React.MouseEvent<HTMLSpanElement>, index: number) => {
     setHoveredWordIndex(index);
     if (hoverTimerRef.current) {
       clearTimeout(hoverTimerRef.current);
     }
     hoverTimerRef.current = setTimeout(() => {
       // console logs removed previously
       const analysisEntry = analysisResult?.analysis_by_index?.[String(index)];
       const word = wordTimings[index]?.word || '(unknown word)'; 
       if (!analysisEntry) {
         console.warn(`No analysis entry found for index: ${index}`); 
         setPopupData({ error: 'Missing analysis data for word', word: word }); 
       } else {
         const annotations = analysisEntry.annotation_ids
           .map((id: string) => analysisResult?.annotations?.[id])
           .filter((ann): ann is AnalysisAnnotation => !!ann); 
         const popupInfo = { analysisEntry, annotations, word: analysisEntry.original_word || word };
         setPopupData(popupInfo);
       }
       setPopupPosition({ x: event.clientX, y: event.clientY });
       setIsPopupVisible(true);
     }, 500);
  };
  const handleMouseLeave = () => {
      setHoveredWordIndex(null);
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      setIsPopupVisible(false);
      setPopupData(null);
  };
  // --- Restore Hover Handlers --- END
  
  // --- Restore Text Rendering --- START
  // ... (Paste renderText function here) ...
  const renderText = () => {
    // Calculate highlightIndex based on currentTime
    let highlightIndex: number | null = wordTimings.findLastIndex(
      timing => currentTime >= timing.start && currentTime < timing.end
    );
    if (highlightIndex === -1 && wordTimings.length > 0 && currentTime > 0) {
        const lastStartedIndex = wordTimings.findLastIndex(timing => currentTime >= timing.start);
        if (lastStartedIndex !== -1 && currentTime <= duration ) {
             highlightIndex = lastStartedIndex;
        } else {
          highlightIndex = null; // Explicitly set to null if no word matches
        }
    } else if (highlightIndex === -1) {
      highlightIndex = null; // Explicitly set to null if index is -1 initially
    }

    // --- Call callback if index changed --- START
    if (highlightIndex !== previousHighlightIndexRef.current) {
      onHighlightIndexChange(highlightIndex);
      previousHighlightIndexRef.current = highlightIndex;
    }
    // --- Call callback if index changed --- END

    return wordTimings.map((timing, index) => {
      const isCurrentWord = index === highlightIndex;
      let analysisClasses = '';
      const analysisEntry = analysisResult?.analysis_by_index?.[String(index)];
      if (analysisEntry && analysisEntry.annotation_ids.length > 0) {
        let associatedAnnotationTypes = new Set<string>();
        analysisEntry.annotation_ids.forEach((id: string) => {
          const annotation = analysisResult?.annotations?.[id];
          if (annotation) { associatedAnnotationTypes.add(annotation.type); }
        });
        analysisClasses = Array.from(associatedAnnotationTypes).map(type => `annotation-${type}`).join(' ');
      }

      return (
        <span
          key={`word-${index}`}
          onClick={() => handleWordClick(index)}
          onMouseEnter={(e) => handleMouseEnter(e, index)}
          onMouseLeave={handleMouseLeave}
          className={analysisClasses}
          style={{ /* ... existing styles ... */
             cursor: 'pointer',
             color: isCurrentWord ? 'white' : '#1a1a1a',
             transition: 'color 0.2s ease, background-color 0.2s ease',
             fontSize: '16px',
             lineHeight: '1.6',
             fontWeight: isCurrentWord ? 'bold' : 'normal',
             position: 'relative',
             display: 'inline-block',
             padding: '0 2px',
             backgroundColor: isCurrentWord ? '#3b82f6' : hoveredWordIndex === index ? '#e0e0e0' : 'transparent', 
             borderRadius: '4px',
             minWidth: '1em',
             textAlign: 'center',
          }}
        >
          {timing.word}{' '}
        </span>
      );
    });
  };
  // --- Restore Text Rendering --- END

  // --- Restore Keyboard Controls --- START
  // ... (Paste useEffect for handleKeyDown here) ...
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
       const target = event.target as HTMLElement;
       if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
         return;
       }

      if (event.code === 'Space') {
        event.preventDefault();
        setIsPlaying(prev => !prev); // Toggle playing state
      } else if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
        event.preventDefault();
        if (!playerRef.current || !isPlayerReady) return; // Check player ready state

        let targetTime = -1;
        const jumpAmount = 2;

        if (event.code === 'ArrowLeft') {
          targetTime = Math.max(0, currentTime - jumpAmount);
          console.log(`Arrow Left: Seeking back ${jumpAmount}s to ${targetTime.toFixed(2)}`);
        } else if (event.code === 'ArrowRight') {
          targetTime = Math.min(duration, currentTime + jumpAmount); // Use duration state
          console.log(`Arrow Right: Seeking forward ${jumpAmount}s to ${targetTime.toFixed(2)}`);
        }

        if (targetTime !== -1) {
          playerRef.current.seekTo(targetTime, 'seconds'); 
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [wordTimings, isPlaying, currentTime, isPlayerReady, duration]); // Add duration to dependencies
  // --- Restore Keyboard Controls --- END

  return (
    <div className="audio-player">
      <div className="player-controls">
        <ReactPlayer
          ref={playerRef}
          url={audioUrl} // Will be blob URL
          playing={isPlaying}
          onReady={handleReady} 
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onProgress={handleProgress} 
          onDuration={handleDuration} 
          width="100%"
          height="50px"
          controls={true} // Keep native controls
          progressInterval={100} // Restore progress interval
        />
      </div>
      
      {/* Restore Debug Seek if needed, or remove */}
      {/* <div className="debug-seek..."> ... </div> */}

      <div className="text-content" style={{ 
        marginTop: '20px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
      }}>
        {renderText()} {/* Render the interactive text */}
      </div>

      {/* Restore Popup Rendering */} 
      {isPopupVisible && popupData && popupPosition && (
        <WordPopup data={popupData} position={popupPosition} />
      )}
    </div>
  );
}; 