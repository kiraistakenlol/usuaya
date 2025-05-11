import { Text } from '../entities/text.entity';
import { TextData, TextAnalysis, VocabularyItem } from '@usuaya/shared-types';

export function convertTextEntityToDto(entity: Text): TextData {
  const data: TextData = {
    id: entity.id,
    spanish_text: entity.spanish_text,
    analysis_data: entity.analysis_data as TextAnalysis | null,
    original_vocabulary: entity.original_vocabulary as VocabularyItem[] | null,
    audio_id: entity.audio_id,
    created_at: entity.created_at ? entity.created_at.toISOString() : "",
    updated_at: entity.updated_at ? entity.updated_at.toISOString() : '',
  };

  return data;
}

export function convertTextEntitiesToDtos(entities: Text[]): TextData[] {
    return entities.map(convertTextEntityToDto);
} 