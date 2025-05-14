import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { API_URL, fetchWithErrorHandling } from '../utils/api';
import { TextAnalysis, TextData} from '@usuaya/shared-types';
import AudioPlayer, { AudioPlayerActions } from '../components/AudioPlayer';

function TextDetailPage() {
    const { textId } = useParams<{ textId: string }>();
    const [text, setText] = useState<TextData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // --- State for Audio Player ---
    const [audioError, setAudioError] = useState<string | null>(null);
    const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
    const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [targetSeekTime, setTargetSeekTime] = useState<number | null>(null);
    const audioPlayerRef = useRef<AudioPlayerActions | null>(null);

    // --- State for Interactions ---
    const [hoveredSpanishIndex, setHoveredSpanishIndex] = useState<number | null>(null);
    const [hoveredEnglishIndices, setHoveredEnglishIndices] = useState<Set<number>>(new Set());

    // Effect to fetch text details
    useEffect(() => {
        if (!textId) return;
        // Reset states on textId change
        setAudioBlobUrl(null);
        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);
        setIsPlayerReady(false);
        setTargetSeekTime(null);
        setHoveredSpanishIndex(null);
        setHoveredEnglishIndices(new Set());

        const fetchText = async () => {
            setLoading(true);
            setError(null);
            setAudioError(null); // Reset audio error
            try {
                console.log(`[PAGE] Fetching text ID: ${textId}`);
                const data = await fetchWithErrorHandling<TextData>(`${API_URL}/texts/${textId}`);
                console.log("[PAGE] Text data received:", data);
                setText(data);
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Error fetching text';
                console.error("[PAGE] Fetch text error:", errorMsg);
                setError(errorMsg);
            } finally {
                setLoading(false);
            }
        };
        fetchText();
    }, [textId]);

    // Effect to fetch audio blob when text is loaded
    useEffect(() => {
        if (text && text.audio_id && !audioBlobUrl && !isAudioLoading && !audioError) {
            let objectUrl: string | null = null;
            const fetchAudio = async () => {
                setIsAudioLoading(true);
                setAudioError(null);
                console.log(`[PAGE] Fetching audio blob for text ID: ${text.id}`);
                try {
                    const response = await fetch(`${API_URL}/audio/${text.audio_id}`);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch audio (status: ${response.status})`);
                    }
                    const blob = await response.blob();
                    objectUrl = URL.createObjectURL(blob);
                    console.log(`[PAGE] Created blob URL: ${objectUrl}`);
                    setAudioBlobUrl(objectUrl);
                } catch (err) {
                    const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred fetching audio';
                    console.error('[PAGE] Audio fetch error:', errorMsg);
                    setAudioError(errorMsg);
                } finally {
                    setIsAudioLoading(false);
                }
            };
            fetchAudio();
            // Cleanup function to revoke the blob URL when the component unmounts or text changes
            return () => {
                if (objectUrl) {
                    console.log(`[PAGE] Revoking blob URL: ${objectUrl}`);
                    URL.revokeObjectURL(objectUrl);
                }
            };
        }
        // If text changes and we had an old blob URL, revoke it
        return () => {
            if (audioBlobUrl) {
                console.log(`[PAGE] Revoking old blob URL: ${audioBlobUrl}`);
                URL.revokeObjectURL(audioBlobUrl);
            }
        }
    }, [text, audioBlobUrl, isAudioLoading, audioError]); // Dependencies adjusted

    // --- Player Callback Handlers ---
    const handleTimeUpdate = useCallback((time: number) => {
        setCurrentTime(time);
        if (targetSeekTime !== null) {
            console.log("[PAGE] Resetting targetSeekTime after time update.");
            setTargetSeekTime(null);
        }
    }, [targetSeekTime]);

    const handleDurationChange = useCallback((newDuration: number) => {
        setDuration(newDuration);
    }, []);

    const handleReady = useCallback(() => {
        setIsPlayerReady(true);
        console.log("[PAGE] Audio player ready.");
    }, []);

    const handlePlay = useCallback(() => {
        setIsPlaying(true);
    }, []);

    const handlePause = useCallback(() => {
        setIsPlaying(false);
    }, []);

    const handleEnded = useCallback(() => {
        setIsPlaying(false);
    }, []);

    // --- Interaction Handlers (Word Click, Hover, Keyboard) ---
    const handleWordClick = useCallback((index: number) => {
        const wordTimings = text?.analysis_data?.word_timings;
        if (wordTimings && wordTimings[index]) {
            const targetTime = wordTimings[index].start;
            console.log(`[PAGE] Word Click: Setting target seek time: ${targetTime}`);
            setTargetSeekTime(targetTime);
        } else {
            console.log(`[PAGE] Clicked word index ${index}, but timing invalid.`);
        }
    }, [text?.analysis_data?.word_timings]); // Dependency added

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

            if (event.code === 'Space') {
                event.preventDefault();
                console.log("[PAGE] Spacebar pressed, calling togglePlayPause via ref");
                audioPlayerRef.current?.togglePlayPause();
            } else if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
                event.preventDefault();
                if (!isPlayerReady || duration <= 0) return; // Check duration too

                let targetTime = -1;
                const jumpAmount = 2;

                if (event.code === 'ArrowLeft') {
                    targetTime = Math.max(0, currentTime - jumpAmount);
                } else if (event.code === 'ArrowRight') {
                    targetTime = Math.min(duration, currentTime + jumpAmount);
                }

                if (targetTime !== -1) {
                    console.log(`[PAGE] Arrow Key: Setting target seek time: ${targetTime.toFixed(2)}`);
                    setTargetSeekTime(targetTime);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isPlayerReady, currentTime, duration]); // isPlaying removed as toggle is via ref

    // --- Highlight Logic ---
    const highlightSpanishIndex = useMemo(() => {
        const analysisData = text?.analysis_data as TextAnalysis | null | undefined;
        const wordTimings = analysisData?.word_timings;
        if (!wordTimings || wordTimings.length === 0) return -1;

        const currentWordIndex = wordTimings.findIndex((timing) => timing.end > currentTime);

        if (currentWordIndex === -1) {
            // If past the start of the last word, highlight the last word
            if (currentTime >= wordTimings[wordTimings.length - 1].start) {
                return wordTimings.length - 1;
            }
            return -1; // Otherwise, highlight nothing
        }

        // If before the start of the first word, highlight nothing
        if (currentWordIndex === 0 && currentTime < wordTimings[0].start) {
            return -1;
        }

        return currentWordIndex;
    }, [currentTime, text?.analysis_data]);

    const highlightEnglishIndices = useMemo(() => {
        if (highlightSpanishIndex === -1) return new Set<number>();
        const alignment = text?.analysis_data?.alignment_spanish_to_english;
        return new Set(alignment?.[String(highlightSpanishIndex)] ?? []);
    }, [highlightSpanishIndex, text?.analysis_data?.alignment_spanish_to_english]);

    // --- Render Functions ---
    const renderSpanishText = () => {
        const analysisData = text?.analysis_data as TextAnalysis | null | undefined;
        const wordTimings = analysisData?.word_timings;
        const spanishWordMap = analysisData?.indexed_spanish_words;
        if (!wordTimings || !spanishWordMap) return <Typography color="error">Analysis data missing for Spanish
            text.</Typography>;

        return wordTimings.map((_, index: number) => {
            const spanishWordDetail = spanishWordMap[String(index)];
            if (!spanishWordDetail) {
                console.warn(`[PAGE] Missing Spanish word detail for index ${index}`);
                return <span key={index}> ERROR </span>;
            }

            const isCurrentWord = index === highlightSpanishIndex;
            const isVocabWord = !!spanishWordDetail.vocabulary_id;
            const isHoverWord = index === hoveredSpanishIndex;

            let backgroundColor = 'transparent';
            if (isCurrentWord) backgroundColor = '#1d4ed8'; // Darker Blue (e.g., blue-700)
            else if (isHoverWord) backgroundColor = '#e0e0e0';

            return (
                <span key={index} style={{ display: 'inline-block' }}>
                    <span
                        onMouseEnter={() => {
                            setHoveredSpanishIndex(index);
                            const alignment = analysisData?.alignment_spanish_to_english;
                            const englishIndices = alignment?.[String(index)] ?? [];
                            setHoveredEnglishIndices(new Set(englishIndices));
                        }}
                        onMouseLeave={() => {
                            setHoveredSpanishIndex(null);
                            setHoveredEnglishIndices(new Set());
                        }}
                        onClick={() => handleWordClick(index)}
                        style={{
                            cursor: 'pointer',
                            padding: '1px 2px',
                            margin: '0 1px',
                            borderRadius: '3px',
                            backgroundColor: backgroundColor,
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
        const analysisData = text?.analysis_data as TextAnalysis | null | undefined;
        const englishTokens = analysisData?.indexed_english_translation_words;
        if (!englishTokens) return <Typography color="error">English translation not available.</Typography>;

        return englishTokens.map((token, index) => {
            const isHighlighted = highlightEnglishIndices.has(index);
            const isHoverHighlighted = hoveredEnglishIndices.has(index);

            let backgroundColor = 'transparent';
            if (isHighlighted) backgroundColor = '#a5d6a7'; // Light green
            else if (isHoverHighlighted) backgroundColor = '#e0e0e0'; // Light grey

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

    // --- Main Render ---
    if (loading) {
        return <CircularProgress />;
    }

    if (error) {
        // Display main error prominently
        return (
            <Box sx={{ p: 2 }}>
                <Button component={RouterLink} to="/texts" sx={{ mb: 2 }}>
                    &larr; Back to All Texts
                </Button>
                <Alert severity="error">Error loading text details: {error}</Alert>
            </Box>
        );
    }

    if (!text) {
        return (
            <Box sx={{ p: 2 }}>
                <Button component={RouterLink} to="/texts" sx={{ mb: 2 }}>
                    &larr; Back to All Texts
                </Button>
                <Alert severity="warning">Text not found.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            <Button component={RouterLink} to="/texts" sx={{ mb: 2 }}>
                &larr; Back to All Texts
            </Button>
            <Typography variant="h4" gutterBottom>
                Text Details (ID: {text.id})
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                Created: {text.created_at ? new Date(text.created_at).toLocaleString() : 'N/A'}
            </Typography>

            {/* Audio Player Section */}
            <Box my={3}>
                {isAudioLoading && <CircularProgress size={20} sx={{ mr: 1 }} />}
                {isAudioLoading && <Typography variant="caption">Loading audio...</Typography>}
                {audioError && !isAudioLoading &&
                    <Alert severity="warning" sx={{ mb: 1 }}>Audio Error: {audioError}</Alert>
                }
                {audioBlobUrl && text.analysis_data && (
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
                )}
                {!audioBlobUrl && !isAudioLoading && !audioError && text.audio_id && (
                    <Typography variant="caption">Audio not loaded yet.</Typography>
                )}
                {!text.audio_id && (
                    <Typography variant="caption">No audio associated with this text.</Typography>
                )}
            </Box>

            {/* Spanish Text Block */}
            {text.analysis_data?.indexed_spanish_words && (
                <Box my={3} p={2} bgcolor="#f8f9fa" borderRadius={2} boxShadow="inset 0 1px 3px rgba(0,0,0,0.1)">
                    <Typography variant="h6" component="h3" gutterBottom>Spanish Text:</Typography>
                    <Typography component="p" style={{ lineHeight: 1.8 }}>{renderSpanishText()}</Typography>
                </Box>
            )}

            {/* English Translation Block */}
            {text.analysis_data?.indexed_english_translation_words && (
                <Box my={3} p={2} bgcolor="#f8f9fa" borderRadius={2} boxShadow="inset 0 1px 3px rgba(0,0,0,0.1)">
                    <Typography variant="h6" component="h3" gutterBottom>English Translation:</Typography>
                    <Typography component="p" color="text.secondary" style={{ lineHeight: 1.8 }}>
                        {renderEnglishText()}
                    </Typography>
                </Box>
            )}

            {/* Original Vocabulary */}
            {text.original_vocabulary && text.original_vocabulary.length > 0 && (
                <Box my={3} p={2} bgcolor="#e9ecef" borderRadius={2} boxShadow="inset 0 1px 2px rgba(0,0,0,0.075)">
                    <Typography variant="h6" component="h3" gutterBottom>Vocabulary Used:</Typography>
                    <Box component="ul" sx={{ listStyle: 'disc', pl: 3 }}> {/* Use Box for list styling */}
                        {text.original_vocabulary.map((word: string, index: number) => (
                            <Typography component="li" key={index} variant="body2"
                                sx={{ mb: 0.5 }}>{word}</Typography>
                        ))}
                    </Box>
                </Box>
            )}

        </Box>
    );
}

export default TextDetailPage; 