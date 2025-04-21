import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Phrase } from '../entities/phrase.entity';
import { CreatePhraseDto, UpdatePhraseDto } from '@usuaya/shared-types';
import { isUUID } from 'class-validator';

@Injectable()
export class PhraseService {
  constructor(
    @InjectRepository(Phrase)
    private phraseRepository: Repository<Phrase>,
  ) {}

  async create(createPhraseDto: CreatePhraseDto): Promise<Phrase> {
    const phrase = this.phraseRepository.create(createPhraseDto);
    return this.phraseRepository.save(phrase);
  }

  async findAll(): Promise<Phrase[]> {
    return this.phraseRepository.find();
  }

  async findOne(id: string): Promise<Phrase> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid ID format. Must be a UUID.');
    }

    try {
      const phrase = await this.phraseRepository.findOneBy({ id });
      if (!phrase) {
        throw new NotFoundException(`Phrase with ID ${id} not found`);
      }
      return phrase;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Invalid ID format or database error: ${error.message}`);
    }
  }

  async update(id: string, updatePhraseDto: UpdatePhraseDto): Promise<Phrase> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid ID format. Must be a UUID.');
    }

    const phrase = await this.findOne(id);
    Object.assign(phrase, updatePhraseDto);
    return this.phraseRepository.save(phrase);
  }

  async remove(id: string): Promise<void> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid ID format. Must be a UUID.');
    }

    const result = await this.phraseRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Phrase with ID ${id} not found`);
    }
  }
} 