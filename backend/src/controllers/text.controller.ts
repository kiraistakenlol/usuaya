import { Controller, Get, Post, Body, Param, Res, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { TextService } from '../services/text.service';
import { CreateTextDto, TextResponseDto } from '../dto/text.dto';
import { TextAnalysisData } from '@usuaya/shared-types';
import { isUUID } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Controller('texts')
export class TextController {
  private readonly logger = new Logger(TextController.name);

  constructor(private readonly textService: TextService) {}

  @Post()
  async create(@Body() createTextDto: CreateTextDto): Promise<TextResponseDto> {
    this.logger.log('Creating new text');
    const result = await this.textService.create(createTextDto);
    
    // Transform the result to TextResponseDto
    const dto = plainToClass(TextResponseDto, result, { 
      excludeExtraneousValues: true,
      enableImplicitConversion: true
    });

    // --- Manually Re-assign analysis_data --- START
    if (result.analysis_data) { 
      dto.analysis_data = result.analysis_data as TextAnalysisData;
    }
    // --- Manually Re-assign analysis_data --- END

    // Consider logging DTO before returning if needed
    return dto;
  }

  @Get()
  async findAll(): Promise<TextResponseDto[]> {
    this.logger.log('Finding all texts');
    const texts = await this.textService.findAll();
    this.logger.log('Original vocabulary:', texts.map(text => text.original_vocabulary));
    // Transform the results to TextResponseDto
    return texts.map(text => {
      const dto = plainToClass(TextResponseDto, text, { 
        excludeExtraneousValues: true,
        enableImplicitConversion: true
      });
      
      // --- Manually Re-assign analysis_data --- START
      if (text.analysis_data) { 
        dto.analysis_data = text.analysis_data as TextAnalysisData;
      }
      // --- Manually Re-assign analysis_data --- END
      
      return dto;
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TextResponseDto> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid ID format. Must be a UUID.');
    }
    
    this.logger.log(`Controller: Finding text with ID: ${id}`);
    const text = await this.textService.findOne(id);
    
    // Transform the result to TextResponseDto
    const dto = plainToClass(TextResponseDto, text, { 
      excludeExtraneousValues: true,
      enableImplicitConversion: true
    });

    if (text.analysis_data) { 
      dto.analysis_data = text.analysis_data as TextAnalysisData;
    }
  
    return dto;
  }

  @Get(':id/audio')
  async getAudioFile(@Param('id') id: string, @Res() res: Response): Promise<void> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid ID format. Must be a UUID.');
    }
    
    const audioBuffer = await this.textService.getAudioFile(id);
    if (!audioBuffer) {
      throw new NotFoundException(`Audio file for text with ID ${id} not found`);
    }
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audioBuffer);
  }
} 