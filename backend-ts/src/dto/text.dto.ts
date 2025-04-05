import { IsString, IsArray, IsOptional } from 'class-validator';

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