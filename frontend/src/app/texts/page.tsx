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
        const response = await fetch(`${API_URL}/texts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vocabulary: combinedVocab }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to generate text'}));
            throw new Error(errorData.detail || 'Failed to generate text');
        }
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
            {/* Vocabulary Selection - Changed to scrollable list */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add Word from Vocabulary (Click to add):
              </label>
              {loadingVocab ? (
                <p className="text-sm text-gray-500">Loading vocabulary...</p>
              ) : (
                <div className="mt-1 w-full h-40 overflow-y-auto border border-gray-300 rounded-md bg-white">
                  {vocabulary.length === 0 ? (
                      <p className="text-sm text-gray-500 p-2">No vocabulary found.</p>
                  ) : (
                     <ul className="divide-y divide-gray-200">
                       {vocabulary.map((phrase) => (
                         <li key={phrase.id}>
                           <button
                             type="button" // Prevent form submission
                             onClick={() => handleAddVocabWord(phrase.text)}
                             className="w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                           >
                             {phrase.text}
                           </button>
                         </li>
                       ))}
                     </ul>
                  )}
                </div>
              )}
            </div>

            {/* Manual Input Area */}
            <div>
              <label htmlFor="manual-input" className="block text-sm font-medium text-gray-700 mb-1">
                Vocabulary for New Text (one per line):
              </label>
              <textarea
                id="manual-input"
                rows={6}
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md text-gray-900"
                placeholder={`Type words here,
or click list on left...
--------------------
Hola
¿Cómo estás?
...`}
              />
            </div>
          </div> {/* End of grid div */}

          {/* Submit Button */}
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
                        <Link href={`/texts/${text.id}`} className="block hover:bg-gray-50 p-2 rounded">
                           <p className="text-sm font-medium text-indigo-600 truncate mb-1">
                              Text #{text.id} {/* Simple title for now */}
                           </p>
                           <p className="text-sm text-gray-700 line-clamp-2">
                              {text.spanish_content}
                           </p>
                        </Link>
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