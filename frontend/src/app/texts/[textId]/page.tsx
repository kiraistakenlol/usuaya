'use client';

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useParams} from 'next/navigation';
import Link from 'next/link';
import AudioPlayer, { AudioPlayerActions } from '@/components/AudioPlayer';
import { TextAnalysisData, IndexedSpanishWordDetail } from '@/types/analysis';
import { API_URL, fetchWithErrorHandling } from '../../../utils/api';

interface WordTiming {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

interface Text {
  id: string;
  spanish_text: string;
  english_translation: string;
  audio: {
    id: string;
    file_id: string;
    word_timings: WordTiming[];
  } | null;
  analysis_data: any;
  created_at: string;
}

export default function TextDetailPage() {
  const params = useParams();
    const textId = params.textId as string;

  const [text, setText] = useState<Text | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
    const [audioError, setAudioError] = useState<string | null>(null);
    const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
    const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
    // --- State moved from old AudioPlayer --- START ---
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [targetSeekTime, setTargetSeekTime] = useState<number | null>(null); // State to trigger seek
    const [hoveredSpanishIndex, setHoveredSpanishIndex] = useState<number | null>(null);
    const [hoveredEnglishIndices, setHoveredEnglishIndices] = useState<Set<number>>(new Set());
    const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
    const [popupData, setPopupData] = useState<any | null>(null);
    const [isPopupVisible, setIsPopupVisible] = useState(false);
    const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
    // Ref for Audio Player control
    const audioPlayerRef = useRef<AudioPlayerActions>(null);
    // --- State moved from old AudioPlayer --- END ---

    // Effect to fetch text details
  useEffect(() => {
        if (!textId) return;
        setAudioBlobUrl(null);
        // Reset other states too
        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);
        setIsPlayerReady(false);
        setTargetSeekTime(null);
        setHoveredSpanishIndex(null);
        setHoveredEnglishIndices(new Set());
        setIsPopupVisible(false);

    const fetchText = async () => {
      setLoading(true);
      setError(null);
            setAudioError(null);
      try {
        const data = await fetchWithErrorHandling(`${API_URL}/texts/${textId}`);
        setText(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching text');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchText();
    }, [textId]);

    // Effect to fetch audio blob when text is loaded
    useEffect(() => {
        if (text && text.audio && !audioBlobUrl && !isAudioLoading) {
            let objectUrl: string | null = null;
            const fetchAudio = async () => {
                setIsAudioLoading(true);
                setAudioError(null);
                console.log(`Fetching audio blob for text ID: ${text.id}`);
                try {
                    const response = await fetch(`${API_URL}/texts/${text.id}/audio`);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch audio (status: ${response.status})`);
                    }
                    const blob = await response.blob();
                    objectUrl = URL.createObjectURL(blob);
                    console.log(`Created blob URL: ${objectUrl}`);
                    setAudioBlobUrl(objectUrl);
                } catch (err) {
                    const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred fetching audio';
                    console.error('Audio fetch error:', errorMsg);
                    setAudioError(errorMsg);
                } finally {
                    setIsAudioLoading(false);
                }
            };
            fetchAudio();
            return () => {
                if (objectUrl) URL.revokeObjectURL(objectUrl);
            };
        }
        return () => {
            if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
        }
    }, [text, audioBlobUrl, isAudioLoading]); // Dependencies

    // --- Player Callback Handlers --- START ---
    const handleTimeUpdate = useCallback((time: number) => {
        setCurrentTime(time);
        // Reset target seek time after it's received by player and time updates
        if (targetSeekTime !== null) {
            console.log("[Page] Resetting targetSeekTime after time update.");
            setTargetSeekTime(null);
        }
    }, [targetSeekTime]); // Depend on targetSeekTime to reset it

    const handleDurationChange = useCallback((newDuration: number) => {
        setDuration(newDuration);
    }, []);

    const handleReady = useCallback(() => {
        setIsPlayerReady(true);
    }, []);

    const handlePlay = useCallback(() => {
        setIsPlaying(true);
    }, []);

    const handlePause = useCallback(() => {
        setIsPlaying(false);
    }, []);

    const handleEnded = useCallback(() => {
        setIsPlaying(false);
        // Optionally seek to 0 or handle end of playback
        // setCurrentTime(0);
    }, []);
    // --- Player Callback Handlers --- END ---

    // --- Interaction Handlers (Word Click, Hover, Keyboard) --- START ---
    const handleWordClick = (index: number) => {
        const wordTimings = text?.analysis_data?.word_timings;
        if (wordTimings && wordTimings[index]) {
            const targetTime = wordTimings[index].start;
            console.log(`Word Click: Setting target seek time: ${targetTime}`);
            setTargetSeekTime(targetTime);
            // Resetting targetSeekTime is now handled in handleTimeUpdate
        } else {
            console.log(`Clicked word index ${index}, but timing invalid.`);
        }
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

            if (event.code === 'Space') {
                event.preventDefault();
                console.log("Spacebar pressed, calling togglePlayPause via ref");
                // Call the method exposed by the AudioPlayer component via the ref
                audioPlayerRef.current?.togglePlayPause();
                /* Old logic setting state - REMOVED
                setIsPlaying(prev => !prev);
                console.warn("Spacebar toggles state, but relies on player callbacks/native controls");
                */
            } else if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
                event.preventDefault();
                if (!isPlayerReady) return;

                let targetTime = -1;
                const jumpAmount = 2;

                if (event.code === 'ArrowLeft') {
                    targetTime = Math.max(0, currentTime - jumpAmount);
                    console.log(`Arrow Left: Setting target seek time: ${targetTime.toFixed(2)}`);
                } else if (event.code === 'ArrowRight') {
                    targetTime = Math.min(duration, currentTime + jumpAmount);
                    console.log(`Arrow Right: Setting target seek time: ${targetTime.toFixed(2)}`);
                }

                if (targetTime !== -1) {
                    setTargetSeekTime(targetTime); // Trigger seek via prop
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isPlayerReady, isPlaying, currentTime, duration]); // Dependencies updated
    // --- Interaction Handlers --- END ---

    // --- Highlight Logic (based on current time and word timings) --- START ---
    const highlightSpanishIndex = useMemo(() => {
        const wordTimings = text?.analysis_data?.word_timings;
        if (!wordTimings || !isPlaying) return -1;
        // Find the first word whose end time is after the current time
        const currentWordIndex = wordTimings.findIndex(timing => timing.end > currentTime);
        // If not found (-1), or if the first word starts after current time, highlight nothing (-1)
        // Otherwise, highlight the previous word (or index 0 if currentWordIndex is 0)
        if (currentWordIndex === -1 && wordTimings.length > 0 && currentTime >= wordTimings[wordTimings.length -1].start) {
            return wordTimings.length - 1; // Highlight last word if past its start
        }
        if (currentWordIndex === -1 || (currentWordIndex === 0 && currentTime < wordTimings[0].start)) {
            return -1;
        }
        return currentWordIndex > 0 ? currentWordIndex - 1 : 0;
    }, [currentTime, isPlaying, text?.analysis_data?.word_timings]);

    // Find English indices corresponding to the highlighted Spanish word
    const highlightEnglishIndices = useMemo(() => {
        if (highlightSpanishIndex === -1) return new Set<number>();
        const alignment = text?.analysis_data?.alignment_spanish_to_english;
        return new Set(alignment?.[String(highlightSpanishIndex)] ?? []);
    }, [highlightSpanishIndex, text?.analysis_data?.alignment_spanish_to_english]);
    // --- Highlight Logic --- END ---

    // --- Render Functions --- START ---
    const renderSpanishText = () => {
        const wordTimings = text?.analysis_data?.word_timings;
        const spanishWordMap = text?.analysis_data?.indexed_spanish_words;
        if (!wordTimings || !spanishWordMap) return <p>Analysis data missing.</p>;

        if (wordTimings.length !== Object.keys(spanishWordMap).length) {
          console.warn('Mismatch between word timings and spanish word map lengths');
        }

        return wordTimings.map((timing, index) => {
            const spanishWordDetail = spanishWordMap[String(index)];
            if (!spanishWordDetail) {
               console.warn(`Missing Spanish word detail for index ${index}`);
               return <span key={index}> ERROR </span>;
            }

            const isCurrentWord = index === highlightSpanishIndex;
            const isVocabWord = !!spanishWordDetail.vocabulary_id;
            const isHoverWord = index === hoveredSpanishIndex;

            let backgroundColor = 'transparent';
            // Use a darker blue for better contrast with white text
            if (isCurrentWord) backgroundColor = '#1d4ed8'; // Darker Blue (e.g., blue-700)
            else if (isHoverWord) backgroundColor = '#e0e0e0';

            return (
                <span key={index} style={{ display: 'inline-block' }}>
                    <span
                        onClick={() => handleWordClick(index)}
                        style={{
                            cursor: 'pointer',
                            padding: '1px 2px',
                            margin: '0 1px',
                            borderRadius: '3px',
                            backgroundColor: backgroundColor,
                            // Explicitly set default color to dark grey
                            color: isCurrentWord ? 'white' : '#333',
                            fontWeight: isVocabWord ? 'bold' : (isCurrentWord ? 'bold' : 'normal'),
                            border: isHoverWord ? '1px solid #ccc' : 'none',
                        }}
                        className="word-span"
                    >
                        {spanishWordDetail.text}
                    </span>
                    {' '}
                </span>
            );
        });
    };

    const renderEnglishText = () => {
        const englishTokens = text?.analysis_data?.indexed_english_translation_words;
        if (!englishTokens) return <p>English translation not available.</p>;

        return englishTokens.map((token, index) => {
            const isHighlighted = highlightEnglishIndices.has(index);
            const isHoverHighlighted = hoveredEnglishIndices.has(index);

            let backgroundColor = 'transparent';
            if (isHighlighted) backgroundColor = '#a5d6a7';
            else if (isHoverHighlighted) backgroundColor = '#e0e0e0';

            return (
                <span key={index} style={{ display: 'inline-block' }}>
                    <span
                        style={{
                            padding: '1px 2px',
                            margin: '0 1px',
                            borderRadius: '3px',
                            backgroundColor: backgroundColor,
                            border: isHoverHighlighted ? '1px solid #ccc' : 'none',
                        }}
                        className="word-span"
                    >
                        {token}
                    </span>
                    {' '}
                </span>
            );
        });
    };

    // --- Render Functions --- END ---

  return (
    <>
      <div className="mb-6">
         <Link href="/texts" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
           &larr; Back to All Texts
         </Link>
      </div>

      {loading && <p className="text-gray-500">Loading text...</p>}
      
      {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                     role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {text && !loading && !error && (
        <div className="bg-white shadow rounded-md overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-lg font-medium text-gray-900">
                                Text Details
             </h2>
                            <p className="text-sm text-gray-500">
                                Created: {(() => {
                                try {
                                    // Check if created_at exists
                                    if (!text.created_at) {
                                        return 'Date unavailable';
                                    }

                                    // Parse the UTC timestamp from the backend
                                    const date = new Date(text.created_at);

                                    // Format the date in local timezone
                                    return date.toLocaleString(undefined, {
                                        year: 'numeric',
                                        month: 'numeric',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                    });
                                } catch (error) {
                                    console.error('Error parsing date:', error);
                                    return 'Date unavailable';
                                }
                            })()}
                            </p>
                        </div>

                        {/* Audio Player Section */}
                        {isAudioLoading && <p className="text-gray-500 mt-4">Loading audio...</p>}
                        {audioError &&
                            <div
                                className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mt-4"
                                role="alert">
                                <strong className="font-bold">Audio Error:</strong>
                                <span className="block sm:inline"> {audioError}</span>
                            </div>
                        }
                        {/* Check analysis_data exists before rendering player */}
                        {audioBlobUrl && text.analysis_data && (
                            <div className="mt-4">
                                <AudioPlayer
                                    ref={audioPlayerRef}
                                    audioUrl={audioBlobUrl}
                                    targetSeekTime={targetSeekTime}
                                    onTimeUpdate={handleTimeUpdate}
                                    onDurationChange={handleDurationChange}
                                    onReady={handleReady}
                                    onPlay={handlePlay}
                                    onPause={handlePause}
                                    onEnded={handleEnded}
                                />
                </div>
             )}

                        {/* Spanish Text Block */}
                        {text.analysis_data?.word_timings && (
                            <div className="text-content" style={{
                                marginTop: '20px',
                                padding: '20px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px',
                                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                            }}>
                                <h3 className="text-base font-semibold text-gray-700 mb-2">Spanish Text:</h3>
                                <p style={{lineHeight: '1.6'}}>{renderSpanishText()}</p>
             </div>
                        )}

                        {/* English Translation Block */}
                        {text.analysis_data?.indexed_english_translation_words && (
                            <div
                                style={{
                                    marginTop: '20px',
                                    padding: '20px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '8px',
                                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                                }}
                            >
                <h3 className="text-base font-semibold text-gray-700 mb-2">English Translation:</h3>
                                <p className="text-gray-600" style={{lineHeight: '1.6'}}>
                                    {renderEnglishText()}
                </p>
             </div>
                        )}

                        {/* Display Original Vocabulary */} 
                        {text.original_vocabulary && text.original_vocabulary.length > 0 && (
                            <div 
                                style={{
                                    marginTop: '20px',
                                    padding: '15px 20px',
                                    backgroundColor: '#e9ecef', // Slightly different background
                                    borderRadius: '8px',
                                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.075)',
                                }}
                            >
                                <h3 className="text-base font-semibold text-gray-700 mb-3">Vocabulary Used:</h3>
                                <ul className="list-disc list-inside text-sm text-gray-600">
                                    {text.original_vocabulary.map(item => (
                                        <li key={item.id} className="mb-1">
                                            {item.word}
                                        </li>
                                    ))}
                                </ul>
                           </div>
                        )}
          </div>
        </div>
      )}
    </>
  );
} 