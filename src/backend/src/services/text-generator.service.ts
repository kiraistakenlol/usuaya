import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider } from '../llm/llm-provider.interface';
import { TextAnalysis, WordItemAnalysisLLMRequest, WordTiming } from '@usuaya/shared-types';

export interface TextGeneratorService {
  generateSimpleText(vocabulary: string[]): Promise<{ text: string, promptUsed: string }>;
  analyzeIndexedWords(
    rawWordTimings: WordTiming[],
    vocabulary: string[]
  ): Promise<{ parsedData: TextAnalysis; rawResponse: string; llmInput: object }>;
}

export interface VocabularyItem {
  id: number;
  text: string;
}

@Injectable()
export class TextGeneratorService implements TextGeneratorService {
  private readonly logger = new Logger(TextGeneratorService.name);

  constructor(
    private configService: ConfigService,
    private llmProvider: LlmProvider
  ) {
    this.logger.log(`TextGeneratorService initialized with provider: ${llmProvider.constructor.name}`);
  }

  // --- Prompt for Call 1: Generate Spanish Text Only --- START
  private readonly SIMPLE_TEXT_PROMPT = `
You are an AI assistant helping a Russian person living in Argentina learn Spanish. They are fluent in English.
Generate a short, cohesive story or conversational text in Argentinian Spanish (using 'vos' conjugation, local slang where appropriate and natural). 
The text MUST incorporate the vocabulary words/phrases provided by the user.
Output ONLY the generated Spanish text, with no other formatting, labels, or explanation.
`;
  // --- Prompt for Call 1: Generate Spanish Text Only --- END

  // --- Prompt for Call 2: Analyze Indexed Words --- START
  private readonly ANALYSIS_PROMPT = `
You are an AI assistant specialized in aligning Spanish and English text and identifying vocabulary usage.
Your task is to analyze a sequence of indexed Spanish word segments ("indexed_word_segments") based on provided vocabulary ("vocabulary").
You MUST provide the analysis in the **JSON format** specified below, focusing ONLY on original words, vocabulary matching, English tokenization, and alignment.

Input Format: The user will provide a JSON object:
{
  "indexed_word_segments": [ { "index": <number>, "word": "<string>" } ], // Note: This text was generated based on the vocabulary below.
  "vocabulary": [ { "id": "<unique_vocab_id>", "text": "<string>" } ]
}

Output JSON Schema (Simplified):
{
  "indexed_spanish_words": {
    // Key: Spanish word index AS A STRING (e.g., "0", "1", ...)
    "<input_index_as_string>": {
      "text": "<Input 'word'>",                 // The Spanish word from the input segment
      "vocabulary_id": "<matching_vocab_id | null>"    // ID if it matches input vocab, else null
    }
    // ... entry for EVERY index provided in the input array
  },
  "indexed_english_translation_words": [
    // Simple array of English token strings (words & punctuation)
    "<English word/punctuation>",
     ...
  ],
  "alignment_spanish_to_english": {
    // Key: Spanish word index AS A STRING (e.g., "0", "1", ...)
    "<input_index_as_string>": [<eng_token_idx_1>, <eng_token_idx_2>] // Array of 0-based indices from indexed_english_translation_words array
    // ... entry for EVERY Spanish word index. Value can be [] if no direct alignment.
  }
}

Instructions:
1.  Create the "indexed_spanish_words" object. For EVERY Spanish segment from "indexed_word_segments", create a corresponding entry keyed by the segment's "index" (as a string). Include ONLY the "text" (original word) and "vocabulary_id" fields.
2.  Find the use of items in the 'vocabulary' input within the generated Spanish text. Assign the matched vocabulary item's 'id' to the 'vocabulary_id' field for all corresponding 'indexed_spanish_words' entries. Assign 'null' if no match. Handle multi-word vocabulary items.
3.  Generate the full English translation and TOKENIZE it accurately (including punctuation) into the "indexed_english_translation_words" array (simple array of strings).
4.  Create the "alignment_spanish_to_english" object. For EACH Spanish input index (as a string key), provide an array of the 0-based array indices from the "indexed_english_translation_words" array that correspond to it. Use an empty array '[]' for alignment if a Spanish word has no direct English equivalent. Ensure ALL Spanish input indices are keys in this object.
5.  Ensure the ENTIRE output is a single, valid JSON object adhering strictly to the specified schema using exactly the specified key names. Do NOT include any other fields, explanations, or markers like \`\`\`json.
`;
  // --- Prompt for Call 2: Analyze Indexed Words --- END

  // --- Method for Call 1 --- START
  // Update to return text and the prompt used
  async generateSimpleText(vocabulary: string[]): Promise<{ text: string; promptUsed: string; }> {
    const userPrompt = `Generate a text incorporating the following vocabulary: ${vocabulary.join(', ')}`;
    const systemPrompt = this.SIMPLE_TEXT_PROMPT; // Capture the system prompt
    this.logger.log('--- Calling LlmProvider.generateText --- ');
    try {
      // Get only the text content from the provider
      const spanishText = await this.llmProvider.generateText(userPrompt, systemPrompt);
      
      if (!spanishText) {
        throw new Error('LLM Call 1 did not return Spanish text.');
      }
      // Return both the text and the full prompt context used
      return {
        text: spanishText,
        promptUsed: systemPrompt + '\n\nUSER INPUT: ' + userPrompt
      };
    } catch (error) {
      this.logger.error('Error in generateSimpleText:', error);
      throw new Error(`Failed to generate initial Spanish text using ${this.llmProvider.constructor.name}.`);
    }
  }
  // --- Method for Call 1 --- END

  // --- Method for Call 2 --- START
  // Expects FINAL AGREED SIMPLIFIED JSON from LLM and returns the corresponding SIMPLIFIED TextAnalysis structure
  async analyzeIndexedWords(
    rawWordTimings: WordTiming[],
    vocabulary: string[]
  ): Promise<{ parsedData: TextAnalysis; rawResponse: string; llmInput: object; }> {

    // Perform indexing here
    if (!rawWordTimings) {
        // This case should ideally be prevented by the caller (TextService)
        this.logger.error('Raw word timings are missing for analysis.');
        throw new Error('Raw word timings are missing.');
    }
    const indexedWordSegments: WordItemAnalysisLLMRequest[] = rawWordTimings
        .map((timing: WordTiming, index: number) => ({
            word: timing.word,
            index: index
        } as WordItemAnalysisLLMRequest));
    this.logger.log(`Prepared ${indexedWordSegments.length} Indexed Timings from raw word timings.`);

    // Prepare structured vocabulary
    const indexedVocabulary: VocabularyItem[] = vocabulary.map((word: string, index: number) => ({
      id: index,
      text: word
  } as VocabularyItem));
  
    // Prepare the input for the LLM using the newly indexed segments
    const llmInput = { 
      indexed_word_segments: indexedWordSegments,
      vocabulary: indexedVocabulary
    };
    // User prompt remains the same structure, asking for analysis based on the input data
    const userPrompt = `Analyze the following indexed Spanish word segments, considering the provided vocabulary, 
    and provide the full English translation and analysis according to the specified JSON schema:

\`\`\`json
${JSON.stringify(llmInput, null, 2)}
\`\`\`
`;

    this.logger.log('--- Calling LlmProvider.generateJsonResponse (expecting FINAL simplified structure) --- ');
    this.logger.debug('Vocabulary being sent:', JSON.stringify(llmInput.vocabulary, null, 2));

    try {
      const llmResponse = await this.llmProvider.generateJsonResponse(userPrompt, this.ANALYSIS_PROMPT);
      const rawContent = llmResponse.content;

      let parsedLlmData: any;
      try {
        // Parse the expected FINAL SIMPLIFIED JSON
        const jsonMatch = rawContent.match(/\{.*\}|\[.*\]/s);
        if (!jsonMatch || jsonMatch.length === 0) { throw new Error('No JSON structure found in response.'); }
        const potentialJson = jsonMatch[0];
        parsedLlmData = JSON.parse(potentialJson);
      } catch (parseError) {
        this.logger.error('Failed to parse FINAL SIMPLIFIED JSON from LLM Call 2 response:', parseError);
        this.logger.error('Original Raw response was:', rawContent);
        throw new Error('Failed to parse valid FINAL SIMPLIFIED JSON analysis from LLM Call 2.');
      }

      // --- VALIDATE and MAP Final Simplified JSON to TextAnalysis --- START
      if (!parsedLlmData?.indexed_spanish_words ||
          !Array.isArray(parsedLlmData?.indexed_english_translation_words) ||
          !parsedLlmData?.alignment_spanish_to_english) {
          this.logger.error('Final Simplified JSON response missing required top-level fields:', parsedLlmData);
          throw new Error('Final Simplified JSON response from LLM Call 2 is incomplete.');
      }

      const simplifiedParsedData: Partial<TextAnalysis> = {
          indexed_spanish_words: parsedLlmData.indexed_spanish_words,
          indexed_english_translation_words: parsedLlmData.indexed_english_translation_words,
          alignment_spanish_to_english: parsedLlmData.alignment_spanish_to_english
      };
      // --- VALIDATE and MAP Final Simplified JSON to TextAnalysis --- END

      return {
        parsedData: simplifiedParsedData as TextAnalysis,
        rawResponse: rawContent,
        llmInput
      };

    } catch (error) {
      this.logger.error(`Error in analyzeIndexedWords (Final Simplified) using ${this.llmProvider.constructor.name}:`, error);
      throw new Error('Failed to generate final simplified text analysis.');
    }
  }
  // --- Method for Call 2 --- END
} 