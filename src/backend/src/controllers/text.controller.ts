import { Controller, Get, Post, Body, Param, Res, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { TextService } from '../services/text.service';
import { CreateTextDto } from '@usuaya/shared-types';
import { TextData } from '@usuaya/shared-types';
import { isUUID } from 'class-validator';
import { convertTextEntityToDto, convertTextEntitiesToDtos } from '../utils/converters';

@Controller('texts')
export class TextController {
  private readonly logger = new Logger(TextController.name);

  constructor(private readonly textService: TextService) {}

  @Post()
  async create(@Body() createTextDto: CreateTextDto): Promise<TextData> {
    this.logger.log('Creating new text');
    const entity = await this.textService.create(createTextDto);
    return convertTextEntityToDto(entity);
  }

  @Get()
  async findAll(): Promise<TextData[]> {
    this.logger.log('Finding all texts');
    const entities = await this.textService.findAll();
    return convertTextEntitiesToDtos(entities);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TextData> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid ID format. Must be a UUID.');
    }
    
    this.logger.log(`Controller: Finding text with ID: ${id}`);
    const entity = await this.textService.findOne(id);
    return convertTextEntityToDto(entity);
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