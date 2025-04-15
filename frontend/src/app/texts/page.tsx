'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import RelativeTimeDisplay from '@/components/RelativeTimeDisplay';
import { API_URL, fetchWithErrorHandling } from '../../utils/api';
import { Phrase, TextData } from "@usuaya/shared-types";

// MUI Imports
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export default function TextsPage() {
  const [texts, setTexts] = useState<TextData[]>([]);
  const [vocabulary, setVocabulary] = useState<Phrase[]>([]); // Existing phrases
  const [manualInput, setManualInput] = useState('');

  const [loadingTexts, setLoadingTexts] = useState(true);
  const [loadingVocab, setLoadingVocab] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing texts
  const fetchTexts = async () => {
    setLoadingTexts(true);
    try {
      const data = await fetchWithErrorHandling(`${API_URL}/texts`);
      setTexts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching texts');
      console.error(err);
    } finally {
      setLoadingTexts(false);
    }
  };

  // Fetch existing vocabulary
  const fetchVocabulary = async () => {
    setLoadingVocab(true);
    try {
      const data = await fetchWithErrorHandling(`${API_URL}/phrases`);
      setVocabulary(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching vocabulary');
      console.error(err);
    } finally {
      setLoadingVocab(false);
    }
  };

  useEffect(() => {
    fetchTexts();
    fetchVocabulary();
  }, []);

  // Function to add a word from the list to the textarea
  const handleAddVocabWord = (word: string) => {
    setManualInput((prevInput) =>
      prevInput ? `${prevInput}\n${word}` : word
    );
  };

  // Handle text generation
  const handleGenerateText = async (e: FormEvent) => {
    e.preventDefault();
    const combinedVocab = manualInput.split('\n').map(s => s.trim()).filter(Boolean);

    if (combinedVocab.length === 0) {
      setError("Please enter some vocabulary in the text area.");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      await fetchWithErrorHandling(`${API_URL}/texts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vocabulary: combinedVocab }),
      });
      await fetchTexts();
      setManualInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating text');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}> {/* Constrain width */}
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        My Texts
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* --- Create New Text Section --- */}
      <Paper elevation={2} sx={{ mb: 4, p: 3 }}> {/* Replaced div card */}
        <Typography variant="h6" component="h2" gutterBottom>
          Create New
        </Typography>
        <Box component="form" onSubmit={handleGenerateText}> 
          {/* Grid for inputs */}
          <Grid container spacing={3} sx={{ mb: 2 }}>
            {/* Vocabulary Selection Grid item */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', height: '100%' }}>
                <Typography variant="subtitle2" component="label" sx={{ mb: 1, display: 'block' }}>
                  Add Word from Vocabulary (Click to add):
                </Typography>
                {loadingVocab ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100% - 30px)' }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Paper variant="outlined" sx={{ height: 'calc(100% - 30px)', overflowY: 'auto', bgcolor: 'white' }}> {/* h-40 equivalent */}
                    {vocabulary.length === 0 ? (
                      <Typography variant="body2" sx={{ p: 1, color: 'text.secondary' }}>
                        No vocabulary found.
                      </Typography>
                    ) : (
                      <List disablePadding dense> {/* dense for smaller items */}
                        {vocabulary.map((phrase, index) => (
                          <React.Fragment key={phrase.id}>
                            <ListItemButton onClick={() => handleAddVocabWord(phrase.text)}>
                              <ListItemText primary={phrase.text} primaryTypographyProps={{ variant: 'body2' }} />
                            </ListItemButton>
                            {index < vocabulary.length - 1 && <Divider />} {/* Divider between items */}
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </Paper>
                )}
              </Paper>
            </Grid>

            {/* Manual Input Area Grid item */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', height: '100%' }}>
                <Typography variant="subtitle2" component="label" htmlFor="manual-input" sx={{ mb: 1, display: 'block' }}>
                  Vocabulary for New Text (one per line):
                </Typography>
                <TextField
                  id="manual-input"
                  multiline
                  rows={8}
                  fullWidth
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder={`Type words here,\nor click list on left...\n--------------------\nHola\n¿Cómo estás?\n...`}
                  variant="outlined"
                  InputProps={{ sx: { bgcolor: 'white', height: 'calc(100% - 30px)' } }}
                  sx={{ height: 'calc(100% - 30px)' }}
                />
              </Paper>
            </Grid>
          </Grid> {/* End of grid container */}

          {/* Submit Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={generating}
              startIcon={generating ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {generating ? 'Generating...' : 'Generate Text'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* --- List of Existing Texts --- */}
      <Paper elevation={2} sx={{ p: 3 }}> {/* Replaced div card */}
        <Typography variant="h6" component="h2" gutterBottom>
          My Texts
        </Typography>
        {loadingTexts ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : texts.length > 0 ? (
          <List disablePadding>
            {texts.map((text, index) => (
              <React.Fragment key={text.id}>
                <Link href={`/texts/${text.id}`} passHref legacyBehavior>
                  <ListItemButton sx={{ p: 2, width: '100%' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <Typography variant="body1" component="h3" sx={{ flexGrow: 1, mr: 2, fontWeight: 500 }} noWrap>
                              {text.spanish_text}
                           </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                            <RelativeTimeDisplay dateString={text.created_at} />
                            <ChevronRightIcon sx={{ color: 'grey.400' }} />
                          </Box>
                        </Box>
                      </Box>
                  </ListItemButton>
                </Link>
                 {index < texts.length - 1 && <Divider />} {/* Add Divider */} 
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary">No texts generated yet.</Typography>
        )}
      </Paper>
    </Box>
  );
} 