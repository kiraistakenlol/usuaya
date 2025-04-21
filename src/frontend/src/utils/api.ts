// API Utilities

// Get the API URL from environment variable or fall back to localhost for development
// Use Vite's import.meta.env for client-side env vars (ensure VITE_API_URL is set in .env)
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper function to handle fetch errors
export async function fetchWithErrorHandling<T>(url: string, options?: RequestInit): Promise<T> {
    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            // Try to get more specific error message from backend response body
            let errorData = null;
            try {
                errorData = await response.json();
            } catch (e) {
                // Ignore if response body isn't valid JSON
            }
            throw new Error(
                (errorData as any)?.message || // Use 'as any' or a type guard if you have a specific error shape
                `API error: ${response.status} ${response.statusText}`
            );
        }

        // Assume the response body is of type T
        return response.json() as Promise<T>;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
} 