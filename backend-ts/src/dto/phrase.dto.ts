import { IsString, IsOptional } from 'class-validator';

export class CreatePhraseDto {
  @IsString()
  text: string;

  @IsString()
  @IsOptional()
  translation?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdatePhraseDto {
  @IsString()
  @IsOptional()
  text?: string;

  @IsString()
  @IsOptional()
  translation?: string;

  @IsString()
  @IsOptional()
  notes?: string;
} 