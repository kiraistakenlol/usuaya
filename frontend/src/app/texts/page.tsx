'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';

// Interfaces (can be moved to a types file later)
interface Phrase {
  id: number;
  text: string;
}

interface Text {
  id: number;
  spanish_content: string;
  english_translation: string | null;
}

const API_URL = 'http://localhost:8000';

export default function TextsPage() {
  const [texts, setTexts] = useState<Text[]>([]);
  const [vocabulary, setVocabulary] = useState<Phrase[]>([]); // Existing phrases
  const [selectedVocab, setSelectedVocab] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState('');

  const [loadingTexts, setLoadingTexts] = useState(true);
  const [loadingVocab, setLoadingVocab] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing texts
  const fetchTexts = async () => {
    setLoadingTexts(true);
    try {
      const response = await fetch(`${API_URL}/texts`);
      if (!response.ok) throw new Error('Failed to fetch texts');
      const data: Text[] = await response.json();
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
      const response = await fetch(`${API_URL}/phrases`);
      if (!response.ok) throw new Error('Failed to fetch vocabulary');
      const data: Phrase[] = await response.json();
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

  // Handle vocabulary selection change
  const handleVocabSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selected: string[] = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setSelectedVocab(selected);
  };

  // Handle text generation
  const handleGenerateText = async (e: FormEvent) => {
    e.preventDefault();
    const combinedVocab = [
        ...selectedVocab,
        ...manualInput.split('\n').map(s => s.trim()).filter(Boolean)
    ];

    if (combinedVocab.length === 0) {
        setError("Please select or enter some vocabulary.");
        return;
    }

    setGenerating(true);
    setError(null);

    try {
        const response = await fetch(`${API_URL}/texts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vocabulary: combinedVocab }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to generate text'})); // Try to parse error
            throw new Error(errorData.detail || 'Failed to generate text');
        }
        // Success! Refetch the list of texts to show the new one
        await fetchTexts(); 
        // Clear inputs
        setSelectedVocab([]);
        setManualInput('');
        // Reset select element visual state (optional, might need DOM manipulation or key change)
        const selectElement = document.getElementById('vocab-select') as HTMLSelectElement | null;
        if (selectElement) selectElement.selectedIndex = -1;

    } catch (err) {
        setError(err instanceof Error ? err.message : 'Error generating text');
        console.error(err);
    } finally {
        setGenerating(false);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-8 text-gray-800">My Texts</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* --- Create New Text Section --- */}
      <div className="mb-12 p-6 bg-white shadow rounded-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Create New Text</h2>
        <form onSubmit={handleGenerateText}>
          {/* Grid for inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            {/* Vocabulary Selection */}
            <div>
              <label htmlFor="vocab-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select from Vocabulary:
              </label>
              {loadingVocab ? (
                <p className="text-sm text-gray-500">Loading vocabulary...</p>
              ) : (
                <select
                  id="vocab-select"
                  multiple
                  value={selectedVocab}
                  onChange={handleVocabSelection}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md h-40"
                >
                  {vocabulary.map((phrase) => (
                    <option key={phrase.id} value={phrase.text}>{phrase.text}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Manual Input Area */}
            <div>
              <label htmlFor="manual-input" className="block text-sm font-medium text-gray-700 mb-1">
                Or Enter New Vocabulary (one per line):
              </label>
              <textarea
                id="manual-input"
                rows={6}
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                placeholder={`e.g.\nHola\n¿Cómo estás?\n...`}
              />
            </div>
          </div> {/* End of grid div */}

          {/* Submit Button - outside the grid */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={generating}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Text'}
            </button>
          </div>
        </form>
      </div>

      {/* --- List of Existing Texts --- */}
      <div className="p-6 bg-white shadow rounded-md">
         <h2 className="text-xl font-semibold mb-4 text-gray-700">Generated Texts</h2>
         {loadingTexts ? (
             <p className="text-gray-500">Loading texts...</p>
         ) : texts.length > 0 ? (
            <ul className="divide-y divide-gray-200">
                {texts.map((text) => (
                    <li key={text.id} className="py-4">
                        {/* TODO: Make this a Link to /texts/{text.id} */}
                        <div className="cursor-pointer hover:bg-gray-50 p-2 rounded">
                           <p className="text-sm font-medium text-indigo-600 truncate mb-1">
                              Text #{text.id} {/* Simple title for now */}
                           </p>
                           <p className="text-sm text-gray-700 line-clamp-2">
                              {text.spanish_content}
                           </p>
                        </div>
                    </li>
                ))}
            </ul>
         ) : (
            <p className="text-gray-500">No texts generated yet.</p>
         )}
      </div>
    </>
  );
} 