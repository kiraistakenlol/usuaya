import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Text } from './entities/text.entity';
import { TextController } from './controllers/text.controller';
import { TextService } from './services/text.service';
import { TextGeneratorService } from './services/text-generator.service';
import { AudioGeneratorService } from './services/audio-generator.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [Text],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Text]),
  ],
  controllers: [TextController],
  providers: [TextService, TextGeneratorService, AudioGeneratorService],
})
export class AppModule {}
