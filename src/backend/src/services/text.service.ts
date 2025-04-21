import {BadRequestException, Injectable, Logger, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Text} from '../entities/text.entity';
import {TextGeneratorService} from './text-generator.service';
import {AudioService} from './audio.service';
import {isUUID} from 'class-validator';
import {CreateTextDto, TextAnalysis, VocabularyItem, WordItemAnalysisLLMRequest} from '@usuaya/shared-types';

@Injectable()
export class TextService {
    private readonly logger = new Logger(TextService.name);

    constructor(
        @InjectRepository(Text)
        private readonly textRepository: Repository<Text>,
        private readonly textGeneratorService: TextGeneratorService,
        private readonly audioService: AudioService,
    ) {
    }

    async create(createTextDto: CreateTextDto): Promise<Text> {
        let generationPrompt = '';
        let rawGenerationResponse = '';
        let analysisRequest = {};
        let rawAnalysisResponse = '';

        this.logger.log(`--- Starting Text Creation for Vocab: ${createTextDto.vocabulary.join(', ')} ---`);

        try {
            // 1. Generate Spanish Text & Capture Prompt
            const generationResult = await this.textGeneratorService.generateSimpleText(createTextDto.vocabulary);
            const spanishText = generationResult.text;
            generationPrompt = generationResult.promptUsed; // Keep for DB
            rawGenerationResponse = spanishText; // Keep for DB
            this.logger.log(`Step 1 Complete: Generated Spanish Text (${spanishText.length} chars)`); // Keep step log

            // 2. Generate Audio Entity
            const audioEntity = await this.audioService.generateAudio(spanishText);
            this.logger.log(`Step 2 Complete: Generated Audio Entity ID: ${audioEntity.id}, File ID: ${audioEntity.file_id}`);

            // 3. Preprocess Timings
            if (!audioEntity.word_timings) {
                throw new Error('Word timings missing...');
            }
            const indexedTimings: WordItemAnalysisLLMRequest[] = audioEntity.word_timings.map((timing, index) => ({
                word: timing.word,
                index: index
            } as WordItemAnalysisLLMRequest));
            this.logger.log(`Step 3 Complete: Prepared ${indexedTimings.length} Indexed Timings`);

            // Prepare structured vocabulary
            const vocabulary = createTextDto.vocabulary.map((word, index) => ({
                id: index,
                text: word
            } as VocabularyItem));

            // Prepare request payload for analysis (for DB logging)
            analysisRequest = {indexed_word_segments: indexedTimings, vocabulary: vocabulary};

            // 4. Analyze Indexed Words (Final Simplified)
            const {parsedData: finalSimplifiedAnalysis, rawResponse: rawAnalysisLlmResponse} =
                await this.textGeneratorService.analyzeIndexedWords(indexedTimings,
                    vocabulary
                );
            rawAnalysisResponse = rawAnalysisLlmResponse; // Keep for DB
            this.logger.log(`Step 4 Complete: Generated Final Simplified Analysis (Parsed)`); // Simplified step log

            // 5. Combine into final structure
            const analysisDataForDb: TextAnalysis = {
                word_timings: audioEntity.word_timings,
                indexed_spanish_words: finalSimplifiedAnalysis.indexed_spanish_words,
                indexed_english_translation_words: finalSimplifiedAnalysis.indexed_english_translation_words,
                alignment_spanish_to_english: finalSimplifiedAnalysis.alignment_spanish_to_english
            };

            // 6. Create and save Text entity
            const textEntity: Text = this.textRepository.create({
                spanish_text: spanishText,
                llm_generation_request_prompt: generationPrompt,
                raw_llm_generation_response: rawGenerationResponse,
                llm_analysis_request: analysisRequest,
                raw_llm_analysis_response: rawAnalysisResponse,
                analysis_data: analysisDataForDb,
                audio: audioEntity,
                original_vocabulary: vocabulary,
            } as Text);

            const savedText = await this.textRepository.save(textEntity);
            this.logger.log(`Step 6 Complete: Text saved with ID: ${savedText.id}`);
            return savedText;
        } catch (error) {
            // Keep simplified error log
            this.logger.error(`Text creation process failed: ${error.message}`, error.stack);
            throw error;
        }
    }

    async findAll(): Promise<Text[]> {
        return await this.textRepository.find({
            select: ['id', 'spanish_text', 'created_at', 'audio_id'],
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
                where: {id},
                select: {
                    id: true,
                    spanish_text: true,
                    analysis_data: true,
                    original_vocabulary: true,
                    audio_id: true,
                    created_at: true,
                    updated_at: true,
                }
            });

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