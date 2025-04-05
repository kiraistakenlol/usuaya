import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Text } from '../entities/text.entity';
import { TextGeneratorService } from './text-generator.service';
import { AudioGeneratorService } from './audio-generator.service';
import { AudioService } from './audio.service';
import { CreateTextDto } from '../dto/text.dto';
import { isUUID } from 'class-validator';
import { Audio } from '../entities/audio.entity';

@Injectable()
export class TextService {
  private readonly logger = new Logger(TextService.name);

  constructor(
    @InjectRepository(Text)
    private readonly textRepository: Repository<Text>,
    private readonly textGeneratorService: TextGeneratorService,
    private readonly audioGeneratorService: AudioGeneratorService,
    private readonly audioService: AudioService,
  ) {}

  async create(createTextDto: CreateTextDto): Promise<Text> {
    this.logger.log(`Creating new text with vocabulary: ${createTextDto.vocabulary.join(', ')}`);
    
    const { spanishText, englishTranslation, analysisData } = await this.textGeneratorService.generateText(createTextDto.vocabulary);
    this.logger.log(`Generated text: ${spanishText.substring(0, 50)}...`);
    
    // Create the text entity with the new analysis data
    const text = this.textRepository.create({
      spanish_text: spanishText,
      english_translation: englishTranslation,
      analysis_data: analysisData,
    });
    
    const savedText = await this.textRepository.save(text);
    this.logger.log(`Text saved with ID: ${savedText.id}`);
    
    // Generate audio for the text
    let audio: Audio | undefined;
    try {
      this.logger.log('Starting audio generation for Spanish text');
      audio = await this.audioService.generateAudio(spanishText, savedText.id);
      this.logger.log(`Audio generated with ID: ${audio.id}`);
      
      // Update the text with audio reference
      savedText.audio = audio;
      savedText.audio_id = audio.id;
      await this.textRepository.save(savedText);
      this.logger.log(`Text updated with audio reference`);
    } catch (error) {
      this.logger.error(`Error generating audio: ${error.message}`);
      // Continue without audio if generation fails
    }
    
    return savedText;
  }

  async findAll(): Promise<Text[]> {
    this.logger.log('Finding all texts');
    const texts = await this.textRepository.find({
      relations: ['audio'],
      order: {
        created_at: 'DESC'
      }
    });
    
    // Log audio information for each text
    texts.forEach(text => {
      if (text.audio) {
        this.logger.log(`Text ID: ${text.id}, Audio ID: ${text.audio.id}`);
      } else {
        this.logger.log(`Text ID: ${text.id}, No audio`);
      }
    });
    
    return texts;
  }

  async findOne(id: string): Promise<Text> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid ID format. Must be a UUID.');
    }

    try {
      this.logger.log(`Finding text with ID: ${id}`);
      const text = await this.textRepository.findOne({
        where: { id },
        relations: ['audio'],
        select: {
          id: true,
          spanish_text: true,
          english_translation: true,
          analysis_data: true,
          audio_id: true,
          created_at: true,
          updated_at: true,
          audio: {
            id: true,
            file_id: true,
            word_timings: true,
            created_at: true,
            updated_at: true
          }
        }
      });
      
      if (!text) {
        throw new NotFoundException(`Text with ID ${id} not found`);
      }
      
      // Ensure audio is properly loaded
      if (text.audio) {
        this.logger.log(`Audio found for text with ID: ${id}, audio ID: ${text.audio.id}`);
      } else if (text.audio_id) {
        this.logger.log(`Audio ID exists but audio not loaded for text with ID: ${id}, audio ID: ${text.audio_id}`);
      } else {
        this.logger.log(`No audio found for text with ID: ${id}`);
      }
      
      return text;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Invalid ID format or database error: ${error.message}`);
    }
  }

  async getAudioFile(id: string): Promise<Buffer | null> {
    const text = await this.findOne(id);
    if (!text.audio) {
      return null;
    }
    
    try {
      return await this.audioService.getAudioFileById(text.audio.id);
    } catch (error) {
      this.logger.error(`Error getting audio file: ${error.message}`);
      return null;
    }
  }
} 