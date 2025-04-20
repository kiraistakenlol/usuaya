import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audio } from '../entities/audio.entity';
import { AudioGeneratorService } from './audio-generator.service';
import { AudioStorageService } from './audio-storage.service';
import { WordTiming } from '@usuaya/shared-types';

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);

  constructor(
    @InjectRepository(Audio)
    private readonly audioRepository: Repository<Audio>,
    private readonly audioGeneratorService: AudioGeneratorService,
    private readonly audioStorageService: AudioStorageService,
  ) {}

  async generateAudio(text: string): Promise<Audio> {
    this.logger.log(`Generating audio for text: ${text.substring(0,30)}...`);
    
    try {
      const { audioBuffer, wordTimings } = await this.audioGeneratorService.generateAudioWithTimings(text);
      
      const fileId = await this.audioStorageService.saveAudio(audioBuffer);
      this.logger.log(`Audio file saved with file_id: ${fileId}`);

      const audioEntity = this.audioRepository.create({
        file_id: fileId,
        word_timings: wordTimings,
      });
      
      const savedAudio = await this.audioRepository.save(audioEntity);
      this.logger.log(`Audio entity saved with ID: ${savedAudio.id}`);

      return savedAudio;
    } catch (error) {
      this.logger.error(`Error generating audio: ${error.message}`);
      throw error;
    }
  }

  async getAudioById(id: string): Promise<Audio> {
    const audio = await this.audioRepository.findOne({ where: { id } });
    if (!audio) {
      throw new NotFoundException(`Audio entity with ID ${id} not found`);
    }
    return audio;
  }

  async getAudioFileById(audioEntityId: string): Promise<Buffer> {
    this.logger.debug(`Getting audio file for Audio entity ID: ${audioEntityId}`);
    const audioEntity = await this.getAudioById(audioEntityId);
    this.logger.debug(`Found Audio entity, fetching file ID: ${audioEntity.file_id}`);
    const audioBuffer = await this.audioStorageService.getAudioById(audioEntity.file_id);
    
    if (!audioBuffer) {
      throw new NotFoundException(`Audio file data not found in storage for file ID: ${audioEntity.file_id}`);
    }
    
    return audioBuffer;
  }
} 