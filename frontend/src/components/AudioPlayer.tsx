import React, {useEffect, useRef, useState} from 'react';
import ReactPlayer from 'react-player';

// Props required by the player itself
interface AudioPlayerProps {
    audioUrl: string | null; // Blob URL or null
    targetSeekTime: number | null; // Time to seek to when prop changes
    onTimeUpdate: (time: number) => void;
    onDurationChange: (duration: number) => void;
    onReady: () => void;
    onPlay: () => void;
    onPause: () => void;
    onEnded: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
                                                            audioUrl,
                                                            targetSeekTime,
                                                            onTimeUpdate,
                                                            onDurationChange,
                                                            onReady,
                                                            onPlay,
                                                            onPause,
                                                            onEnded,
                                                        }) => {
    const playerRef = useRef<ReactPlayer>(null);
    const [isPlayerReadyInternal, setIsPlayerReadyInternal] = useState(false);

    // Effect to handle seek commands from parent
    useEffect(() => {
        if (targetSeekTime !== null && playerRef.current && isPlayerReadyInternal) {
            console.log(`[AudioPlayer Component] Received seek command: ${targetSeekTime}`);
            playerRef.current.seekTo(targetSeekTime, 'seconds');
            // Parent is responsible for resetting targetSeekTime prop after processing
        }
    }, [targetSeekTime, isPlayerReadyInternal]);

    const handleReady = () => {
        console.log('[AudioPlayer Component] Ready.');
        setIsPlayerReadyInternal(true);
        onReady(); // Notify parent
    };

    const handleProgress = (state: { playedSeconds: number }) => {
        onTimeUpdate(state.playedSeconds);
    };

    // We only render the player if we have a valid URL
    if (!audioUrl) {
        return <div className="player-controls"><p className="text-gray-500 text-sm">Waiting for audio data...</p>
        </div>;
    }

    return (
        <div className="player-controls">
            <ReactPlayer
                ref={playerRef}
                url={audioUrl} // Use blob URL from props
                onReady={handleReady}
                onPlay={onPlay} // Pass parent handlers directly
                onPause={onPause} // Pass parent handlers directly
                onEnded={onEnded} // Pass parent handlers directly
                onProgress={handleProgress} // Calls onTimeUpdate prop
                onDuration={onDurationChange} // Pass parent handler directly
                width="100%"
                height="50px"
                controls={true} // Use native controls
                progressInterval={100}
            />
        </div>
    );
}; 