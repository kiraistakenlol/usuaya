import { Controller, Get, Post, Body, Param, Put, Delete, NotFoundException, BadRequestException } from '@nestjs/common';
import { PhraseService } from '../services/phrase.service';
import { CreatePhraseDto, UpdatePhraseDto } from '../dto/phrase.dto';
import { isUUID } from 'class-validator';

@Controller('phrases')
export class PhraseController {
  constructor(private readonly phraseService: PhraseService) {}

  @Post()
  async create(@Body() createPhraseDto: CreatePhraseDto) {
    return this.phraseService.create(createPhraseDto);
  }

  @Get()
  async findAll() {
    return this.phraseService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid ID format. Must be a UUID.');
    }
    return this.phraseService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updatePhraseDto: UpdatePhraseDto) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid ID format. Must be a UUID.');
    }
    return this.phraseService.update(id, updatePhraseDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid ID format. Must be a UUID.');
    }
    return this.phraseService.remove(id);
  }
} 