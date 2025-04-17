import React, {FormEvent, useEffect, useState} from 'react';
import {Link as RouterLink} from 'react-router-dom';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {API_URL, fetchWithErrorHandling} from '../utils/api';
import {TextData, VocabularyItem} from '@usuaya/shared-types';


function TextsListPage() {
    const [texts, setTexts] = useState<TextData[]>([]);
    const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]); // Existing phrases/vocab
    const [manualInput, setManualInput] = useState(''); // For the textarea

    const [loadingTexts, setLoadingTexts] = useState(true);
    const [loadingVocab, setLoadingVocab] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null); // Combined error state

    // Fetch existing texts
    const fetchTexts = async () => {
        setLoadingTexts(true);
        try {
            const data = await fetchWithErrorHandling(`${API_URL}/texts`);
            setTexts(data);
            // setError(null); // Clear error only on full success?
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error fetching texts');
            console.error("Texts fetch error:", err);
        } finally {
            setLoadingTexts(false);
        }
    };

    // Fetch existing vocabulary
    const fetchVocabulary = async () => {
        setLoadingVocab(true);
        try {
            const data = await fetchWithErrorHandling(`${API_URL}/phrases`);
            // Use the fetched data which has { id: string, text: string }
            setVocabulary(data);
            // setError(null);
        } catch (err) {
            // Don't overwrite text fetch error if vocab fetch fails
            const vocabError = err instanceof Error ? err.message : 'Error fetching vocabulary';
            setError(prev => prev ? `${prev}; ${vocabError}` : vocabError);
            console.error("Vocab fetch error:", err);
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
            setError("Please provide some vocabulary words.");
            return;
        }

        setGenerating(true);
        setError(null); // Clear previous errors before generating

        try {
            console.log("Generating text with vocab:", combinedVocab);
            // Assuming POST /texts expects { vocabulary: string[] }
            await fetchWithErrorHandling(`${API_URL}/texts`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({vocabulary: combinedVocab}),
            });
            // Success! Refetch texts and clear input
            await fetchTexts();
            setManualInput('');
            console.log("Text generation successful, list refreshed.");
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Error generating text';
            setError(errorMsg);
            console.error("Generate text error:", err);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Box sx={{maxWidth: 1200, mx: 'auto', p: 2}}>
            <Typography variant="h4" component="h1" gutterBottom sx={{fontWeight: 'bold'}}>
                My Texts
            </Typography>

            {error && (
                <Alert severity="error" sx={{mb: 2}} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* --- Create New Text Section --- */}
            <Paper elevation={2} sx={{mb: 4, p: 3}}>
                <Typography variant="h6" component="h2" gutterBottom>
                    Create New Text
                </Typography>
                <Box component="form" onSubmit={handleGenerateText}>
                    <Grid container spacing={3} sx={{mb: 2}}>
                        {/* Vocabulary Selection Grid item */}
                        <Grid item xs={12} md={6}>
                            <Paper variant="outlined" sx={{p: 2, bgcolor: 'grey.50', height: '300px'}}>
                                <Typography variant="subtitle2" component="label" sx={{mb: 1, display: 'block'}}>
                                    Add Word from Vocabulary (Click to add):
                                </Typography>
                                {loadingVocab ? (
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        height: 'calc(100% - 30px)'
                                    }}>
                                        <CircularProgress size={24}/>
                                    </Box>
                                ) : (
                                    <Paper variant="outlined"
                                           sx={{height: 'calc(100% - 30px)', overflowY: 'auto', bgcolor: 'white'}}>
                                        {vocabulary.length === 0 ? (
                                            <Typography variant="body2" sx={{p: 1, color: 'text.secondary'}}>
                                                No vocabulary found. Add some on the home page.
                                            </Typography>
                                        ) : (
                                            <List disablePadding dense>
                                                {vocabulary.map((item, index) => (
                                                    <React.Fragment key={item.id}>
                                                        {/* Use item.text based on previous fix */}
                                                        <ListItemButton onClick={() => handleAddVocabWord(item.text)}>
                                                            <ListItemText primary={item.text}
                                                                          primaryTypographyProps={{variant: 'body2'}}/>
                                                        </ListItemButton>
                                                        {index < vocabulary.length - 1 && <Divider/>}
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
                            <Paper variant="outlined" sx={{p: 2, bgcolor: 'grey.50', height: '300px'}}>
                                <Typography variant="subtitle2" component="label" htmlFor="manual-input"
                                            sx={{mb: 1, display: 'block'}}>
                                    Vocabulary for New Text (one per line):
                                </Typography>
                                <TextField
                                    id="manual-input"
                                    multiline
                                    rows={10} // Adjusted rows
                                    fullWidth
                                    value={manualInput}
                                    onChange={(e) => setManualInput(e.target.value)}
                                    placeholder={`Type words here,\nor click list on left...\n--------------------\nHola\n¿Cómo estás?\n...`}
                                    variant="outlined"
                                    InputProps={{sx: {bgcolor: 'white', height: '100%'}}}
                                    sx={{height: 'calc(100% - 30px)'}}
                                />
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Submit Button */}
                    <Box sx={{display: 'flex', justifyContent: 'flex-end'}}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={generating}
                            startIcon={generating ? <CircularProgress size={20} color="inherit"/> : null}
                        >
                            {generating ? 'Generating...' : 'Generate Text'}
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* --- List of Existing Texts --- */}
            <Paper elevation={2} sx={{mb: 4}}>
                <Typography variant="h6" component="h2" sx={{p: 2, borderBottom: '1px solid', borderColor: 'divider'}}>
                    Existing Texts
                </Typography>
                {loadingTexts ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}>
                        <CircularProgress/>
                    </Box>
                ) : texts && texts.length > 0 ? (
                    <List disablePadding>
                        {texts.map((text, index) => (
                            <React.Fragment key={text.id}>
                                <ListItemButton component={RouterLink} to={`/texts/${text.id}`}>
                                    <ListItemText
                                        primary={text.spanish_text || `Text ${text.id}`}
                                        secondary={<RelativeTimeDisplay date={text.created_at}/>}
                                        primaryTypographyProps={{fontWeight: 'medium'}}
                                    />
                                    <ChevronRightIcon color="action"/>
                                </ListItemButton>
                                {index < texts.length - 1 && <Divider component="li"/>}
                            </React.Fragment>
                        ))}
                    </List>
                ) : (
                    <Typography sx={{p: 2, color: 'text.secondary'}}>
                        No texts found.
                    </Typography>
                )}
            </Paper>
        </Box>
    );
}

export default TextsListPage; 