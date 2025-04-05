import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class TextGeneratorService {
  private client: Anthropic;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    this.client = new Anthropic({ apiKey });
  }

  private readonly SYSTEM_PROMPT = `
You are an AI assistant helping a Russian person living in Argentina learn Spanish. They are fluent in English.
Generate a short, cohesive story or conversational text in Argentinian Spanish (using 'vos' conjugation, local slang where appropriate and natural). 
The text MUST incorporate the vocabulary words/phrases provided by the user.
After the Spanish text, provide an English translation of the generated Spanish text.

Format the output strictly as follows:

[SPANISH TEXT]
{Generated Spanish text here}

[ENGLISH TRANSLATION]
{English translation here}

[VOCABULARY USAGE]
{List each vocabulary word/phrase and how it was used in the text}
`;

  async generateText(vocabulary: string[]): Promise<{
    spanishText: string;
    englishTranslation: string;
    vocabularyUsage: string;
  }> {
    try {
      const vocabStr = vocabulary.map(word => `- ${word}`).join('\n');
      const userPrompt = `Please generate a text using these vocabulary words/phrases:\n\n${vocabStr}\n\nRemember to use Argentinian Spanish with 'vos' conjugation and local expressions where appropriate.`;

      const message = await this.client.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        temperature: 0.7,
        system: this.SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const response = message.content[0].type === 'text' ? message.content[0].text : '';
      let spanishText = '';
      let englishTranslation = '';
      let vocabularyUsage = '';

      let currentSection: string | null = null;
      for (const line of response.split('\n')) {
        if (line.includes('[SPANISH TEXT]')) {
          currentSection = 'spanish';
          continue;
        } else if (line.includes('[ENGLISH TRANSLATION]')) {
          currentSection = 'english';
          continue;
        } else if (line.includes('[VOCABULARY USAGE]')) {
          currentSection = 'vocabulary';
          continue;
        }

        if (currentSection === 'spanish') {
          spanishText += line + '\n';
        } else if (currentSection === 'english') {
          englishTranslation += line + '\n';
        } else if (currentSection === 'vocabulary') {
          vocabularyUsage += line + '\n';
        }
      }

      return {
        spanishText: spanishText.trim(),
        englishTranslation: englishTranslation.trim(),
        vocabularyUsage: vocabularyUsage.trim(),
      };
    } catch (error) {
      console.error('Error generating text:', error);
      throw error;
    }
  }
} 