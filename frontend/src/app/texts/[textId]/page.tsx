'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Hook to get route params
import Link from 'next/link'; // For back button
import { AudioPlayer } from '@/components/AudioPlayer';

// --- Use Final Data Structure Type --- START
// Remove old definitions, assume types are central or defined in AudioPlayer
// Import TextAnalysisData if centralizing types
// For now, redefine locally based on backend
export interface IndexedWordSegment {
  index: number;
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface AnalysisAnnotation {
  type: string;
  scope_indices: number[]; // References input indices
  label: string;
  explanation_spanish: string;
  explanation_english: string;
  explanation_russian: string;
}

export interface AnalysisByIndexEntry {
  original_word: string;
  lemma: string;
  pos: string;
  english_word_translation: string | null;
  russian_word_translation: string | null;
  annotation_ids: string[]; // IDs linking to top-level annotations
}

export interface AnalysisResult {
  analysis_by_index: Record<string, AnalysisByIndexEntry>; // Key is stringified input index
  annotations: Record<string, AnalysisAnnotation>;
  english_translation_plain: string; // Add missing field
}

export interface TextAnalysisData {
  spanish_plain: string;
  english_translation_plain: string;
  word_timings: IndexedWordSegment[];
  analysis_result: AnalysisResult;
}
// --- Use Final Data Structure Type --- END

interface Text {
  id: string;
  spanish_text: string;
  english_translation: string | null;
  analysis_data: TextAnalysisData | null;
  audio_id: string | null; // Direct audio file ID
  created_at: string;
  updated_at: string; // Added if available/needed
}

const API_URL = 'http://localhost:8000';

export default function TextDetailPage() {
  const params = useParams();
  const textId = params.textId; // Get the ID from the URL

  const [text, setText] = useState<Text | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    if (!textId) return; // Don't fetch if ID is not available yet

    const fetchText = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/texts/${textId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Text not found');
          } else {
            throw new Error('Failed to fetch text details');
          }
        }
        const data: Text = await response.json();
        console.log('Fetched text data (new structure):', data);
        setText(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchText();
  }, [textId]); // Refetch if textId changes

  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error('Audio error:', e);
    setAudioError('Failed to load audio file');
  };

  return (
    <>
      <div className="mb-6">
         <Link href="/texts" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
           &larr; Back to All Texts
         </Link>
      </div>

      {loading && <p className="text-gray-500">Loading text...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {text && !loading && !error && (
        <div className="bg-white shadow rounded-md overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
             <div className="flex justify-between items-start mb-4">
               <h2 className="text-lg font-medium text-gray-900">
                 Text Details
               </h2>
               <p className="text-sm text-gray-500">
                 Created: {(() => {
                   try {
                     // Check if created_at exists
                     if (!text.created_at) {
                       return 'Date unavailable';
                     }
                     
                     // Parse the UTC timestamp from the backend
                     const date = new Date(text.created_at);
                     
                     // Format the date in local timezone
                     return date.toLocaleString(undefined, {
                       year: 'numeric',
                       month: 'numeric',
                       day: 'numeric',
                       hour: '2-digit',
                       minute: '2-digit',
                       hour12: true
                     });
                   } catch (error) {
                     console.error('Error parsing date:', error);
                     return 'Date unavailable';
                   }
                 })()}
               </p>
             </div>
             
             {/* Audio Player - Pass relevant parts of analysis_data */}
             {/* Check if analysis_data and nested properties exist */}
             {text.analysis_data && text.analysis_data.word_timings && text.audio_id && (
                <div className="mt-4">
                    <AudioPlayer
                      audioUrl={`${API_URL}/texts/${text.id}/audio`}
                      wordTimings={text.analysis_data.word_timings}
                      text={text.analysis_data.spanish_plain}
                      analysisResult={text.analysis_data.analysis_result}
                    />
                </div>
             )}

             <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-700 mb-2">Spanish Content:</h3>
                {/* Preserve whitespace and newlines from the stored text */}
                <p className="text-gray-800 whitespace-pre-wrap">
                   {text.spanish_text}
                </p>
             </div>

             <div>
                <h3 className="text-base font-semibold text-gray-700 mb-2">English Translation:</h3>
                <p className="text-gray-600 italic">
                   {text.english_translation || '(No translation available)'}
                </p>
             </div>
          </div>
        </div>
      )}
    </>
  );
} 