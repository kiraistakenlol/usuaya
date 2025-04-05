import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElevenLabsClient } from 'elevenlabs';
import { Readable } from 'stream';

@Injectable()
export class AudioGeneratorService {
  private client: ElevenLabsClient;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ELEVENLABS_API_KEY');
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY environment variable is not set');
    }
    this.client = new ElevenLabsClient({ apiKey });
  }

  async generateAudio(text: string): Promise<Buffer | null> {
    try {
      if (!text) {
        throw new Error('Text is required for audio generation');
      }

      const voiceId = this.configService.get<string>('ELEVENLABS_VOICE_ID');
      if (!voiceId) {
        throw new Error('ELEVENLABS_VOICE_ID environment variable is not set');
      }

      const audioStream = await this.client.generate({
        text,
        voice: voiceId,
        model_id: 'eleven_multilingual_v2',
      });

      const chunks: Buffer[] = [];
      for await (const chunk of audioStream) {
        chunks.push(Buffer.from(chunk));
      }

      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Error generating audio:', error);
      return null;
    }
  }
} 