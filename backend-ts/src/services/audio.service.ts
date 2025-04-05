import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audio } from '../entities/audio.entity';
import { AudioGeneratorService } from './audio-generator.service';
import { AudioStorageService } from './audio-storage.service';

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);

  constructor(
    @InjectRepository(Audio)
    private readonly audioRepository: Repository<Audio>,
    private readonly audioGeneratorService: AudioGeneratorService,
    private readonly audioStorageService: AudioStorageService,
  ) {}

  async generateAudio(text: string, textId: string): Promise<Audio> {
    this.logger.log(`Generating audio for text ID: ${textId}`);
    
    try {
      // Generate audio with word timings
      const { audioBuffer, wordTimings } = await this.audioGeneratorService.generateAudioWithTimings(text);
      
      // Save the audio file
      const fileId = await this.audioStorageService.saveAudio(audioBuffer);
      
      // Create and save the audio entity
      const audio = this.audioRepository.create({
        file_id: fileId,
        word_timings: wordTimings,
      });
      
      const savedAudio = await this.audioRepository.save(audio);
      this.logger.log(`Audio generated and saved with ID: ${savedAudio.id}`);
      
      return savedAudio;
    } catch (error) {
      this.logger.error(`Error generating audio: ${error.message}`);
      throw error;
    }
  }

  async getAudioById(id: string): Promise<Audio> {
    const audio = await this.audioRepository.findOne({ where: { id } });
    if (!audio) {
      throw new NotFoundException(`Audio with ID ${id} not found`);
    }
    return audio;
  }

  async getAudioFileById(id: string): Promise<Buffer> {
    const audio = await this.getAudioById(id);
    const audioBuffer = await this.audioStorageService.getAudioById(audio.file_id);
    
    if (!audioBuffer) {
      throw new NotFoundException(`Audio file with ID ${id} not found`);
    }
    
    return audioBuffer;
  }
} 