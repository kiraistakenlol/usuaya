import { IsString, IsArray, IsOptional, IsUUID, IsDate } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
// Remove import of local AudioResponseDto as we use shared AudioData
// import { AudioResponseDto } from './audio.dto';
// Import shared types
import { TextAnalysisData, VocabularyItem, CreateTextDto as SharedCreateTextDto, TextData, AudioData, Phrase } from '@usuaya/shared-types';

// Rename imported CreateTextDto to avoid conflict with local (if any)
export { SharedCreateTextDto as CreateTextDto };

// Keep backend-specific UpdateTextDto
export class UpdateTextDto {
  @IsString()
  @IsOptional()
  spanish_text?: string;

  @IsString()
  @IsOptional()
  audio_file_id?: string;
}

// Remove local VocabularyItemDto (use shared VocabularyItem)
// Remove local TextResponseDto (use shared TextData)

// You might not need this file at all if all DTOs are now shared or defined elsewhere.
// However, if UpdateTextDto is used, keep the file.
// Or, redefine TextResponseDto using shared types if transformations are still needed.
// Example: Redefining TextResponseDto to handle transformations while using shared base types
export class TextResponseDto {
  @Expose() @IsUUID() id: string;
  @Expose() @IsString() spanish_text: string;
  @Expose() @IsOptional() analysis_data: TextAnalysisData | null;
  
  @Expose() 
  @IsArray() 
  @IsOptional() 
  @Type(() => VocabularyItem) // Use shared VocabularyItem
  original_vocabulary: VocabularyItem[] | null;

  @Expose() 
  @IsUUID() 
  @IsOptional() 
  audio_id: string | null;

  @Expose()
  @IsArray()
  @IsOptional()
  @Type(() => Phrase) // Add Type decorator for nested validation/transformation
  phrases: Phrase[] | null; // Add phrases property

  @Expose() 
  @IsDate() // Use IsDate for validation
  @Transform(({ value }) => value instanceof Date ? value.toISOString() : value) 
  created_at: string;

  @Expose() 
  @IsDate() // Use IsDate for validation
  @Transform(({ value }) => value instanceof Date ? value.toISOString() : value) 
  updated_at: string;
} 