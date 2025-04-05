import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Text } from '../entities/text.entity';
import { TextGeneratorService } from './text-generator.service';
import { AudioGeneratorService } from './audio-generator.service';
import { CreateTextDto } from '../dto/text.dto';
import { isUUID } from 'class-validator';

@Injectable()
export class TextService {
  private readonly logger = new Logger(TextService.name);

  constructor(
    @InjectRepository(Text)
    private textRepository: Repository<Text>,
    private textGeneratorService: TextGeneratorService,
    private audioGeneratorService: AudioGeneratorService,
  ) {}

  async create(createTextDto: CreateTextDto): Promise<Text> {
    this.logger.log(`Creating new text with vocabulary: ${createTextDto.vocabulary.join(', ')}`);
    
    const { spanishText, englishTranslation, vocabularyUsage } = await this.textGeneratorService.generateText(createTextDto.vocabulary);
    this.logger.log(`Generated text: ${spanishText.substring(0, 50)}...`);
    
    this.logger.log('Starting audio generation for Spanish text');
    const audioId = await this.audioGeneratorService.generateAudio(spanishText);
    this.logger.log(`Audio generation result: ${audioId ? 'Success' : 'Failed'}`);
    this.logger.log(`Audio file ID created: ${audioId || 'No'}`);
    
    const text = this.textRepository.create({
      spanish_text: spanishText,
      english_translation: englishTranslation,
      vocabulary_usage: vocabularyUsage,
      audio_file_id: audioId || undefined,
    });
    
    const savedText = await this.textRepository.save(text);
    this.logger.log(`Text saved with ID: ${savedText.id}`);
    
    // Log the created_at date in different formats
    this.logger.log(`Raw created_at from database: ${savedText.created_at}`);
    this.logger.log(`created_at as ISO string: ${savedText.created_at.toISOString()}`);
    this.logger.log(`created_at as UTC string: ${savedText.created_at.toUTCString()}`);
    this.logger.log(`created_at as local string: ${savedText.created_at.toString()}`);
    
    return savedText;
  }

  async findAll(): Promise<Text[]> {
    this.logger.log('Finding all texts');
    const texts = await this.textRepository.find({
      order: {
        created_at: 'DESC'
      }
    });
    
    // Log the first text's date if available
    if (texts.length > 0) {
      this.logger.log(`First text ID: ${texts[0].id}`);
      this.logger.log(`First text raw created_at: ${texts[0].created_at}`);
      this.logger.log(`First text created_at as ISO string: ${texts[0].created_at.toISOString()}`);
    }
    
    return texts;
  }

  async findOne(id: string): Promise<Text> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid ID format. Must be a UUID.');
    }

    try {
      this.logger.log(`Finding text with ID: ${id}`);
      const text = await this.textRepository.findOneBy({ id });
      if (!text) {
        throw new NotFoundException(`Text with ID ${id} not found`);
      }
      
      // Log the date in different formats
      this.logger.log(`Text found with ID: ${id}`);
      this.logger.log(`Raw created_at from database: ${text.created_at}`);
      this.logger.log(`created_at as ISO string: ${text.created_at.toISOString()}`);
      this.logger.log(`created_at as UTC string: ${text.created_at.toUTCString()}`);
      this.logger.log(`created_at as local string: ${text.created_at.toString()}`);
      
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
    if (!text.audio_file_id) {
      return null;
    }
    return this.audioGeneratorService.getAudioById(text.audio_file_id);
  }
} 