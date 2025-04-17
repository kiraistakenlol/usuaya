import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button'; // For Back button
import { fetchWithErrorHandling, API_URL } from '../utils/api'; // Assuming api.ts is in utils
import { TextData, VocabularyItem } from '@usuaya/shared-types'; // Import shared types
// TODO: Import AudioPlayer and its types

function TextDetailPage() {
  const { textId } = useParams<{ textId: string }>();
  const [text, setText] = useState<TextData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: Add audio player state (audioBlobUrl, isAudioLoading, audioError, etc.)
  // TODO: Add interaction state (currentTime, isPlaying, highlight indices, etc.)

  useEffect(() => {
    if (!textId) return;

    const fetchText = async () => {
      setLoading(true);
      setError(null);
      // TODO: Reset audio states
      try {
        const data = await fetchWithErrorHandling(`${API_URL}/texts/${textId}`);
        setText(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching text');
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchText();
  }, [textId]);

  // TODO: Add useEffect for fetching audio blob when text is loaded
  // TODO: Add player callback handlers (handleTimeUpdate, handleDurationChange, etc.)
  // TODO: Add interaction handlers (handleWordClick, handleHover, handleKeyDown)
  // TODO: Add highlight logic (useMemo for highlightSpanishIndex, highlightEnglishIndices)
  // TODO: Add render functions (renderSpanishText, renderEnglishText)

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">Error loading text: {error}</Alert>;
  }

  if (!text) {
    return <Alert severity="warning">Text not found.</Alert>;
  }

  // --- Render basic structure --- 
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

      {/* Placeholder for Audio Player */}
      <Box my={3} p={2} border={1} borderColor="grey.300" borderRadius={1}>
        <Typography variant="subtitle1">Audio Player Area</Typography>
        {/* TODO: Add AudioPlayer component here */}
      </Box>

      {/* Placeholder for Spanish Text */}
      <Box my={3} p={2} border={1} borderColor="grey.300" borderRadius={1}>
         <Typography variant="subtitle1">Spanish Text Area</Typography>
         {/* TODO: Add renderSpanishText() output here */}
         <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
           {JSON.stringify(text.analysis_data?.indexed_spanish_words, null, 2)}
         </pre>
      </Box>
      
      {/* Placeholder for English Text */}
      <Box my={3} p={2} border={1} borderColor="grey.300" borderRadius={1}>
         <Typography variant="subtitle1">English Translation Area</Typography>
         {/* TODO: Add renderEnglishText() output here */}
         <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
           {JSON.stringify(text.analysis_data?.indexed_english_translation_words, null, 2)}
         </pre>
      </Box>

      {/* Placeholder for Vocabulary */}
      {text.original_vocabulary && text.original_vocabulary.length > 0 && (
        <Box my={3} p={2} border={1} borderColor="grey.300" borderRadius={1}>
          <Typography variant="subtitle1">Vocabulary Used:</Typography>
          <ul>
            {text.original_vocabulary.map((item: VocabularyItem) => (
              <li key={item.id}>{item.word}</li>
            ))}
          </ul>
        </Box>
      )}

    </Box>
  );
}

export default TextDetailPage; 