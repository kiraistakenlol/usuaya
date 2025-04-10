import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage'; // For streamlined uploads
import { v4 as uuidv4 } from 'uuid';
import { AudioStorageProvider } from './audio-storage.provider';
import { Readable } from 'stream';

@Injectable()
export class S3AudioStorageProvider extends AudioStorageProvider implements OnModuleInit {
  private readonly logger = new Logger(S3AudioStorageProvider.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(private configService: ConfigService) {
    super();
    this.region = this.configService.getOrThrow<string>('AWS_S3_REGION');
    this.bucketName = this.configService.getOrThrow<string>('AWS_S3_AUDIO_BUCKET');
    
    // Credentials will be picked up automatically from env vars by the SDK
    // (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
    this.s3Client = new S3Client({
      region: this.region,
      // Optionally add endpoint override for S3-compatible services
    });

    this.logger.log(`S3 Provider initialized. Region: ${this.region}, Bucket: ${this.bucketName}`);
  }

  // Check bucket existence on module initialization
  async onModuleInit() {
      try {
          await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
          this.logger.log(`Successfully connected to S3 bucket: ${this.bucketName}`);
      } catch (error) {
          this.logger.error(`Failed to connect or find S3 bucket '${this.bucketName}' in region '${this.region}'. Please check configuration and bucket existence. Error: ${error.message}`);
          // Depending on requirements, you might want to throw to prevent startup
          // throw new Error(`S3 Bucket Connection Error: ${error.message}`); 
      }
  }

  async saveAudio(audioBuffer: Buffer): Promise<string> {
    const id = uuidv4();
    const key = `${id}.mp3`; // Object key in S3
    this.logger.log(`Uploading audio to S3. Bucket: ${this.bucketName}, Key: ${key}`);

    try {
      // Using lib-storage Upload for potentially large files / streams
      const parallelUploads3 = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: audioBuffer,
          ContentType: 'audio/mpeg', // Set appropriate content type
          // ACL: 'public-read', // Or manage permissions via bucket policy
        },
        // Optional: configure queue size and part size for large uploads
        // queueSize: 4, 
        // partSize: 1024 * 1024 * 5, // 5MB
      });

      await parallelUploads3.done();
      this.logger.log(`Successfully uploaded to S3: ${key}`);
      return id; // Return the ID part
    } catch (error) {
      this.logger.error(`Failed to upload audio to S3 (${key}): ${error.message}`);
      throw new Error(`S3 Upload Error: ${error.message}`);
    }
  }

  async getAudioById(id: string): Promise<Buffer | null> {
    const key = `${id}.mp3`;
    this.logger.debug(`Attempting to retrieve audio from S3: ${key}`);

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const response = await this.s3Client.send(command);

      if (!response.Body) {
         this.logger.warn(`S3 GetObject response for key ${key} has no body.`);
         return null;
      }

      // Convert readable stream to buffer
      const stream = response.Body as Readable;
      const audioBuffer = await this.streamToBuffer(stream);

      this.logger.debug(`Retrieved audio from S3: ${key}, size: ${audioBuffer.length} bytes`);
      return audioBuffer;
    } catch (error) {
        // Check specifically for NotFound error
        if (error.name === 'NoSuchKey') {
            this.logger.warn(`Audio not found in S3: ${key}`);
            return null;
        } else {
            this.logger.error(`Failed to retrieve audio from S3 (${key}): ${error.name} - ${error.message}`);
            // Rethrow other errors
            throw new Error(`S3 Download Error: ${error.message}`);
        }
    }
  }

  // Helper to convert stream to buffer (could be moved to a utility)
  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
} 