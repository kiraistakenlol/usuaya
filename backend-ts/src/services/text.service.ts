import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Text } from '../entities/text.entity';
import { TextGeneratorService } from './text-generator.service';
import { AudioService } from './audio.service';
import { CreateTextDto } from '../dto/text.dto';
import { isUUID } from 'class-validator';
import { TextAnalysisData } from '../types/analysis-data.types';
import { IndexedWordSegment } from '../types/analysis-data.types';

@Injectable()
export class TextService {
  private readonly logger = new Logger(TextService.name);

  constructor(
    @InjectRepository(Text)
    private readonly textRepository: Repository<Text>,
    private readonly textGeneratorService: TextGeneratorService,
    private readonly audioService: AudioService,
  ) {}

  async create(createTextDto: CreateTextDto): Promise<Text> {
    this.logger.log(`--- Starting Text Creation for Vocab: ${createTextDto.vocabulary.join(', ')} ---`);
    
    try {
      // 1. Generate Spanish Text
      const spanishText = await this.textGeneratorService.generateSimpleText(createTextDto.vocabulary);
      this.logger.log(`Step 1 Complete: Generated Spanish Text (${spanishText.length} chars)`);

      // 2. Generate Audio Entity (contains file_id and original timings)
      const audioEntity = await this.audioService.generateAudio(spanishText);
      this.logger.log(`Step 2 Complete: Generated Audio Entity (ID: ${audioEntity.id}, FileID: ${audioEntity.file_id})`);

      // 3. Preprocess: Add index to timings from the Audio entity
      if (!audioEntity.word_timings) {
        throw new Error('Word timings missing from generated audio entity.');
      }
      const indexedTimings: IndexedWordSegment[] = audioEntity.word_timings.map((timing, index) => ({
        ...timing,
        index: index,
      }));
      this.logger.log(`Step 3 Complete: Prepared ${indexedTimings.length} Indexed Timings`);

      // 4. Analyze Indexed Words
      const analysisDataFromClaude = await this.textGeneratorService.analyzeIndexedWords(indexedTimings);
      this.logger.log(`Step 4 Complete: Generated Analysis and English Data`);
      
      // 5. Combine into final structure for Text entity's analysis_data
      const analysisData: TextAnalysisData = {
        spanish_plain: spanishText,
        word_timings: indexedTimings, // Store the indexed version
        analysis_result: analysisDataFromClaude.analysis_result, // Get from Claude response
        english_data: analysisDataFromClaude.english_data,       // Get from Claude response
      };

      // 6. Create and save Text entity, linking the Audio entity
      const text = this.textRepository.create({
        spanish_text: spanishText, 
        // english_translation: analysisData.english_data.plain, // Removed - No longer storing plain text this way
        analysis_data: analysisData, 
        audio: audioEntity, // Assign the full Audio entity to the relation
      });

      console.log('Text entity object BEFORE final save:', JSON.stringify(text, null, 2));

      const savedText = await this.textRepository.save(text);
      this.logger.log(`Step 6 Complete: Text saved with ID: ${savedText.id}`);

      return savedText;

    } catch (error) {
      this.logger.error(`Text creation process failed: ${error.message}`, error.stack);
      // Rethrow or handle appropriately
      throw error;
    }
  }

  async findAll(): Promise<Text[]> {
    this.logger.log('Finding all texts');
    return await this.textRepository.find({
      // Select only needed fields for list view
      select: ['id', 'spanish_text', 'english_translation', 'created_at', 'audio_id'],
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
      this.logger.log(`Finding text with ID: ${id}`);
      const text = await this.textRepository.findOne({
        where: { id },
        // No relations needed now if audio_id is stored directly
        select: {
          id: true,
          spanish_text: true,
          english_translation: true,
          analysis_data: true, // This contains the full TextAnalysisData structure
          audio_id: true, // The direct file ID
          created_at: true,
          updated_at: true,
        }
      });
      
      // Log Retrieved Entity
      console.log('Retrieved text entity from DB in findOne:', JSON.stringify(text, null, 2));

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
    const text = await this.findOne(id); // Fetches the text entity
    if (!text || !text.audio_id) {
      this.logger.warn(`No audio_id found for text ID: ${id}`);
      return null;
    }
    
    try {
      // Fetch using the audio_id (which is the fileId)
      return await this.audioService.getAudioFileById(text.audio_id);
    } catch (error) {
      this.logger.error(`Error getting audio file with ID ${text.audio_id}: ${error.message}`);
      return null;
    }
  }
} 