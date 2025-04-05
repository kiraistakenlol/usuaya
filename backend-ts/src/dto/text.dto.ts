import { IsString, IsArray, IsOptional, IsUUID, IsDate } from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { AudioResponseDto } from './audio.dto';

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

  @IsOptional()
  @Expose()
  analysis_data: any;

  @IsOptional()
  @Expose()
  @Transform(({ value, obj }) => {
    if (value && value.id) {
      return value;
    }
    if (obj.audio_id && obj.audio) {
      return {
        id: obj.audio.id || obj.audio_id,
        file_id: obj.audio.file_id || null,
        word_timings: obj.audio.word_timings || null,
        created_at: obj.audio.created_at || null,
        updated_at: obj.audio.updated_at || null
      };
    }
    if (obj.audio_id) {
      return { id: obj.audio_id };
    }
    return null;
  })
  audio: AudioResponseDto | null;

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