export interface AnalysisToken {
  text: string;
  index: number;
  lemma: string;
  pos: string;
  english: string | null;
  russian: string | null;
  annotation_ids: string[];
}

export interface AnalysisAnnotation {
  type: string;
  scope_indices: number[];
  label: string;
  explanation_spanish: string;
  explanation_english: string;
  explanation_russian: string;
}

export interface AnalysisData {
  generated_text: {
    spanish_plain: string;
    tokens: AnalysisToken[];
    annotations: Record<string, AnalysisAnnotation>;
  };
  english_translation_plain: string;
} 