import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audio } from '../entities/audio.entity';
import { AudioGeneratorService } from './audio-generator.service';
import { AudioStorageProvider } from '../audio-storage/audio-storage.provider';
import { WordTiming } from '@usuaya/shared-types';

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);

  constructor(
    @InjectRepository(Audio)
    private readonly audioRepository: Repository<Audio>,
    private readonly audioGeneratorService: AudioGeneratorService,
    private readonly audioStorageProvider: AudioStorageProvider,
  ) {}

  async generateAudio(text: string): Promise<Audio> {
    this.logger.log(`Generating audio for text: ${text.substring(0,30)}...`);
    
    try {
      const { audioBuffer, wordTimings } = await this.audioGeneratorService.generateAudioWithTimings(text);
      
      const fileId = await this.audioStorageProvider.saveAudio(audioBuffer);
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
    const audioEntity = await this.getAudioById(audioEntityId);
    const audioBuffer = await this.audioStorageProvider.getAudioById(audioEntity.file_id);
    
    if (!audioBuffer) {
      throw new NotFoundException(`Audio file data not found in storage for file ID: ${audioEntity.file_id}`);
    }
    
    return audioBuffer;
  }
} 