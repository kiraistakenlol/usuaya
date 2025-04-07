import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { IndexedWordSegment, AnalysisResult, WordTiming } from '../types/analysis-data.types';

@Injectable()
export class TextGeneratorService {
  private readonly anthropic: Anthropic;

  constructor(private configService: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  // --- Prompt for Call 1: Generate Spanish Text Only --- START
  private readonly SIMPLE_TEXT_PROMPT = `
You are an AI assistant helping a Russian person living in Argentina learn Spanish. They are fluent in English.
Generate a short, cohesive story or conversational text in Argentinian Spanish (using 'vos' conjugation, local slang where appropriate and natural). 
**Please keep the text short, around 2 sentences long, but try to include some interesting grammar or phrasing.**
The text MUST incorporate the vocabulary words/phrases provided by the user.
Output ONLY the generated Spanish text, with no other formatting, labels, or explanation.
`;
  // --- Prompt for Call 1: Generate Spanish Text Only --- END

  // --- Prompt for Call 2: Analyze Indexed Words --- START
  private readonly ANALYSIS_PROMPT = `
You are a linguistic expert assistant specialized in Argentinian Spanish, English, and Russian. Your task is to analyze a sequence of indexed Spanish word segments provided as a JSON array named "indexed_word_segments". For each segment, you must provide linguistic analysis and translations. You also need to generate a cohesive English paragraph translating the entire sequence.

Input Format: The user will provide a JSON object: { "indexed_word_segments": [ { "index": <number>, "word": "<string>", ...other keys ignored } ] }

Output JSON Schema:
{
  "analysis_by_index": {
    "<index_from_input_as_string>": {
      "original_word": "<The 'word' value from the corresponding input object>",
      "lemma": "<Base/dictionary form of the word>",
      "pos": "<Part of Speech Tag>",
      "english_word_translation": "<Contextual English translation of this specific word segment, or null>",
      "russian_word_translation": "<Contextual Russian translation of this specific word segment, or null>",
      "annotation_ids": ["<annotation_id_1>"]
    }
    // ... entry for every index provided in the input array
  },
  "annotations": {
    "<unique_annotation_id>": {
      "type": "<Annotation type: 'slang', 'idiom', 'grammar', etc.>",
      "scope_indices": [<input_index_1>, <input_index_2>],
      "label": "<Short display label>",
      "explanation_spanish": "<Detailed explanation in Spanish>",
      "explanation_english": "<Detailed explanation in English>",
      "explanation_russian": "<Detailed explanation in Russian>"
    }
    // ... more annotations
  },
  "english_translation_plain": "<Full, cohesive English paragraph translating the entire sequence>"
}

Instructions for Analysis:
1. Process EVERY object in the input "indexed_word_segments" array. Create a corresponding entry in "analysis_by_index" using the input object's "index" (as a string) as the key.
2. Within each "analysis_by_index" entry, provide the required fields ("original_word", "lemma", "pos", translations, "annotation_ids"). Analyze the segment including punctuation.
3. Infer context from the sequence for better analysis.
4. Identify annotations (slang, idioms, grammar, culture). Create entries in the top-level "annotations" dict.
5. The "scope_indices" in each annotation MUST contain the input "index" values of all relevant segments.
6. Populate the "annotation_ids" in "analysis_by_index" entries by linking to annotations that include the segment's input "index" in their "scope_indices".
7. Provide detailed explanations in each annotation.
8. Generate the overall English translation in "english_translation_plain".
9. Ensure the output is a single, valid JSON object starting with { and ending with }. Verify all input indices are keys in "analysis_by_index".
`;
  // --- Prompt for Call 2: Analyze Indexed Words --- END

  // --- Method for Call 1 --- START
  async generateSimpleText(vocabulary: string[]): Promise<string> {
    const userPrompt = `Generate a text incorporating the following vocabulary: ${vocabulary.join(', ')}`;
    console.log('--- Call 1 User Prompt ---', userPrompt);
    try {
      const msg = await this.anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219', // Or Haiku for speed
        max_tokens: 1000, // Lower max tokens needed for just text
        temperature: 0.7,
        system: this.SIMPLE_TEXT_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      });
      const spanishText = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : '';
      console.log('--- Call 1 Response (Spanish Text) ---', spanishText);
      if (!spanishText) {
        throw new Error('Claude Call 1 did not return Spanish text.');
      }
      return spanishText;
    } catch (error) {
      console.error('Error in Claude Call 1 (generateSimpleText):', error);
      throw new Error('Failed to generate initial Spanish text.');
    }
  }
  // --- Method for Call 1 --- END

  // --- Method for Call 2 --- START
  async analyzeIndexedWords(indexedWords: IndexedWordSegment[]): Promise<AnalysisResult> {
    // Prepare the input for Claude
    const claudeInput = { indexed_word_segments: indexedWords };
    const userPrompt = `Please analyze the following indexed Spanish word segments and provide the full English translation:

\`\`\`json
${JSON.stringify(claudeInput, null, 2)}
\`\`\`
`;

    console.log('--- Call 2 System Prompt ---');
    console.log(this.ANALYSIS_PROMPT);
    console.log('--- Call 2 User Prompt (Input Data) ---');
    console.log(userPrompt);
    console.log('---------------------------------------');

    try {
      const msg = await this.anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219', // Match model if needed, Opus might be better for analysis
        max_tokens: 10000, // Keep high for potentially large JSON analysis
        temperature: 0.7,
        system: this.ANALYSIS_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const firstContentBlock = msg.content[0];
      if (firstContentBlock?.type !== 'text') {
        throw new Error('Claude Call 2 did not return text content.');
      }
      const jsonResponseString = firstContentBlock.text;
      console.log('--- Call 2 Raw Response ---', jsonResponseString);

      // --- Clean the response string --- START
      let cleanedJsonResponseString = jsonResponseString.trim();
      if (cleanedJsonResponseString.startsWith('```json')) {
        cleanedJsonResponseString = cleanedJsonResponseString.substring(7); // Remove ```json
      }
      if (cleanedJsonResponseString.endsWith('```')) {
        cleanedJsonResponseString = cleanedJsonResponseString.substring(0, cleanedJsonResponseString.length - 3); // Remove ```
      }
      cleanedJsonResponseString = cleanedJsonResponseString.trim(); // Trim again just in case
      console.log('--- Cleaned Response String for Parsing ---', cleanedJsonResponseString);
      // --- Clean the response string --- END

      let analysisResult: AnalysisResult;
      try {
        // Parse the cleaned string
        analysisResult = JSON.parse(cleanedJsonResponseString) as AnalysisResult;
        console.log('--- Call 2 Parsed Result ---', JSON.stringify(analysisResult, null, 2));
      } catch (parseError) {
        console.error('Failed to parse Claude Call 2 response as JSON:', parseError);
        console.error('Raw response was:', jsonResponseString);
        throw new Error('Failed to get valid JSON analysis from Claude Call 2.');
      }
      
      // Basic validation (e.g., check if analysis_by_index exists)
      if (!analysisResult?.analysis_by_index) {
          console.error('Parsed analysis JSON missing required fields:', analysisResult);
          throw new Error('Parsed analysis data from Call 2 is incomplete.');
      }

      return analysisResult;

    } catch (error) {
      console.error('Error in Claude Call 2 (analyzeIndexedWords):', error);
      throw new Error('Failed to generate text analysis.');
    }
  }
  // --- Method for Call 2 --- END

  // Remove or comment out the old generateText method
  /*
  async generateText(...) { ... }
  */
} 