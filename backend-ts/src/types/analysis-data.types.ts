// Input to Call 2
export interface IndexedWordSegment {
  index: number;
  word: string;
  start: number;
  end: number;
  confidence: number;
}

// Part of AnalysisResult
export interface AnalysisAnnotation {
  type: string;
  scope_indices: number[]; // References input indices
  label: string;
  explanation_spanish: string;
  explanation_english: string;
  explanation_russian: string;
}

// Part of AnalysisResult
export interface AnalysisByIndexEntry {
  original_word: string;
  lemma: string;
  pos: string;
  english_word_translation: string | null;
  russian_word_translation: string | null;
  vocabulary_id?: string | null;
}

// Output of Call 2
export interface AnalysisResult {
  analysis_by_index: Record<string, AnalysisByIndexEntry>; // Key is stringified input index
  annotations: Record<string, AnalysisAnnotation>;
}

// Final structure stored in DB / sent to Frontend
export interface TextAnalysisData {
  spanish_plain: string;
  word_timings: IndexedWordSegment[]; 
  analysis_result: AnalysisResult;
  english_data: EnglishData;
}

// Re-export WordTiming if needed elsewhere, or define consistently
export interface WordTiming {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

// Remove old interfaces if no longer directly used
// export interface AnalysisToken { ... }
// export interface AnalysisData { ... }

// --- New English Data Types ---
export interface EnglishToken {
  // index_eng: number; // Removed - use array index
  text: string;      // The English word/punctuation
}

export interface EnglishData {
  tokens: EnglishToken[];
  // plain: string;      // Removed - reconstruct from tokens if needed
  spanish_index_to_english_indices: Record<string, number[]>; // Renamed. Map: Spanish index (string) -> Array of English token array indices
}
// --- New English Data Types --- 