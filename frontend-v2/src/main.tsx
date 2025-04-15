import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App.tsx';
import './index.css';

// Define a default theme (can be customized later)
const theme = createTheme({});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
