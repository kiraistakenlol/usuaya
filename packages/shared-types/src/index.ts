import { Expose } from 'class-transformer';

// --- Shared Primitive/Structure Types ---

export class WordTiming {
  word!: string;
  start!: number;
  end!: number;
  confidence!: number;
}

export class IndexedWordSegment extends WordTiming {
    index!: number;
}

export interface IndexedSpanishWordDetail {
  text: string;
  vocabulary_id: string | null;
}

// Represents the detailed analysis from the LLM
export interface TextAnalysisData {
    word_timings: IndexedWordSegment[]; // Timing with index from analysis
    indexed_spanish_words: Record<string, IndexedSpanishWordDetail>;
    indexed_english_translation_words: string[];
    alignment_spanish_to_english: Record<string, number[]>;
    // Removed spanish_plain as it's redundant with indexed_spanish_words
}

// --- Shared Entity/DTO Types ---

// Matches backend VocabularyItemDto
export class VocabularyItem {
  @Expose() id!: string; // Assuming UUID string from backend
  @Expose() word!: string;
}

// Matches backend AudioResponseDto (relevant fields)
export class AudioData {
  id!: string;
  file_id!: string; 
  word_timings!: WordTiming[]; // Simple WordTiming without index for audio playback
  created_at!: string;
  updated_at!: string;
}

// Matches backend TextResponseDto
export interface TextData {
  id: string;
  spanish_text: string;
  analysis_data: TextAnalysisData | null;
  original_vocabulary: VocabularyItem[] | null;
  audio: AudioData | null;
  created_at: string;
  updated_at: string;
}

// Backend DTO for creating text
export interface CreateTextDto {
  vocabulary: string[];
}

// Backend DTO for creating phrases (if needed, example)
export interface CreatePhraseDto {
  text: string;
}

// Frontend Phrase type (assuming integer ID from old definition)
export class Phrase {
  id!: number;
  text!: string;
} 