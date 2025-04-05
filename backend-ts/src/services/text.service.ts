import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Text } from '../entities/text.entity';
import { TextGeneratorService } from './text-generator.service';
import { AudioGeneratorService } from './audio-generator.service';
import { CreateTextDto } from '../dto/text.dto';

@Injectable()
export class TextService {
  constructor(
    @InjectRepository(Text)
    private textRepository: Repository<Text>,
    private textGeneratorService: TextGeneratorService,
    private audioGeneratorService: AudioGeneratorService,
  ) {}

  async create(createTextDto: CreateTextDto): Promise<Text> {
    const { spanishText, englishTranslation, vocabularyUsage } = await this.textGeneratorService.generateText(
      createTextDto.vocabulary,
    );

    const audioBuffer = await this.audioGeneratorService.generateAudio(spanishText);
    const audioFileId = audioBuffer ? Buffer.from(audioBuffer).toString('base64') : undefined;

    const text = this.textRepository.create({
      spanish_text: spanishText,
      english_translation: englishTranslation,
      vocabulary_usage: vocabularyUsage,
      audio_file_id: audioFileId,
    });

    return this.textRepository.save(text);
  }

  async findAll(): Promise<Text[]> {
    return this.textRepository.find();
  }

  async findOne(id: string): Promise<Text> {
    const text = await this.textRepository.findOneBy({ id });
    if (!text) {
      throw new NotFoundException(`Text with ID ${id} not found`);
    }
    return text;
  }

  async getAudioFile(id: string): Promise<Buffer | null> {
    const text = await this.findOne(id);
    if (!text.audio_file_id) {
      return null;
    }
    return Buffer.from(text.audio_file_id, 'base64');
  }
} 