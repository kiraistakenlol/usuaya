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

  @IsDate()
  @Expose()
  @Transform(({ value }) => value ? new Date(value) : null)
  created_at: Date;

  @IsDate()
  @Expose()
  @Transform(({ value }) => value ? new Date(value) : null)
  updated_at: Date;
} 