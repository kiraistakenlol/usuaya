export class WordTiming {
    word!: string;
    start!: number;
    end!: number;
    confidence!: number;
}

export interface IndexedSpanishWordDetail {
    text: string;
    vocabulary_id: string | null;
}

export interface WordItemAnalysisLLMRequest {
    index: number;
    word: string;
}

export interface TextAnalysis {
    word_timings: WordTiming[];
    indexed_spanish_words: Record<string, IndexedSpanishWordDetail>;
    indexed_english_translation_words: string[];
    alignment_spanish_to_english: Record<string, number[]>;
}

export class VocabularyItem {
    id!: number;
    text!: string;
}

export interface TextData {
    id: string;
    spanish_text: string;
    analysis_data: TextAnalysis | null;
    original_vocabulary: VocabularyItem[] | null;
    audio_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateTextDto {
    vocabulary: string[];
}

export interface CreatePhraseDto {
    text: string;
}

export class Phrase {
    id!: number;
    text!: string;
}

export class CreatePhraseDto {
    text!: string;
    translation?: string;
    notes?: string;
}

export class UpdatePhraseDto {
    text?: string;
    translation?: string;
    notes?: string;
} 