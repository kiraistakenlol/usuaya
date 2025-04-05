import { IsString, IsArray, IsOptional, IsUUID, IsDate } from 'class-validator';
import { Expose, Transform } from 'class-transformer';

export class CreateTextDto {
  @IsArray()
  @IsString({ each: true })
  vocabulary: string[];
}

export class UpdateTextDto {
  @IsString()
  @IsOptional()
  spanish_text?: string;

  @IsString()
  @IsOptional()
  english_translation?: string;

  @IsString()
  @IsOptional()
  vocabulary_usage?: string;

  @IsString()
  @IsOptional()
  audio_file_id?: string;
}

export class TextResponseDto {
  @IsUUID()
  @Expose()
  id: string;

  @IsString()
  @Expose()
  spanish_text: string;

  @IsString()
  @IsOptional()
  @Expose()
  english_translation: string | null;

  @IsString()
  @IsOptional()
  @Expose()
  vocabulary_usage: string | null;

  @IsString()
  @IsOptional()
  @Expose()
  audio_file_id: string | null;

  @IsString()
  @Expose()
  @Transform(({ value }) => {
    if (!value) return null;
    // Convert the Date object to an ISO string to preserve UTC
    return value instanceof Date ? value.toISOString() : value;
  })
  created_at: string;

  @IsString()
  @Expose()
  @Transform(({ value }) => {
    if (!value) return null;
    // Convert the Date object to an ISO string to preserve UTC
    return value instanceof Date ? value.toISOString() : value;
  })
  updated_at: string;
} 