import { useState, useEffect, FormEvent } from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { fetchWithErrorHandling, API_URL } from '../utils/api';
import { VocabularyItem } from '@usuaya/shared-types';

function HomePage() {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [newPhrase, setNewPhrase] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVocabulary = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchWithErrorHandling(`${API_URL}/phrases`); 
        setVocabulary(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch vocabulary/phrases');
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVocabulary();
  }, []);

  const handleAddPhrase = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPhrase.trim()) return;
    setAddError(null);

    try {
      const addedPhrase = await fetchWithErrorHandling(`${API_URL}/phrases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newPhrase }), 
      });
      setVocabulary([...vocabulary, addedPhrase]); 
      setNewPhrase('');
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred adding phrase';
        setAddError(errorMsg);
        console.error("Add phrase error:", err);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        My Vocabulary
      </Typography>
      
      <Box component="form" onSubmit={handleAddPhrase} sx={{ mb: 4, display: 'flex', gap: 1, maxWidth: '400px' }}>
        <TextField
          label="New Phrase"
          variant="outlined"
          size="small"
          fullWidth
          value={newPhrase}
          onChange={(e) => setNewPhrase(e.target.value)}
          error={!!addError}
          helperText={addError}
        />
        <Button type="submit" variant="contained">Add</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <CircularProgress />
      ) : vocabulary.length === 0 ? (
        <Typography>No vocabulary items found.</Typography>
      ) : (
        <List sx={{ maxWidth: '400px', bgcolor: 'background.paper', borderRadius: 1 }}>
          {vocabulary.map((item) => (
            <ListItem key={item.id} disablePadding sx={{ borderBottom: '1px solid #eee' }}>
                <ListItemText primary={item.text} sx={{ px: 2, py: 1 }}/>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}

export default HomePage; 