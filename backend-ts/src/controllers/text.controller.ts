import { Controller, Get, Post, Body, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { TextService } from '../services/text.service';
import { CreateTextDto } from '../dto/text.dto';

@Controller('texts')
export class TextController {
  constructor(private readonly textService: TextService) {}

  @Post()
  async create(@Body() createTextDto: CreateTextDto) {
    return this.textService.create(createTextDto);
  }

  @Get()
  async findAll() {
    return this.textService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.textService.findOne(id);
  }

  @Get(':id/audio')
  async getAudioFile(@Param('id') id: string, @Res() res: Response) {
    const audioBuffer = await this.textService.getAudioFile(id);
    if (!audioBuffer) {
      throw new NotFoundException(`Audio file for text with ID ${id} not found`);
    }
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audioBuffer);
  }
} 