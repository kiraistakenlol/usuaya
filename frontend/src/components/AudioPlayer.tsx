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

interface AudioPlayerProps {
  audioUrl: string;
  wordTimings: WordTiming[];
  text: string; // This might be spanish_plain now? Let's leave as is for now.
  analysisResult: AnalysisResult | null; // Type now matches page.tsx
  englishData: EnglishData | null; // Add english_data separately for clarity
}

// --- Popup Component --- START (Simple placeholder for now)
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

  // Handle case where token data might be missing (error set in handleMouseEnter)
  if (data.error) {
     return (
       <div
         className="word-popup error"
         style={{
           position: 'absolute',
           left: `${position.x}px`,
           top: `${position.y}px`,
           transform: 'translate(10px, 10px)',
           zIndex: 1000,
         }}
       >
         {/* Use the word passed in the error data structure */}
         <strong>{data.word || 'Error'}</strong> 
         <p><em>{data.error}</em></p>
       </div>
     );
  }
  
  // If no error, token and annotations should exist (or be empty array)
  const { analysisEntry, annotations } = data;
  if (!analysisEntry) return null; // Should not happen if no error, but safeguard

  // Provide default empty array for annotations if undefined
  const safeAnnotations = annotations || [];

  return (
    <div
      className="word-popup"
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(10px, 10px)', 
        zIndex: 1000, 
      }}
    >
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
// --- Popup Component --- END

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, wordTimings, text, analysisResult, englishData }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<ReactPlayer>(null);
  
  // --- Popup State --- START
  const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [popupData, setPopupData] = useState<any | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  // --- Popup State --- END

  // --- Add useEffect for Keyboard Events --- START
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Allow default behavior if focused on input fields, etc.
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault(); // Prevent page scroll
        setIsPlaying(prev => !prev);
      } else if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
        event.preventDefault();
        if (!playerRef.current || wordTimings.length === 0) return;

        // --- Revised Word Index Logic --- START
        // Find the index of the last word that started at or before the current time
        let currentWordIndex = wordTimings.findLastIndex(
          timing => currentTime >= timing.start
        );

        // If findLastIndex returns -1 and currentTime > 0, it means we are past the last word
        if (currentWordIndex === -1 && currentTime > 0) {
           currentWordIndex = wordTimings.length -1; // Treat as being at the last word
        } else if (currentWordIndex === -1) {
           currentWordIndex = 0; // If time is before the first word start, treat as index 0 for nav
        }
        
        console.log(`Arrow Key: currentTime=${currentTime.toFixed(2)}, foundIndex=${currentWordIndex}`); // DEBUG LOG

        let targetWordIndex = -1;

        if (event.code === 'ArrowLeft') {
          // Go to the previous index, but not below 0
          targetWordIndex = Math.max(0, currentWordIndex - 1);
           // Special case: if already at the first word, pressing left again should seek to 0 time
           if (currentWordIndex === 0 && targetWordIndex === 0 && currentTime > 0) {
               playerRef.current.seekTo(0, 'seconds');
               return; // Don't proceed further
           }
        } else if (event.code === 'ArrowRight') {
          // Go to the next index, but not beyond the last word
          targetWordIndex = Math.min(wordTimings.length - 1, currentWordIndex + 1);
        }
        // --- Revised Word Index Logic --- END

        console.log(`Arrow Key: targetIndex=${targetWordIndex}`); // DEBUG LOG

        if (targetWordIndex !== -1 && targetWordIndex < wordTimings.length) {
          const targetTime = wordTimings[targetWordIndex].start;
          console.log(`Arrow Key: Seeking to time=${targetTime.toFixed(2)} for word '${wordTimings[targetWordIndex].word}'`); // DEBUG LOG
          playerRef.current.seekTo(targetTime, 'seconds');
          if (!isPlaying) setIsPlaying(true); // Optionally start playing on seek
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
    // Add dependencies: wordTimings, isPlaying, currentTime
  }, [wordTimings, isPlaying, currentTime]);
  // --- Add useEffect for Keyboard Events --- END

  // Find the current word based on playback time
  const getCurrentWord = (time: number) => {
    return wordTimings.find(
      timing => time >= timing.start && time <= timing.end
    );
  };

  // Handle time updates
  const handleProgress = (state: { playedSeconds: number }) => {
    setCurrentTime(state.playedSeconds);
  };

  // Handle duration change
  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  // Handle word click
  const handleWordClick = (index: number) => {
    const timing = wordTimings[index];
    if (playerRef.current && timing) {
      console.log(`Clicked word index ${index}, pausing and seeking to: ${timing.start}`);
      
      // Pause, then seek, then resume
      setIsPlaying(false); // Pause first
      playerRef.current.seekTo(timing.start, 'seconds');

      // Use a small timeout to allow seek to register before resuming play
      setTimeout(() => {
        setIsPlaying(true);
      }, 50); // Adjust delay if needed
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Helper function to clean word for matching --- START
  const cleanWord = (word: string): string => {
    // Convert to lowercase and remove common leading/trailing punctuation
    return word.toLowerCase().replace(/^[¡¿.,!?;:]+|[¡¿.,!?;:]+$/g, '');
  };
  // --- Helper function to clean word for matching --- END

  // --- Hover Handlers - Use analysisResult --- 
  const handleMouseEnter = (event: React.MouseEvent<HTMLSpanElement>, index: number) => {
    setHoveredWordIndex(index);
    // Clear any existing timer
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }

    // Set a new timer
    hoverTimerRef.current = setTimeout(() => {
      console.log('--- Popup Timer Fired ---'); 
      console.log('Hover Index (from wordTimings):', index);
      console.log('Analysis Result Available:', !!analysisResult);
      
      // --- Log the received analysisResult object structure --- START
      console.log('Inspecting analysisResult structure:', JSON.stringify(analysisResult, null, 2));
      // --- Log the received analysisResult object structure --- END
      
      // --- Log first few tokens from analysis for comparison --- START
      if (analysisResult?.analysis_by_index) {
        // Type the entry in map
        console.log('First ~10 analysis_by_index entries:', 
          Object.entries(analysisResult.analysis_by_index).slice(0, 10).map(([key, entry]: [string, AnalysisByIndexEntry]) => `"${entry.original_word}"`).join(', ')
        );
      } else {
          console.log('analysisResult.analysis_by_index is missing or empty.');
      }
      // --- Log first few tokens from analysis for comparison --- END
      
      const analysisEntry = analysisResult?.analysis_by_index?.[String(index)];
      const word = wordTimings[index]?.word || '(unknown word)'; // Get word from timings
      if (!analysisEntry) {
        console.warn(`No analysis entry found for index: ${index}`);
        setPopupData({ error: 'Missing analysis data for word', word: word }); 
      } else {
        // Add type for id parameter
        const annotations = analysisEntry.annotation_ids
          .map((id: string) => analysisResult?.annotations?.[id])
          .filter((ann): ann is AnalysisAnnotation => !!ann); 
        
        const popupInfo = {
            analysisEntry: analysisEntry,
            annotations: annotations,
            word: analysisEntry.original_word || word 
        };
        setPopupData(popupInfo);
      }

      setPopupPosition({ x: event.clientX, y: event.clientY });
      setIsPopupVisible(true);
    }, 500); // 500ms delay
  };

  const handleMouseLeave = () => {
    setHoveredWordIndex(null);
    // Clear the timer if the mouse leaves before 500ms
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    // Hide the popup immediately on leave
    setIsPopupVisible(false);
    setPopupData(null);
  };
  // --- Hover Handlers - Use analysisResult --- END

  // Split text into words and render with highlighting
  const renderText = () => {
    // Find the index of the word where currentTime is strictly between start and end
    let highlightIndex = wordTimings.findIndex(
      timing => currentTime >= timing.start && currentTime < timing.end
    );

    // If in a gap or after the last word's end, find the last word that started
    if (highlightIndex === -1 && wordTimings.length > 0 && currentTime > 0) {
        const lastStartedIndex = wordTimings.findLastIndex(timing => currentTime >= timing.start);
        // Ensure we don't highlight beyond the audio duration or before the first word
        if (lastStartedIndex !== -1 && currentTime <= duration ) {
             highlightIndex = lastStartedIndex;
        }
    }

    return wordTimings.map((timing, index) => {
      const isCurrentWord = index === highlightIndex; 

      // --- Get Annotation Classes --- 
      let analysisClasses = '';
      const analysisEntry = analysisResult?.analysis_by_index?.[String(index)];
      if (analysisEntry && analysisEntry.annotation_ids.length > 0) {
        let associatedAnnotationTypes = new Set<string>();
        // Add type for id parameter
        analysisEntry.annotation_ids.forEach((id: string) => {
          const annotation = analysisResult?.annotations?.[id];
          if (annotation) {
            associatedAnnotationTypes.add(annotation.type);
          }
        });
        analysisClasses = Array.from(associatedAnnotationTypes).map(type => `annotation-${type}`).join(' ');
      }
      // --- Get Annotation Classes --- 

      return (
        <span
          key={`word-${index}`}
          onClick={() => handleWordClick(index)}
          onMouseEnter={(e) => handleMouseEnter(e, index)}
          onMouseLeave={handleMouseLeave}
          className={analysisClasses}
          style={{
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

  return (
    <div className="audio-player" /* Add onMouseLeave to main container if needed to catch rapid movements */ >
      <div className="player-controls">
        <ReactPlayer
          ref={playerRef}
          url={audioUrl}
          playing={isPlaying}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onProgress={handleProgress}
          onDuration={handleDuration}
          width="100%"
          height="50px"
          controls={true} // Restore native controls
          progressInterval={100}
        />
      </div>
      <div className="text-content" style={{ 
        marginTop: '20px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
      }}>
        {renderText()}
      </div>
      {/* Render the Popup */} 
      {isPopupVisible && popupData && popupPosition && (
        <WordPopup data={popupData} position={popupPosition} />
      )}
    </div>
  );
}; 