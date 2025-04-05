import { Controller, Get, Post, Body, Param, Res, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { TextService } from '../services/text.service';
import { CreateTextDto, TextResponseDto } from '../dto/text.dto';
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
    return plainToClass(TextResponseDto, result, { 
      excludeExtraneousValues: true,
      enableImplicitConversion: true
    });
  }

  @Get()
  async findAll(): Promise<TextResponseDto[]> {
    this.logger.log('Finding all texts');
    const texts = await this.textService.findAll();
    
    // Transform the results to TextResponseDto
    return texts.map(text => plainToClass(TextResponseDto, text, { 
      excludeExtraneousValues: true,
      enableImplicitConversion: true
    }));
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TextResponseDto> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid ID format. Must be a UUID.');
    }
    
    this.logger.log(`Finding text with ID: ${id}`);
    const text = await this.textService.findOne(id);
    
    // Transform the result to TextResponseDto
    return plainToClass(TextResponseDto, text, { 
      excludeExtraneousValues: true,
      enableImplicitConversion: true
    });
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