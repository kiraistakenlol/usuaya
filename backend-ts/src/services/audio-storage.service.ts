import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AudioStorageService {
  private readonly logger = new Logger(AudioStorageService.name);
  private readonly audioDir: string;

  constructor() {
    // Create data/audio directory if it doesn't exist
    this.audioDir = path.join(process.cwd(), '..', 'data', 'audio');
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
      this.logger.log(`Created audio directory at ${this.audioDir}`);
    } else {
      this.logger.log(`Using existing audio directory at ${this.audioDir}`);
    }
  }

  /**
   * Saves audio data to a file and returns the generated ID
   */
  async saveAudio(audioBuffer: Buffer): Promise<string> {
    const id = uuidv4();
    const filePath = path.join(this.audioDir, `${id}.mp3`);
    
    try {
      await fs.promises.writeFile(filePath, audioBuffer);
      this.logger.log(`Saved audio file with ID: ${id} at path: ${filePath}`);
      return id;
    } catch (error) {
      this.logger.error(`Failed to save audio file: ${error.message}`);
      throw new Error(`Failed to save audio file: ${error.message}`);
    }
  }

  /**
   * Retrieves audio data by ID
   */
  async getAudioById(id: string): Promise<Buffer | null> {
    const filePath = path.join(this.audioDir, `${id}.mp3`);
    this.logger.log(`Attempting to retrieve audio file with ID: ${id} from path: ${filePath}`);
    
    try {
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`Audio file with ID ${id} not found at path: ${filePath}`);
        return null;
      }
      
      const audioBuffer = await fs.promises.readFile(filePath);
      this.logger.log(`Retrieved audio file with ID: ${id}, size: ${audioBuffer.length} bytes`);
      return audioBuffer;
    } catch (error) {
      this.logger.error(`Failed to retrieve audio file: ${error.message}`);
      return null;
    }
  }
} 