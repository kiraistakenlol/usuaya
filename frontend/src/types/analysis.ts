export interface IndexedWordSegment {
    index: number;
    word: string;
    start: number;
    end: number;
    confidence: number;
}

export interface WordTiming {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface IndexedSpanishWordDetail {
  text: string;
  vocabulary_id: string | null;
}

export interface TextAnalysisData {
    spanish_plain: string;
    word_timings: IndexedWordSegment[];
    indexed_spanish_words: Record<string, IndexedSpanishWordDetail>;
    indexed_english_translation_words: string[];
    alignment_spanish_to_english: Record<string, number[]>;
} 