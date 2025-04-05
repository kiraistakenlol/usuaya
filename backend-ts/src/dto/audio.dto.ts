import { IsString, IsArray, IsOptional, IsUUID, IsDate } from 'class-validator';
import { Expose, Transform } from 'class-transformer';

export class AudioResponseDto {
  @IsUUID()
  @Expose()
  id: string;

  @IsString()
  @Expose()
  file_id: string;

  @IsArray()
  @IsOptional()
  @Expose()
  word_timings: {
    word: string;
    start: number;
    end: number;
    confidence: number;
  }[] | null;

  @IsString()
  @Expose()
  @Transform(({ value, obj }) => {
    // If we have a text_id property, use that
    if (obj.text_id) {
      return obj.text_id;
    }
    // Otherwise, try to get the ID from the text relationship
    if (obj.text && obj.text.id) {
      return obj.text.id;
    }
    return null;
  })
  text_id: string | null;

  @IsString()
  @Expose()
  @Transform(({ value }) => {
    if (!value) return null;
    return value instanceof Date ? value.toISOString() : value;
  })
  created_at: string;

  @IsString()
  @Expose()
  @Transform(({ value }) => {
    if (!value) return null;
    return value instanceof Date ? value.toISOString() : value;
  })
  updated_at: string;
} 