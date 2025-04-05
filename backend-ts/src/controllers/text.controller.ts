import { Controller, Get, Post, Body, Param, Res, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { TextService } from '../services/text.service';
import { CreateTextDto } from '../dto/text.dto';
import { isUUID } from 'class-validator';

@Controller('texts')
export class TextController {
  private readonly logger = new Logger(TextController.name);

  constructor(private readonly textService: TextService) {}

  @Post()
  async create(@Body() createTextDto: CreateTextDto) {
    this.logger.log('Creating new text');
    const result = await this.textService.create(createTextDto);
    
    // Log the response data
    this.logger.log(`Text created with ID: ${result.id}`);
    this.logger.log(`Response created_at: ${result.created_at}`);
    this.logger.log(`Response created_at type: ${typeof result.created_at}`);
    
    return result;
  }

  @Get()
  async findAll() {
    this.logger.log('Finding all texts');
    const texts = await this.textService.findAll();
    
    // Log the first text's date if available
    if (texts.length > 0) {
      this.logger.log(`First text ID: ${texts[0].id}`);
      this.logger.log(`First text created_at: ${texts[0].created_at}`);
      this.logger.log(`First text created_at type: ${typeof texts[0].created_at}`);
    }
    
    return texts;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid ID format. Must be a UUID.');
    }
    
    this.logger.log(`Finding text with ID: ${id}`);
    const text = await this.textService.findOne(id);
    
    // Log the response data
    this.logger.log(`Text found with ID: ${text.id}`);
    this.logger.log(`Response created_at: ${text.created_at}`);
    this.logger.log(`Response created_at type: ${typeof text.created_at}`);
    
    return text;
  }

  @Get(':id/audio')
  async getAudioFile(@Param('id') id: string, @Res() res: Response) {
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