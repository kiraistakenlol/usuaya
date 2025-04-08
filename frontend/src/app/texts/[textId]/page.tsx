'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Hook to get route params
import Link from 'next/link'; // For back button
import { AudioPlayer } from '@/components/AudioPlayer';

// Import central types (adjust path as needed)
// import { AnalysisData, AnalysisToken, AnalysisAnnotation, WordTiming } from '@/types'; // Assuming a central @/types file

// --- Use Final Data Structure Type --- START
// Redefine locally based on backend types
export interface IndexedWordSegment {
  index: number;
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface AnalysisAnnotation {
  type: string;
  scope_indices: number[];
  label: string;
  explanation_spanish: string;
  explanation_english: string;
  // explanation_russian: string; // Removed for now
}

export interface AnalysisByIndexEntry {
  original_word: string;
  lemma: string;
  pos: string;
  english_word_translation: string | null;
  // russian_word_translation: string | null; // Removed for now
  annotation_ids: string[];
}

// --- Add English Types --- START
export interface EnglishToken {
  text: string;
}

export interface EnglishData {
  tokens: EnglishToken[];
  spanish_index_to_english_indices: Record<string, number[]>;
}
// --- Add English Types --- END

export interface AnalysisResult {
  analysis_by_index: Record<string, AnalysisByIndexEntry>;
  annotations: Record<string, AnalysisAnnotation>;
  // No english_translation_plain here
}

export interface TextAnalysisData {
  spanish_plain: string;
  word_timings: IndexedWordSegment[];
  analysis_result: AnalysisResult;
  english_data: EnglishData; // Added
}
// --- Use Final Data Structure Type --- END

interface Text {
  id: string;
  spanish_text: string;
  // english_translation: string | null; // Removed - use analysis_data.english_data.tokens
  analysis_data: TextAnalysisData | null;
  audio_id: string | null;
  created_at: string;
  updated_at: string;
}

const API_URL = 'http://localhost:8000';

export default function TextDetailPage() {
  const params = useParams();
  const textId = params.textId as string; // Assume valid string ID

  const [text, setText] = useState<Text | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null); // State for blob URL
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false); // State for audio fetch

  // Effect to fetch text details
  useEffect(() => {
    if (!textId) return; 
    // Reset blob URL when ID changes
    setAudioBlobUrl(null);
    const fetchText = async () => {
      setLoading(true);
      setError(null);
      setAudioError(null);
      try {
        const response = await fetch(`${API_URL}/texts/${textId}`);
        if (!response.ok) {
          if (response.status === 404) throw new Error('Text not found');
          else throw new Error('Failed to fetch text details');
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
  }, [textId]); 

  // Effect to fetch audio blob when text is loaded
  useEffect(() => {
    // Only run if we have text details and an audio_id, and haven't fetched yet
    if (text && text.audio_id && !audioBlobUrl && !isAudioLoading) {
      let objectUrl: string | null = null;

      const fetchAudio = async () => {
        setIsAudioLoading(true);
        setAudioError(null);
        console.log(`Fetching audio blob for text ID: ${text.id}`);
        try {
          const response = await fetch(`${API_URL}/texts/${text.id}/audio`);
          if (!response.ok) {
            throw new Error(`Failed to fetch audio (status: ${response.status})`);
          }
          const blob = await response.blob();
          objectUrl = URL.createObjectURL(blob);
          console.log(`Created blob URL: ${objectUrl}`);
          setAudioBlobUrl(objectUrl);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred fetching audio';
          console.error('Audio fetch error:', errorMsg);
          setAudioError(errorMsg);
        } finally {
          setIsAudioLoading(false);
        }
      };

      fetchAudio();

      // Cleanup function
      return () => {
        if (objectUrl) {
          console.log(`Revoking blob URL: ${objectUrl}`);
          URL.revokeObjectURL(objectUrl);
        }
      };
    }
    // Also run cleanup if the component unmounts or text changes before fetch completes
    return () => {
      if (audioBlobUrl) {
         console.log(`Revoking blob URL on unmount/text change: ${audioBlobUrl}`);
         URL.revokeObjectURL(audioBlobUrl);
      }
    }

  }, [text, audioBlobUrl, isAudioLoading]); // Dependencies

  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error('Audio error reported by element:', e);
    setAudioError('Failed to load or play audio');
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
             
             {/* Use simplified AudioPlayer */}
             {isAudioLoading && <p className="text-gray-500 mt-4">Loading audio...</p>}
             {audioError && 
               <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mt-4" role="alert">
                   <strong className="font-bold">Audio Error:</strong>
                   <span className="block sm:inline"> {audioError}</span>
               </div>
             }
             {/* Check analysis_data exists before rendering player */}
             {audioBlobUrl && text.analysis_data && (
               <div className="mt-4">
                   <AudioPlayer
                     audioUrl={audioBlobUrl}
                     wordTimings={text.analysis_data.word_timings}
                     analysisResult={text.analysis_data.analysis_result}
                   />
               </div>
             )}

             {/* --- Remove Native HTML5 Audio Element --- START */}
             {/* 
             {text.audio_id && (
               <div className="mt-6 border-t pt-4">
                 <h4 className="text-sm font-medium text-gray-600 mb-2">Native Audio Element Test:</h4>
                 <audio 
                   controls 
                   src={audioBlobUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"} // Use blob URL here too if testing
                   className="w-full"
                   onError={handleAudioError}
                 >
                   Your browser does not support the audio element.
                 </audio>
               </div>
             )}
             */}
             {/* --- Remove Native HTML5 Audio Element --- END */}

             <div 
                style={{
                  marginTop: '20px',
                  padding: '20px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                }}
             >
                <h3 className="text-base font-semibold text-gray-700 mb-2">English Translation:</h3>
                <p className="text-gray-600">
                   {/* Reconstruct plain text from English tokens */}
                   {text.analysis_data?.english_data?.tokens 
                     ? text.analysis_data.english_data.tokens.map(token => token.text).join(' ') 
                     : '(No translation available)'}
                </p>
             </div>
          </div>
        </div>
      )}
    </>
  );
} 