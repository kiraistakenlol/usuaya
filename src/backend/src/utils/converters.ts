import { Text } from '../entities/text.entity';
// import { TextResponseDto } from '../dto/text.dto'; // No longer needed
import { TextData, TextAnalysis, VocabularyItem } from '@usuaya/shared-types';
// import { plainToClass } from 'class-transformer'; // No longer needed

/**
 * Converts a Text entity to TextData for API responses.
 * @param entity The Text entity to convert.
 * @returns The corresponding TextData object.
 */
export function convertTextEntityToDto(entity: Text): TextData {
  // Manual mapping from entity to TextData interface
  const data: TextData = {
    id: entity.id,
    spanish_text: entity.spanish_text,
    analysis_data: entity.analysis_data as TextAnalysis | null, // Keep direct assignment
    original_vocabulary: entity.original_vocabulary as VocabularyItem[] | null, // Keep direct assignment
    audio_id: entity.audio_id, // Now compatible with TextData type (string | null)
    created_at: entity.created_at.toISOString(), // Manual transformation
    updated_at: entity.updated_at.toISOString(), // Manual transformation
  };

  return data;
}

/**
 * Converts an array of Text entities to an array of TextData objects.
 * @param entities The array of Text entities.
 * @returns The array of corresponding TextData objects.
 */
export function convertTextEntitiesToDtos(entities: Text[]): TextData[] {
    // This function automatically uses the updated convertTextEntityToDto
    return entities.map(convertTextEntityToDto);
} 