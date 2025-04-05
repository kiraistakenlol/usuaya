import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Text } from '../entities/text.entity';
import { TextGeneratorService } from './text-generator.service';
import { AudioGeneratorService } from './audio-generator.service';
import { CreateTextDto } from '../dto/text.dto';
import { isUUID } from 'class-validator';

@Injectable()
export class TextService {
  constructor(
    @InjectRepository(Text)
    private textRepository: Repository<Text>,
    private textGeneratorService: TextGeneratorService,
    private audioGeneratorService: AudioGeneratorService,
  ) {}

  async create(createTextDto: CreateTextDto): Promise<Text> {
    console.log('Starting text generation with vocabulary:', createTextDto.vocabulary);
    
    const { spanishText, englishTranslation, vocabularyUsage } = await this.textGeneratorService.generateText(
      createTextDto.vocabulary,
    );
    console.log('Generated text:', { spanishText, englishTranslation, vocabularyUsage });

    console.log('Starting audio generation for Spanish text:', spanishText);
    const audioId = await this.audioGeneratorService.generateAudio(spanishText);
    console.log('Audio generation result:', audioId ? 'Success' : 'Failed');
    console.log('Audio file ID created:', audioId || 'No');

    const text = this.textRepository.create({
      spanish_text: spanishText,
      english_translation: englishTranslation,
      vocabulary_usage: vocabularyUsage,
      audio_file_id: audioId || undefined,
    });

    console.log('Saving text to database...');
    const savedText = await this.textRepository.save(text);
    console.log('Text saved successfully with ID:', savedText.id);
    
    return savedText;
  }

  async findAll(): Promise<Text[]> {
    return this.textRepository.find({
      order: {
        created_at: 'DESC'
      }
    });
  }

  async findOne(id: string): Promise<Text> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid ID format. Must be a UUID.');
    }

    try {
      const text = await this.textRepository.findOneBy({ id });
      if (!text) {
        throw new NotFoundException(`Text with ID ${id} not found`);
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
    if (!text.audio_file_id) {
      return null;
    }
    return this.audioGeneratorService.getAudioById(text.audio_file_id);
  }
} 