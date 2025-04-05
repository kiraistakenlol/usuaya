import React, { useState, useRef } from 'react';
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
    const words = text.split(/\s+/);
    return words.map((word, index) => {
      const timing = wordTimings.find(t => t.word.trim() === word);
      const isCurrentWord = timing && 
        currentTime >= timing.start && 
        currentTime <= timing.end;

      return (
        <span
          key={index}
          onClick={() => timing && handleWordClick(timing)}
          style={{
            cursor: timing ? 'pointer' : 'default',
            backgroundColor: isCurrentWord ? '#3b82f6' : 'transparent',
            color: isCurrentWord ? 'white' : '#1a1a1a',
            padding: '2px 4px',
            borderRadius: '4px',
            transition: 'all 0.2s ease',
            fontSize: '16px',
            lineHeight: '1.6',
            fontWeight: isCurrentWord ? 'bold' : 'normal',
            boxShadow: isCurrentWord ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            transform: isCurrentWord ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          {word}{' '}
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