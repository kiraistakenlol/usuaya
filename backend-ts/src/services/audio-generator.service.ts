import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElevenLabsClient } from 'elevenlabs';
import { AudioStorageService } from './audio-storage.service';

@Injectable()
export class AudioGeneratorService {
  private client: ElevenLabsClient;

  constructor(
    private configService: ConfigService,
    private audioStorageService: AudioStorageService,
  ) {
    const apiKey = this.configService.get<string>('ELEVENLABS_API_KEY');
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY environment variable is not set');
    }
    
    // Use the API key directly without any formatting
    this.client = new ElevenLabsClient({ apiKey });
  }

  async generateAudio(text: string): Promise<string | null> {
    try {
      if (!text) {
        throw new Error('Text is required for audio generation');
      }

      const voiceId = this.configService.get<string>('ELEVENLABS_VOICE_ID');
      if (!voiceId) {
        throw new Error('ELEVENLABS_VOICE_ID environment variable is not set');
      }

      // Log the API key and voice ID for debugging (first few characters only)
      const apiKey = this.configService.get<string>('ELEVENLABS_API_KEY');
      const maskedApiKey = apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}` : 'not set';
      console.log(`Using ElevenLabs API key: ${maskedApiKey}`);
      console.log(`Using voice ID: ${voiceId}`);

      const audioStream = await this.client.generate({
        text,
        voice: voiceId,
        model_id: 'eleven_multilingual_v2',
      });

      const chunks: Buffer[] = [];
      for await (const chunk of audioStream) {
        chunks.push(Buffer.from(chunk));
      }

      const audioBuffer = Buffer.concat(chunks);
      
      // Save the audio buffer and get an ID
      const audioId = await this.audioStorageService.saveAudio(audioBuffer);
      return audioId;
    } catch (error) {
      console.error('Error generating audio:', error);
      return null;
    }
  }

  async getAudioById(id: string): Promise<Buffer | null> {
    return this.audioStorageService.getAudioById(id);
  }
} 