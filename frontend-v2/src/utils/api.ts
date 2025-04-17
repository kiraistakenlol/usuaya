// API Utilities

// Get the API URL from environment variable or fall back to localhost for development
// Use Vite's import.meta.env for client-side env vars (ensure VITE_API_URL is set in .env)
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper function to handle fetch errors
export async function fetchWithErrorHandling(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `API error: ${response.status} ${response.statusText}`
      );
    }
    
    return response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
} 