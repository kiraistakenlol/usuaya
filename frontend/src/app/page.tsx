'use client';

import { useState, useEffect, FormEvent } from 'react';
import { API_URL, fetchWithErrorHandling } from '../utils/api';
import {Phrase} from "@usuaya/shared-types";

export default function PhrasesPage() {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [newPhrase, setNewPhrase] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial phrases
  useEffect(() => {
    const fetchPhrases = async () => {
      try {
        setLoading(true);
        const data = await fetchWithErrorHandling(`${API_URL}/phrases`);
        setPhrases(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPhrases();
  }, []);

  // Add a new phrase
  const handleAddPhrase = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPhrase.trim()) return;

    try {
      const addedPhrase = await fetchWithErrorHandling(`${API_URL}/phrases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newPhrase }),
      });
      setPhrases([...phrases, addedPhrase]);
      setNewPhrase(''); // Clear input
      setError(null);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred adding phrase');
        console.error(err);
    }
  };

  // Delete a phrase
  const handleDeletePhrase = async (id: number) => {
    try {
      await fetchWithErrorHandling(`${API_URL}/phrases/${id}`, {
        method: 'DELETE',
      });
      setPhrases(phrases.filter((phrase) => phrase.id !== id));
      setError(null);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred deleting phrase');
        console.error(err);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-8 text-gray-800">My Vocabulary (Phrases)</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Add Phrase Form */}
      <form onSubmit={handleAddPhrase} className="mb-8 w-full max-w-md">
        <div className="flex items-center border-b border-teal-500 py-2">
          <input
            className="appearance-none bg-transparent border-none w-full text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none"
            type="text"
            placeholder="Enter new phrase"
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            aria-label="New phrase"
          />
          <button
            className="flex-shrink-0 bg-teal-500 hover:bg-teal-700 border-teal-500 hover:border-teal-700 text-sm border-4 text-white py-1 px-2 rounded"
            type="submit"
          >
            Add Phrase
          </button>
        </div>
      </form>

      {/* Phrase List */}
      <div className="w-full max-w-md bg-white shadow-md rounded px-8 pt-6 pb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">My Phrases</h2>
        {loading ? (
          <p className="text-gray-500">Loading phrases...</p>
        ) : phrases.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {phrases.map((phrase) => (
              <li key={phrase.id} className="py-3 flex justify-between items-center">
                <span className="text-gray-800">{phrase.text}</span>
                <button
                  onClick={() => handleDeletePhrase(phrase.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No phrases added yet.</p>
        )}
      </div>
    </>
  );
}
