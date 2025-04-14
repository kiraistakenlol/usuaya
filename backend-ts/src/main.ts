import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const dbHost = configService.get<string>('DB_HOST') || 'localhost';
  const dbPort = configService.get<number>('DB_PORT') || 5432;
  const dbUsername = configService.get<string>('DB_USERNAME') || 'user';
  const dbDatabase = configService.get<string>('DB_DATABASE') || 'vibe_dev';

  logger.log(`--- Database Connection ---`);
  logger.log(`  Host    : ${dbHost}`);
  logger.log(`  Port    : ${dbPort}`);
  logger.log(`  Username: ${dbUsername}`);
  logger.log(`  Database: ${dbDatabase}`);
  logger.log(`---------------------------`);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  const port = process.env.PORT || 8000;
  await app.listen(port);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
