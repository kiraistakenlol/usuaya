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

        const currentWordIndex = wordTimings.findIndex(
          timing => currentTime >= timing.start && currentTime < timing.end
        );

        let targetWordIndex = -1;

        if (event.code === 'ArrowLeft') {
          if (currentWordIndex > 0) {
            targetWordIndex = currentWordIndex - 1;
          } else if (currentWordIndex === -1) { // If no word is active, find the closest previous one
             const potentialIndex = wordTimings.findLastIndex(t => t.start < currentTime);
             targetWordIndex = potentialIndex !== -1 ? potentialIndex : 0;
          } else {
             targetWordIndex = 0; // Go to the first word if already at the first word
          }
        } else if (event.code === 'ArrowRight') {
          if (currentWordIndex !== -1 && currentWordIndex < wordTimings.length - 1) {
            targetWordIndex = currentWordIndex + 1;
          } else if (currentWordIndex === -1) { // If no word is active, find the closest next one
             const potentialIndex = wordTimings.findIndex(t => t.start >= currentTime);
             targetWordIndex = potentialIndex !== -1 ? potentialIndex : wordTimings.length -1;
          } else {
             targetWordIndex = wordTimings.length - 1; // Go to the last word if already at the last
          }
        }

        if (targetWordIndex !== -1) {
          const targetTime = wordTimings[targetWordIndex].start;
          playerRef.current.seekTo(targetTime);
          setCurrentTime(targetTime); // Update current time immediately for responsiveness
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
      playerRef.current.seekTo(timing.start);
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
    return wordTimings.map((timing, index) => {
      const isCurrentWord = currentTime >= timing.start && currentTime <= timing.end;

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
        <div className="time-display">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
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