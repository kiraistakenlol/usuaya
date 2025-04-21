import { DataSource } from 'typeorm';
import { Text } from './entities/text.entity';
import { Phrase } from './entities/phrase.entity';
import { Audio } from './entities/audio.entity';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../../../.env') });

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'vibe_dev',
  entities: [Text, Phrase, Audio],
  synchronize: false,
  ssl: false,
}); 