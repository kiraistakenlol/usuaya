import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';

interface WordTiming {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

interface AudioPlayerProps {
  audioUrl: string;
  wordTimings: WordTiming[];
  text: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, wordTimings, text }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<ReactPlayer>(null);

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
      const isCurrentWord = index === highlightIndex; // Highlight based on the calculated index

      return (
        <span
          key={index}
          onClick={() => handleWordClick(timing)}
          style={{
            cursor: 'pointer',
            color: isCurrentWord ? 'white' : '#1a1a1a',
            transition: 'color 0.2s ease',
            fontSize: '16px',
            lineHeight: '1.6',
            fontWeight: isCurrentWord ? 'bold' : 'normal',
            position: 'relative',
            display: 'inline-block',
            padding: '0 2px',
            backgroundColor: isCurrentWord ? '#3b82f6' : 'transparent',
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
    <div className="audio-player">
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
    </div>
  );
}; 