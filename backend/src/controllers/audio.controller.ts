import { Controller, Get, Param, Res, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { AudioService } from '../services/audio.service';
import { isUUID } from 'class-validator';

@Controller('audio')
export class AudioController {
  private readonly logger = new Logger(AudioController.name);

  constructor(private readonly audioService: AudioService) {}

  @Get(':id')
  async getAudioById(@Param('id') id: string, @Res() res: Response) {
    this.logger.log(`Received request for audio with ID: ${id}`);
    
    if (!isUUID(id)) {
      this.logger.warn(`Invalid UUID format: ${id}`);
      throw new BadRequestException('Invalid ID format. Must be a UUID.');
    }
    
    try {
      const audioBuffer = await this.audioService.getAudioFileById(id);
      this.logger.log(`Sending audio file with ID: ${id}, size: ${audioBuffer.length} bytes`);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(audioBuffer);
    } catch (error) {
      this.logger.error(`Error retrieving audio file: ${error.message}`);
      throw new NotFoundException(`Audio file with ID ${id} not found`);
    }
  }
} 