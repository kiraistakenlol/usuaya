import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { fetchWithErrorHandling, API_URL } from '../utils/api'; // Assuming api.ts is in utils
import { TextData } from '@usuaya/shared-types'; // Changed Text to TextData

function TextsListPage() {
  const [texts, setTexts] = useState<TextData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTexts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchWithErrorHandling(`${API_URL}/texts`);
        setTexts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch texts');
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTexts();
  }, []);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        My Texts
      </Typography>
      {texts.length === 0 ? (
        <Typography>No texts found.</Typography>
      ) : (
        <List>
          {texts.map((text) => (
            <ListItem key={text.id} disablePadding>
              <ListItemButton component={RouterLink} to={`/texts/${text.id}`}>
                <ListItemText 
                  primary={`Text ID: ${text.id}`}
                  secondary={`Created: ${text.created_at ? new Date(text.created_at).toLocaleString() : 'N/A'}`}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </div>
  );
}

export default TextsListPage; 