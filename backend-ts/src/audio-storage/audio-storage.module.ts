import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalAudioStorageProvider } from './local.provider';
import { S3AudioStorageProvider } from './s3.provider';
import { AudioStorageProvider } from './audio-storage.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: AudioStorageProvider,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get<string>('AUDIO_STORAGE_PROVIDER');
        if (provider === 's3') {
          console.log('Using S3 Audio Storage Provider');
          return new S3AudioStorageProvider(configService);
        }
        console.log('Using Local Audio Storage Provider');
        return new LocalAudioStorageProvider(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [AudioStorageProvider],
})
export class AudioStorageModule {} 