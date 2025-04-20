import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Audio } from '../entities/audio.entity';
import { AudioService } from '../services/audio.service';
import { AudioGeneratorService } from '../services/audio-generator.service';
import { AudioStorageService } from '../services/audio-storage.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Audio]),
  ],
  providers: [
    AudioService,
    AudioGeneratorService,
    AudioStorageService,
  ],
  exports: [
    AudioService,
    AudioGeneratorService,
    AudioStorageService,
  ],
})
export class AudioModule {} 