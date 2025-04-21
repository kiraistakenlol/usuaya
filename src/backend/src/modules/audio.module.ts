import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Audio } from '../entities/audio.entity';
import { AudioService } from '../services/audio.service';
import { AudioGeneratorService } from '../services/audio-generator.service';
import { AudioStorageProvider } from '../audio-storage/audio-storage.provider';
import { LocalAudioStorageProvider } from '../audio-storage/local.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([Audio]),
  ],
  providers: [
    AudioService,
    AudioGeneratorService,
    {
      provide: AudioStorageProvider,
      useClass: LocalAudioStorageProvider,
    },
  ],
  exports: [
    AudioService,
    AudioGeneratorService,
    AudioStorageProvider,
  ],
})
export class AudioModule {} 