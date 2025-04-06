import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
// Import central types (adjust path as needed)
// import { AnalysisData, AnalysisToken, AnalysisAnnotation, WordTiming } from '@/types'; // Assuming a central @/types file

// --- Re-add Local Definitions for Now --- START
interface WordTiming {
  word: string;
  start: number;
  end: number;
  confidence: number;
}
interface AnalysisToken {
  text: string;
  index: number;
  lemma: string;
  pos: string;
  english: string | null;
  russian: string | null;
  annotation_ids: string[];
}
interface AnalysisAnnotation {
  type: string;
  scope_indices: number[];
  label: string;
  explanation_spanish: string;
  explanation_english: string;
  explanation_russian: string;
}
interface AnalysisData {
  generated_text: {
    spanish_plain: string;
    tokens: AnalysisToken[];
    annotations: Record<string, AnalysisAnnotation>;
  };
  english_translation_plain: string;
}
// --- Re-add Local Definitions for Now --- END

interface AudioPlayerProps {
  audioUrl: string;
  wordTimings: WordTiming[];
  text: string;
  analysisData: AnalysisData | null; 
}

// --- Popup Component --- START (Simple placeholder for now)
interface WordPopupProps {
  data: { 
      token?: AnalysisToken; // Make token optional
      annotations?: AnalysisAnnotation[]; // Make annotations optional
      error?: string; 
      word?: string; // Add word for error display
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
  const { token, annotations: rawAnnotations } = data;
  if (!token) return null; // Should not happen if no error, but safeguard

  // Provide default empty array for annotations if undefined
  const annotations = rawAnnotations || [];

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
      <strong>{token.text}</strong>
      <p><em>({token.lemma}, {token.pos})</em></p>
      {token.english && <p><strong>EN:</strong> {token.english}</p>}
      {token.russian && <p><strong>RU:</strong> {token.russian}</p>}
      
      {annotations.length > 0 && <hr style={{margin: '12px 0'}} />}
      
      {annotations.map((ann, idx) => (
        <div key={idx} className="annotation-block" style={{ marginTop: idx > 0 ? '10px' : '0' }}>
          <strong className="annotation-label">{ann.label} ({ann.type})</strong>
          <p><strong>ES:</strong> {ann.explanation_spanish}</p>
          <p><strong>EN:</strong> {ann.explanation_english}</p>
          <p><strong>RU:</strong> {ann.explanation_russian}</p>
        </div>
      ))}
    </div>
  );
};
// --- Popup Component --- END

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, wordTimings, text, analysisData }) => {
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
  const handleWordClick = (timing: WordTiming) => {
    if (playerRef.current) {
      playerRef.current.seekTo(timing.start, 'seconds');
      setCurrentTime(timing.start); // Update time immediately for click responsiveness
      setIsPlaying(true);
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

  // --- Hover Handlers --- START
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
      console.log('Analysis Data Available:', !!analysisData);
      
      // --- Log the received analysisData object structure --- START
      console.log('Inspecting analysisData structure:', JSON.stringify(analysisData, null, 2));
      // --- Log the received analysisData object structure --- END
      
      // --- Log first few tokens from analysis for comparison --- START
      if (analysisData?.generated_text?.tokens) { // Check if tokens exist before logging/using
        console.log('First ~10 tokens from analysisData:', 
          analysisData.generated_text.tokens.slice(0, 10).map(t => `"${t.text}"`).join(', ')
        );
      } else {
          console.log('analysisData.generated_text.tokens is missing or empty.');
      }
      // --- Log first few tokens from analysis for comparison --- END
      
      const hoveredWordTiming = wordTimings[index];
      if (!hoveredWordTiming) { /* Safety check */ return; }

      // --- Find Token by Matching Text --- START
      const targetWordText = hoveredWordTiming.word;
      const cleanedTargetWord = cleanWord(targetWordText); // Clean the word from timing

      // --- Log first few tokens from analysis for comparison --- START
      if (analysisData?.generated_text?.tokens) {
        console.log('First ~10 tokens from analysisData:', 
          analysisData.generated_text.tokens.slice(0, 10).map(t => `"${t.text}"`).join(', ')
        );
      }
      // --- Log first few tokens from analysis for comparison --- END

      const foundToken = analysisData?.generated_text?.tokens?.find(token => { 
          const cleanedTokenText = cleanWord(token.text); // Clean the token text
          return cleanedTokenText === cleanedTargetWord; // Compare cleaned versions
      });
      console.log(`Looking for token matching cleaned word: "${cleanedTargetWord}" (Original: "${targetWordText}")`);
      console.log('Matching Token Data Found:', foundToken);
      // --- Find Token by Matching Text --- END

      if (!foundToken) {
        console.warn(`No analysis token data found matching word: "${targetWordText}"`);
        setPopupData({ error: 'Missing analysis data for word', word: targetWordText }); 
        setPopupPosition({ x: event.clientX, y: event.clientY });
        setIsPopupVisible(true);
        return;
      }

      const annotations = foundToken.annotation_ids
        .map(id => analysisData?.generated_text?.annotations?.[id])
        .filter((ann): ann is AnalysisAnnotation => !!ann); 
      
      const popupInfo = {
          token: foundToken,
          annotations: annotations,
      };

      setPopupData(popupInfo);
      // --- Fetch Real Data --- END

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
  // --- Hover Handlers --- END

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

      // --- Find Corresponding Analysis Token & Annotations --- START
      let analysisClasses = '';
      let associatedAnnotationTypes = new Set<string>();

      if (analysisData?.generated_text?.tokens) {
        const targetWordText = timing.word;
        const cleanedTargetWord = cleanWord(targetWordText); 

        // Find the *first* matching token (limitations discussed previously apply)
        const foundToken = analysisData.generated_text.tokens.find(token => {
            const cleanedTokenText = cleanWord(token.text); 
            return cleanedTokenText === cleanedTargetWord;
        });

        if (foundToken && foundToken.annotation_ids.length > 0) {
          foundToken.annotation_ids.forEach(id => {
            const annotation = analysisData?.generated_text?.annotations?.[id];
            if (annotation) {
              associatedAnnotationTypes.add(annotation.type); // Collect unique types
            }
          });
        }
        // Convert types to CSS classes (e.g., 'annotation-slang', 'annotation-grammar')
        analysisClasses = Array.from(associatedAnnotationTypes).map(type => `annotation-${type}`).join(' ');
      }
      // --- Find Corresponding Analysis Token & Annotations --- END

      return (
        <span
          key={index}
          onClick={() => handleWordClick(timing)}
          onMouseEnter={(e) => handleMouseEnter(e, index)}
          onMouseLeave={handleMouseLeave}
          className={analysisClasses} // Add generated classes
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
            // Subtle hover effect remains, playback highlight takes precedence
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
          controls={true}
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