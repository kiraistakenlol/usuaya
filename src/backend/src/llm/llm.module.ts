import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LlmProvider } from './llm-provider.interface';
import { AnthropicProvider } from './anthropic.provider';
import { GrokProvider } from './grok.provider';

@Global() // Make the exported provider available application-wide
@Module({
  imports: [ConfigModule], // Needs ConfigService to determine provider
  providers: [
    {
      provide: LlmProvider, // Provide the abstract class/token
      useFactory: (configService: ConfigService): LlmProvider => {
        const providerType = configService.get<string>('LLM_PROVIDER', 'anthropic').toLowerCase();
        if (providerType === 'grok') {
          return new GrokProvider(configService);
        } else if (providerType === 'anthropic') {
          return new AnthropicProvider(configService);
        } else {
           // Default to Anthropic if config is missing or invalid
          console.warn(`Invalid LLM_PROVIDER specified: ${providerType}. Defaulting to anthropic.`);
          return new AnthropicProvider(configService);
        }
      },
      inject: [ConfigService], // Inject ConfigService into the factory
    },
    // Optionally, explicitly provide concrete classes if needed elsewhere, but factory is key
    AnthropicProvider,
    GrokProvider,
  ],
  exports: [LlmProvider], // Export the abstract class token so other modules can inject it
})
export class LlmModule {} 