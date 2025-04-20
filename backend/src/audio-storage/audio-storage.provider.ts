/**
 * Abstract class defining the interface for audio storage providers.
 */
export abstract class AudioStorageProvider {
  /**
   * Saves audio data and returns a unique identifier (key/filename) for retrieval.
   * @param audioBuffer The audio data to save.
   * @returns A promise resolving to the unique identifier.
   */
  abstract saveAudio(audioBuffer: Buffer): Promise<string>;

  /**
   * Retrieves audio data using its unique identifier.
   * @param id The unique identifier of the audio data.
   * @returns A promise resolving to the audio data buffer, or null if not found.
   */
  abstract getAudioById(id: string): Promise<Buffer | null>;

  // Optional: Add a delete method if needed later
  // abstract deleteAudioById(id: string): Promise<void>;
} 