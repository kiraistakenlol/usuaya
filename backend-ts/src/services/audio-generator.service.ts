import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElevenLabsClient } from 'elevenlabs';
import { AudioStorageService } from './audio-storage.service';
import { Readable } from 'stream';

interface WordTiming {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

@Injectable()
export class AudioGeneratorService {
  private readonly logger = new Logger(AudioGeneratorService.name);
  private readonly voiceId: string;
  private readonly modelId: string;
  private readonly client: ElevenLabsClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly audioStorageService: AudioStorageService,
  ) {
    const apiKey = this.configService.get<string>('ELEVENLABS_API_KEY');
    const voiceId = this.configService.get<string>('ELEVENLABS_VOICE_ID');
    const modelId = this.configService.get<string>('ELEVENLABS_MODEL_ID');
    
    if (!apiKey || !voiceId || !modelId) {
      throw new Error('Required ElevenLabs configuration is missing');
    }
    
    this.voiceId = voiceId;
    this.modelId = modelId;
    this.client = new ElevenLabsClient({ apiKey });
    
    this.logger.log(`Using ElevenLabs API key: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}`);
    this.logger.log(`Using voice ID: ${this.voiceId}`);
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  async generateAudio(text: string): Promise<string> {
    this.logger.log(`Generating audio for text: ${text.substring(0, 50)}...`);
    
    try {
      const audioStream = await this.client.textToSpeech.convert(this.voiceId, {
        text,
        model_id: this.modelId,
      });
      
      const audioBuffer = await this.streamToBuffer(audioStream);
      const audioId = await this.audioStorageService.saveAudio(audioBuffer);
      this.logger.log(`Audio generated and saved with ID: ${audioId}`);
      
      return audioId;
    } catch (error) {
      this.logger.error(`Error generating audio: ${error.message}`);
      throw error;
    }
  }

  async generateAudioWithTimings(text: string): Promise<{ audioBuffer: Buffer, wordTimings: WordTiming[] }> {
    this.logger.log(`Generating audio with timings for text: ${text.substring(0, 50)}...`);
    
    try {
      const response = await this.client.textToSpeech.convertWithTimestamps(this.voiceId, {
        text,
        model_id: this.modelId,
        output_format: "mp3_44100_128",
        optimize_streaming_latency: 0,
      });
      
      const audioBuffer = Buffer.from(response.audio_base64, 'base64');
      const wordTimings = this.extractWordTimings(response);
      
      this.logger.log(`Generated audio with ${wordTimings.length} word timings`);
      
      return {
        audioBuffer,
        wordTimings,
      };
    } catch (error) {
      this.logger.error(`Error generating audio with timings: ${error.message}`);
      throw error;
    }
  }

  private extractWordTimings(data: any): WordTiming[] {
    try {
      if (!data.alignment) {
        this.logger.warn('No alignment data found in the response');
        return [];
      }

      const characters = data.alignment.characters || [];
      const startTimes = data.alignment.character_start_times_seconds || [];
      const endTimes = data.alignment.character_end_times_seconds || [];

      if (characters.length === 0 || startTimes.length === 0 || endTimes.length === 0) {
        this.logger.warn('Missing character timing data in the response');
        return [];
      }

      // Group characters into words
      const words: WordTiming[] = [];
      let currentWord = '';
      let startTime = 0;
      let endTime = 0;

      for (let i = 0; i < characters.length; i++) {
        const char = characters[i];
        const charStart = startTimes[i];
        const charEnd = endTimes[i];

        if (char === ' ' || i === characters.length - 1) {
          // If we're at a space or the last character, and we have a word, add it
          if (currentWord) {
            words.push({
              word: currentWord,
              start: startTime,
              end: endTime,
              confidence: 1.0,
            });
            currentWord = '';
            startTime = 0;
          }
        } else {
          // Add character to current word
          if (!currentWord) {
            startTime = charStart;
          }
          currentWord += char;
          endTime = charEnd;
        }
      }

      return words;
    } catch (error) {
      this.logger.error(`Error extracting word timings: ${error.message}`);
      return [];
    }
  }

  async getAudioById(id: string): Promise<Buffer> {
    const audio = await this.audioStorageService.getAudioById(id);
    if (!audio) {
      throw new Error(`Audio with ID ${id} not found`);
    }
    return audio;
  }
} 