import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { LlmProvider, LlmResponse } from './llm-provider.interface';

@Injectable()
export class GrokProvider extends LlmProvider {
  private readonly logger = new Logger(GrokProvider.name);
  private readonly openai: OpenAI;
  private readonly modelName: string;

  constructor(private configService: ConfigService) {
    super();
    const apiKey = this.configService.get<string>('GROK_API_KEY');
    const model = this.configService.get<string>('GROK_MODEL_NAME');
    const baseURL = this.configService.get<string>('GROK_API_BASE_URL', 'https://api.x.ai/v1');
    if (!apiKey) {
      throw new Error('GROK_API_KEY is not configured.');
    }
    if (!model) {
      throw new Error('GROK_MODEL_NAME is not configured.');
    }
    this.modelName = model;
    
    this.openai = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
    });
    this.logger.log(`GrokProvider initialized. Model: ${this.modelName}, BaseURL: ${baseURL}`);
  }

  async generateText(userPrompt: string, systemPrompt?: string): Promise<string> {
    this.logger.log('Generating text with Grok...');
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: userPrompt });

      const response = await this.openai.chat.completions.create({
        model: this.modelName,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      });
      
      const content = response.choices[0]?.message?.content?.trim() || '';
      const usage = response.usage; // Optional: log usage if needed
      this.logger.log(`Grok text generation successful. Tokens: In=${usage?.prompt_tokens}, Out=${usage?.completion_tokens}`);
      return content;
    } catch (error) {
      this.logger.error('Error generating text with Grok:', error);
      throw new Error(`Grok API error: ${error.message}`);
    }
  }

  async generateJsonResponse(userPrompt: string, systemPrompt?: string): Promise<LlmResponse> {
    this.logger.log('Generating JSON response with Grok...');
    const startTime = Date.now();
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: userPrompt });

      const response = await this.openai.chat.completions.create({
        model: this.modelName,
        messages: messages,
        max_tokens: 10000, // Check Grok limits if necessary
        temperature: 0.5, // Lower temp for JSON
        // Optional: Some OpenAI-compatible APIs support response_format for JSON
        // response_format: { type: "json_object" }, 
      });
      const endTime = Date.now();

      const content = response.choices[0]?.message?.content || '';
      const usage = response.usage;
      const inputTokens = usage?.prompt_tokens ?? 0;
      const outputTokens = usage?.completion_tokens ?? 0;
      const durationMs = endTime - startTime;
      this.logger.log(`Grok JSON generation successful. Duration: ${durationMs} ms, Tokens: In=${inputTokens}, Out=${outputTokens}`);

      // Basic cleaning (same as Anthropic for now)
      let cleanedJson = content.trim();
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
      this.logger.error('Error generating JSON response with Grok:', error);
      throw new Error(`Grok API error during JSON generation: ${error.message}`);
    }
  }
} 