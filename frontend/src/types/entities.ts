import { WordTiming, TextAnalysisData } from './analysis';

// Shared type for Vocabulary items (from backend DTO)
export interface VocabularyItem {
  id: string; // Keep as string if UUID, otherwise number if integer ID
  word: string;
}

// Shared type for Phrases (from backend DTO)
export interface Phrase {
  id: number; // Assuming integer ID from page.tsx
  text: string;
}

// Shared type for Audio Data structure
export interface AudioData {
  id: string;
  file_id: string;
  word_timings: WordTiming[]; // Use WordTiming from analysis.ts
  // created_at?: string; // Optional, if needed
  // updated_at?: string; // Optional, if needed
}

// Consolidated Text type based on backend DTO and usage
export interface Text {
  id: string;
  spanish_text: string;
  analysis_data: TextAnalysisData | null;
  original_vocabulary: VocabularyItem[] | null;
  audio_id: string | null;
  created_at: string;
  updated_at: string;
  // Removed english_translation as it's not directly on the backend DTO
} 