import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Import if needed for local path config
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AudioStorageProvider } from './audio-storage.provider';

@Injectable()
export class LocalAudioStorageProvider extends AudioStorageProvider {
  private readonly logger = new Logger(LocalAudioStorageProvider.name);
  private readonly audioDir: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.audioDir = path.resolve(configService.get<string>('LOCAL_AUDIO_PATH', '../../data/audio'));
    
    try {
      if (!fs.existsSync(this.audioDir)) {
        fs.mkdirSync(this.audioDir, { recursive: true });
        this.logger.log(`Created local audio directory at ${this.audioDir}`);
      } else {
        this.logger.log(`Using existing local audio directory at ${this.audioDir}`);
      }
    } catch (error) {
       this.logger.error(`Error ensuring local audio directory exists: ${error.message}`);
       throw error; // Fail fast if storage isn't usable
    }
  }

  async saveAudio(audioBuffer: Buffer): Promise<string> {
    const id = uuidv4();
    const filename = `${id}.mp3`; // Assuming mp3 format
    const filePath = path.join(this.audioDir, filename);
    
    try {
      await fs.promises.writeFile(filePath, audioBuffer);
      this.logger.log(`Saved audio locally: ${filename}`);
      return id; // Return the ID part, not the full filename
    } catch (error) {
      this.logger.error(`Failed to save audio locally to ${filePath}: ${error.message}`);
      throw new Error(`Failed to save audio locally: ${error.message}`);
    }
  }

  async getAudioById(id: string): Promise<Buffer | null> {
    const filename = `${id}.mp3`;
    const filePath = path.join(this.audioDir, filename);
    
    try {
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`Local audio file not found: ${filename}`);
        return null;
      }
      
      const audioBuffer = await fs.promises.readFile(filePath);
      this.logger.log(`Retrieved local audio: ${filename}, size: ${audioBuffer.length} bytes`);
      return audioBuffer;
    } catch (error) {
      this.logger.error(`Failed to retrieve local audio ${filename}: ${error.message}`);
      return null; // Return null on read error
    }
  }
} 