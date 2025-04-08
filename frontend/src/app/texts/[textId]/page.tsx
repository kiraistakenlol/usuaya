'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useParams} from 'next/navigation';
import Link from 'next/link';
import {AudioPlayer} from '@/components/AudioPlayer';
import WordPopup from '@/components/WordPopup';
import {AnalysisAnnotation, TextAnalysisData} from '@/types/analysis';

interface Text {
    id: string;
    spanish_text: string;
    analysis_data: TextAnalysisData | null;
    audio_id: string | null;
    created_at: string;
    updated_at: string;
}

const API_URL = 'http://localhost:8000';

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
    const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null);
    const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
    const [popupData, setPopupData] = useState<any | null>(null);
    const [isPopupVisible, setIsPopupVisible] = useState(false);
    const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
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
        setHoveredWordIndex(null);
        setIsPopupVisible(false);

    const fetchText = async () => {
      setLoading(true);
      setError(null);
            setAudioError(null);
      try {
        const response = await fetch(`${API_URL}/texts/${textId}`);
        if (!response.ok) {
                    if (response.status === 404) throw new Error('Text not found');
                    else throw new Error('Failed to fetch text details');
        }
        const data: Text = await response.json();
                console.log('Fetched text data (new structure):', data);
        setText(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchText();
    }, [textId]);

    // Effect to fetch audio blob when text is loaded
    useEffect(() => {
        if (text && text.audio_id && !audioBlobUrl && !isAudioLoading) {
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

    const handleMouseEnter = (event: React.MouseEvent<HTMLSpanElement>, index: number) => {
        setHoveredWordIndex(index);
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
        }

        const timeout = setTimeout(() => {
            const analysisEntry = text?.analysis_data?.analysis_result?.analysis_by_index?.[String(index)];
            const word = text?.analysis_data?.word_timings?.[index]?.word || '(unknown word)';
            
            // Get annotations using the precomputed map
            const annotations = annotationsByWordIndex.get(index) || [];

            // Pass analysisEntry (if exists) and the found annotations
            const popupInfo = {
                analysisEntry: analysisEntry || undefined, // Pass entry if found
                annotations: annotations, 
                word: analysisEntry?.original_word || word // Use original word from entry if possible
            };
            setPopupData(popupInfo); 

            setPopupPosition({x: event.clientX, y: event.clientY});
            setIsPopupVisible(true);
        }, 500);

        hoverTimerRef.current = timeout;
    };

    const handleMouseLeave = () => {
        setHoveredWordIndex(null);
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        setIsPopupVisible(false);
        setPopupData(null);
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

            if (event.code === 'Space') {
                event.preventDefault();
                // We need a way to tell the player to toggle
                // For now, maybe just update state? Player callbacks handle sync
                setIsPlaying(prev => !prev);
                // TODO: This won't directly control the player if user used native controls
                // Need a ref to player or dedicated play/pause prop? Let's stick with native for now.
                console.warn("Spacebar toggles state, but relies on player callbacks/native controls");
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

    // --- Precompute Annotations by Word Index --- START ---
    const annotationsByWordIndex = useMemo(() => {
        const map = new Map<number, AnalysisAnnotation[]>();
        const annotations = text?.analysis_data?.analysis_result?.annotations;
        if (!annotations) return map;

        Object.values(annotations).forEach(annotation => {
            if (annotation.scope_indices) {
                annotation.scope_indices.forEach(index => {
                    if (!map.has(index)) {
                        map.set(index, []);
                    }
                    map.get(index)?.push(annotation);
                });
            }
        });
        return map;
    }, [text?.analysis_data?.analysis_result?.annotations]);
    // --- Precompute Annotations by Word Index --- END ---

    // --- Calculate Highlight Indices --- START ---
    // Calculate Spanish highlight index
    const highlightSpanishIndex = useMemo(() => {
        const wordTimings = text?.analysis_data?.word_timings;
        if (!wordTimings || wordTimings.length === 0) return null;

        let idx = wordTimings.findLastIndex(
            timing => currentTime >= timing.start && currentTime < timing.end
        );
        if (idx === -1 && currentTime > 0) {
            const lastStartedIndex = wordTimings.findLastIndex(timing => currentTime >= timing.start);
            if (lastStartedIndex !== -1 && currentTime <= duration) {
                idx = lastStartedIndex;
            } else {
                idx = -1;
            }
        }
        return idx !== -1 ? idx : null;
    }, [currentTime, duration, text?.analysis_data?.word_timings]);

    // Calculate English highlight indices (based on Spanish index)
    const englishHighlightIndices = useMemo(() => {
        const alignmentMap = text?.analysis_data?.english_data?.spanish_index_to_english_indices;
        if (highlightSpanishIndex === null || !alignmentMap) {
            return new Set<number>();
        }
        const indices = alignmentMap[String(highlightSpanishIndex)];
        return new Set(indices || []);
    }, [highlightSpanishIndex, text?.analysis_data?.english_data?.spanish_index_to_english_indices]);
    // --- Calculate Highlight Indices --- END ---

    // --- Render Functions --- START ---
    const renderSpanishText = () => {
        const wordTimings = text?.analysis_data?.word_timings;
        // Use the precomputed map
        // const analysisResult = text?.analysis_data?.analysis_result;
        if (!wordTimings) return <p>Loading Spanish text...</p>;

        return wordTimings.map((timing, index) => {
            const isCurrentWord = index === highlightSpanishIndex;
            let analysisClasses = '';
            const annotationsForWord = annotationsByWordIndex.get(index);
            
            if (annotationsForWord && annotationsForWord.length > 0) {
                let associatedAnnotationTypes = new Set<string>();
                annotationsForWord.forEach(annotation => {
                    associatedAnnotationTypes.add(annotation.type);
                });
                analysisClasses = Array.from(associatedAnnotationTypes).map(type => `annotation-${type}`).join(' ');
            }
            /* Old logic using annotation_ids:
            const analysisEntry = analysisResult?.analysis_by_index?.[String(index)];
            if (analysisEntry && analysisEntry.annotation_ids.length > 0) {
                let associatedAnnotationTypes = new Set<string>();
                analysisEntry.annotation_ids.forEach((id: string) => {
                    const annotation = analysisResult?.annotations?.[id];
                    if (annotation) {
                        associatedAnnotationTypes.add(annotation.type);
                    }
                });
                analysisClasses = Array.from(associatedAnnotationTypes).map(type => `annotation-${type}`).join(' ');
            }
            */
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

    const renderEnglishText = () => {
        const englishTokens = text?.analysis_data?.english_data?.tokens;
        if (!englishTokens) return <p>Loading English text...</p>;

        return englishTokens.map((token, index_eng) => {
            const isHighlighted = englishHighlightIndices.has(index_eng);
            return (
                <span
                    key={`eng-${index_eng}`}
                    style={{
                        backgroundColor: isHighlighted ? '#3b82f6' : 'transparent',
                        color: isHighlighted ? 'white' : 'inherit',
                        borderRadius: '4px',
                        padding: '0 2px',
                        transition: 'color 0.2s ease, background-color 0.2s ease',
                    }}
                >
          {token.text}
        </span>
            );
        }).reduce((prev, curr, index) => <>{prev}{index > 0 ? ' ' : ''}{curr}</>, <></>);
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
                        {text.analysis_data?.english_data?.tokens && (
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

                        {/* Popup Rendering */}
                        {isPopupVisible && popupData && popupPosition && (
                            <WordPopup data={popupData} position={popupPosition}/>
                        )}
          </div>
        </div>
      )}
    </>
  );
} 