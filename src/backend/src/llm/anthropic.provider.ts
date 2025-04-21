import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { LlmProvider, LlmResponse } from './llm-provider.interface';

@Injectable()
export class AnthropicProvider extends LlmProvider {
  private readonly logger = new Logger(AnthropicProvider.name);
  private readonly anthropic: Anthropic;
  private readonly modelName: string;

  constructor(private configService: ConfigService) {
    super(); // Call base constructor if LlmProvider is abstract class
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured.');
    }
    this.anthropic = new Anthropic({ apiKey });
    // Consider making the model configurable as well
    this.modelName = 'claude-3-7-sonnet-20250219'; 
    this.logger.log(`AnthropicProvider initialized with model: ${this.modelName}`);
  }

  async generateText(userPrompt: string, systemPrompt?: string): Promise<string> {
    this.logger.log('Generating text with Anthropic...');
    try {
      const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userPrompt }];
      const msg = await this.anthropic.messages.create({
        model: this.modelName,
        max_tokens: 1000, // Adjust as needed
        temperature: 0.7,
        system: systemPrompt, 
        messages: messages,
      });

      const content = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : '';
      this.logger.log(`Anthropic text generation successful. Tokens: In=${msg.usage.input_tokens}, Out=${msg.usage.output_tokens}`);
      return content;
    } catch (error) {
      this.logger.error('Error generating text with Anthropic:', error);
      // Consider re-throwing a custom error or handling retry logic here
      throw new Error(`Anthropic API error: ${error.message}`); 
    }
  }

  async generateJsonResponse(userPrompt: string, systemPrompt?: string): Promise<LlmResponse> {
    this.logger.log('Generating JSON response with Anthropic...');
    const startTime = Date.now(); 
    try {
      const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userPrompt }];
      const msg = await this.anthropic.messages.create({
        model: this.modelName, 
        max_tokens: 10000, // Allow ample tokens for complex JSON
        temperature: 0.5, // Lower temp might help structure
        system: systemPrompt,
        messages: messages,
      });
      const endTime = Date.now();

      const inputTokens = msg.usage.input_tokens;
      const outputTokens = msg.usage.output_tokens;
      const durationMs = endTime - startTime;
      this.logger.log(`Anthropic JSON generation successful. Duration: ${durationMs} ms, Tokens: In=${inputTokens}, Out=${outputTokens}`);

      const firstContentBlock = msg.content[0];
      if (firstContentBlock?.type !== 'text') {
        throw new Error('Anthropic did not return text content for JSON response.');
      }
      const jsonResponseString = firstContentBlock.text;
      
      // Basic cleaning (can be enhanced)
      let cleanedJson = jsonResponseString.trim();
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.substring(7);
      }
      if (cleanedJson.endsWith('```')) {
        cleanedJson = cleanedJson.substring(0, cleanedJson.length - 3);
      }
      cleanedJson = cleanedJson.trim();

      return {
        content: cleanedJson,
        inputTokens: inputTokens,
        outputTokens: outputTokens,
      };
    } catch (error) {
      this.logger.error('Error generating JSON response with Anthropic:', error);
      throw new Error(`Anthropic API error during JSON generation: ${error.message}`);
    }
  }
} 