// Input to Call 2
export interface IndexedWordSegment {
  index: number;
  word: string;
  start: number;
  end: number;
  confidence: number;
}

// Re-export WordTiming if needed elsewhere, or define consistently
// (Needed by Audio entity/service)
export interface WordTiming {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

// REMOVE Old analysis types
// export interface AnalysisAnnotation { ... }
// export interface AnalysisByIndexEntry { ... }
// export interface AnalysisResult { ... }

// --- NEW Simplified Analysis Data Types ---

// Structure representing the compact word-level analysis from LLM
interface CompactWordAnalysis {
  words: string[];
  translations_en: (string | null)[];
  vocab_ids: (string | null)[];
  // Add lemmas, pos arrays here if you decide to keep them in the compact LLM response
}

// Simplified English Data structure
export interface SimplifiedEnglishData {
  tokens: string[]; // Array of token strings
  alignment_es_en: number[][]; // Array of arrays of numbers
}

// --- NEW FINAL Simplified Analysis Data Types ---

// Structure for the value within indexed_spanish_words map
export interface IndexedSpanishWordDetail {
  text: string;           // The original Spanish word
  vocabulary_id: string | null; // Matching vocabulary ID or null
}

// Final SIMPLIFIED structure stored in DB / sent to Frontend
export interface TextAnalysisData {
  spanish_plain: string; // Keep original Spanish text
  word_timings: IndexedWordSegment[]; // Keep indexed timings for audio sync

  // Map: Spanish index (string) -> Spanish word details
  indexed_spanish_words: Record<string, IndexedSpanishWordDetail>;

  // Array of English token strings
  indexed_english_translation_words: string[];

  // Map: Spanish index (string) -> Array of English token indices
  alignment_spanish_to_english: Record<string, number[]>;
}

// REMOVE old English data types if no longer needed
// export interface EnglishToken { ... }
// export interface EnglishData { ... } 