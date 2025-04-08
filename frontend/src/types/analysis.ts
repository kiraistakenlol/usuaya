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
    sentiment_label: string | null;
    sentiment_score: number | null;
}

export interface AnalysisByIndexEntry {
    original_word: string;
    lemma: string;
    pos: string;
    tag: string;
    dep: string;
    head_index: number;
    english_word_translation: string | null;
    annotation_ids: string[];
}

export interface EnglishToken {
    text: string;
}

export interface EnglishData {
    tokens: EnglishToken[];
    spanish_index_to_english_indices: Record<string, number[]>;
}

export interface AnalysisResult {
    analysis_by_index: Record<string, AnalysisByIndexEntry>;
    annotations: Record<string, AnalysisAnnotation>;
}

export interface TextAnalysisData {
    spanish_plain: string;
    word_timings: IndexedWordSegment[];
    analysis_result: AnalysisResult;
    english_data: EnglishData;
} 