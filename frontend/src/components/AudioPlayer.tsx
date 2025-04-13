import React, {useEffect, useRef, useState, forwardRef, useImperativeHandle} from 'react';
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

// Define the interface for the actions exposed by the ref
export interface AudioPlayerActions {
    togglePlayPause: () => void;
}

const AudioPlayer = forwardRef<AudioPlayerActions, AudioPlayerProps>((
    {
        audioUrl,
        targetSeekTime,
        onTimeUpdate,
        onDurationChange,
        onReady,
        onPlay,
        onPause,
        onEnded
    },
    ref // The forwarded ref
) => {
    const playerRef = useRef<ReactPlayer>(null);
    const [isPlayerReadyInternal, setIsPlayerReadyInternal] = useState(false);

    // --- Imperative Handle: Expose togglePlayPause --- START ---
    useImperativeHandle(ref, () => ({
        togglePlayPause: () => {
            const internalPlayer = playerRef.current?.getInternalPlayer();
            if (internalPlayer && typeof (internalPlayer as any).play === 'function' && typeof (internalPlayer as any).pause === 'function') {
                if ((internalPlayer as HTMLAudioElement).paused) {
                    console.log("[Ref Method] Calling play() on internal player");
                    (internalPlayer as HTMLAudioElement).play().catch(err => console.error("Play error:", err));
                } else {
                    console.log("[Ref Method] Calling pause() on internal player");
                    (internalPlayer as HTMLAudioElement).pause();
                }
            } else {
                console.warn("Could not get internal player or play/pause methods.");
            }
        }
    }), []); // Dependencies: none needed here usually
    // --- Imperative Handle: Expose togglePlayPause --- END ---

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
});

AudioPlayer.displayName = 'AudioPlayer'; // Added display name for ESLint rule

export default AudioPlayer; 