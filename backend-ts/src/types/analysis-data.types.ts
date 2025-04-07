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
  annotation_ids: string[]; // IDs linking to top-level annotations
}

// Output of Call 2
export interface AnalysisResult {
  analysis_by_index: Record<string, AnalysisByIndexEntry>; // Key is stringified input index
  annotations: Record<string, AnalysisAnnotation>;
  english_translation_plain: string;
}

// Final structure stored in DB / sent to Frontend
export interface TextAnalysisData {
  spanish_plain: string;
  english_translation_plain: string;
  // Store word timings with index for easy frontend use
  word_timings: IndexedWordSegment[]; 
  // Store the result of the second analysis call
  analysis_result: AnalysisResult;
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