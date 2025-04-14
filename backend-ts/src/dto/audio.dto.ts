import { IsString, IsArray, IsOptional, IsUUID, ValidateNested, IsDate } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { WordTiming } from '@usuaya/shared-types';

export class AudioResponseDto {
  @IsUUID()
  @Expose()
  id: string;

  @IsString()
  @Expose()
  @IsOptional()
  file_id?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WordTiming)
  @IsOptional()
  word_timings?: WordTiming[] | null;

  @IsDate()
  @IsOptional()
  @Expose()
  created_at?: Date | string | null;

  @IsDate()
  @IsOptional()
  @Expose()
  updated_at?: Date | string | null;
} 