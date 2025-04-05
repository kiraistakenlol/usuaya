import { Controller, Get, Param, Res, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { AudioGeneratorService } from '../services/audio-generator.service';
import { isUUID } from 'class-validator';

@Controller('audio')
export class AudioController {
  private readonly logger = new Logger(AudioController.name);

  constructor(private readonly audioGeneratorService: AudioGeneratorService) {}

  @Get(':id')
  async getAudioById(@Param('id') id: string, @Res() res: Response) {
    this.logger.log(`Received request for audio with ID: ${id}`);
    
    if (!isUUID(id)) {
      this.logger.warn(`Invalid UUID format: ${id}`);
      throw new BadRequestException('Invalid ID format. Must be a UUID.');
    }
    
    const audioBuffer = await this.audioGeneratorService.getAudioById(id);
    if (!audioBuffer) {
      this.logger.warn(`Audio file with ID ${id} not found`);
      throw new NotFoundException(`Audio file with ID ${id} not found`);
    }
    
    this.logger.log(`Sending audio file with ID: ${id}, size: ${audioBuffer.length} bytes`);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audioBuffer);
  }
} 