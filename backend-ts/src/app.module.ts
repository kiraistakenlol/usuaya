import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Text } from './entities/text.entity';
import { Phrase } from './entities/phrase.entity';
import { Audio } from './entities/audio.entity';
import { TextController } from './controllers/text.controller';
import { PhraseController } from './controllers/phrase.controller';
import { AudioController } from './controllers/audio.controller';
import { TextService } from './services/text.service';
import { PhraseService } from './services/phrase.service';
import { TextGeneratorService } from './services/text-generator.service';
import { AudioModule } from './modules/audio.module';
import { join } from 'path';
import { LlmModule } from './llm/llm.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '../../.env'),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'user'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_DATABASE', 'vibe_dev'),
        entities: [Text, Phrase, Audio],
        synchronize: true,
        ssl: {
          rejectUnauthorized: false,
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Text, Phrase]),
    AudioModule,
    LlmModule,
  ],
  controllers: [TextController, PhraseController, AudioController],
  providers: [TextService, PhraseService, TextGeneratorService],
})
export class AppModule {}
