import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider } from '../llm/llm-provider.interface';
import { IndexedWordSegment, AnalysisResult, TextAnalysisData, EnglishData } from '../types/analysis-data.types';
import { WordTiming } from '../types/analysis-data.types';

@Injectable()
export class TextGeneratorService {
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
**Please keep the text short, around 2 sentences long, but try to include some interesting grammar or phrasing.**
The text MUST incorporate the vocabulary words/phrases provided by the user.
Output ONLY the generated Spanish text, with no other formatting, labels, or explanation.
`;
  // --- Prompt for Call 1: Generate Spanish Text Only --- END

  // --- Prompt for Call 2: Analyze Indexed Words --- START
  private readonly ANALYSIS_PROMPT = `
You are a linguistic expert assistant specialized in Argentinian Spanish and English.
Your task is to analyze a sequence of indexed Spanish word segments provided as a JSON array named "indexed_word_segments". 
For each segment, you must provide linguistic analysis (lemma, POS, contextual English translation). 
You also need to identify relevant annotations (slang, grammar, idioms, complex tenses use). 

Critically, you must also provide a TOKENIZED English translation of the entire sequence (as an array of token objects) 
and an ALIGNMENT map linking each Spanish word index to the array indices of its corresponding English token(s).

Input Format: The user will provide a JSON object: 
{ 
  "indexed_word_segments": [ { "index": <number>, "word": "<string>" } ], // Note: This text was generated based on the vocabulary below.
  "vocabulary": [ { "id": "<unique_vocab_id>", "word": "<string>" } ]
}

Output JSON Schema:
{
  "analysis_by_index": {
    "<input_index_as_string>": {
      "original_word": "<Input 'word'>",
      "lemma": "<Base/dictionary form>",
      "pos": "<Part of Speech (Coarse-grained, e.g., NOUN, VERB)>",
      "english_word_translation": "<Contextual English translation or null>",
      "vocabulary_id": "<matching_vocab_id_from_input | null>"
    }
    // ... entry for EVERY index provided in the input array
  },
  "annotations": {
    "<unique_annotation_id>": {
      "type": "<Annotation type: 'slang', 'idiom', 'grammar', etc.>",
      "scope_indices": [<input_index_1>, <input_index_2>], // Spanish indices this covers (REQUIRED)
      "label": "<Short display label>",
      "explanation_spanish": "<Detailed explanation in Spanish>",
      "explanation_english": "<Detailed explanation in English>"
    }
    // ... more annotations if applicable
  },
  "english_data": {
    "tokens": [
      { "text": "<English word/punctuation>" }
      // ... entry for every token in the English translation
    ],
    "spanish_index_to_english_indices": {
      "<input_index_as_string>": [0, 1]
      // Map Spanish input index (string) to array of corresponding english_data.tokens.index_eng values
      // EVERY Spanish input index MUST be a key here. Value can be [] if no direct alignment.
    }
  }
}

Instructions:
1.  Analyze EVERY Spanish segment from "indexed_word_segments". 
    Create a corresponding entry in 'analysis_by_index' keyed by the segment's "index" (as a string). Provide all required fields.
2.  Determine the 'vocabulary_id' for each entry in 'analysis_by_index'.
    The the entry in 'analysis_by_index' relates to any entry in 'vocabulary', assign corresponding 'vocabulary_id' property.
    The goal is to be able to find entries that represent the use of 'vocabulary' in 'analysis_by_index'. 
3.  Identify annotations (slang, idioms, grammar). Create entries in "annotations". Ensure "scope_indices" uses the Spanish input indices.
4.  Generate the full English translation.
5.  TOKENIZE the English translation accurately (including punctuation). Create an object containing only the "text" field for each token and place these objects in an array in "english_data.tokens".
6.  Create the ALIGNMENT map in "english_data.spanish_index_to_english_indices". For each Spanish input index (as a string key), provide an array of the 0-based **array indices** from the "english_data.tokens" array that correspond to it. If a Spanish word has no direct English equivalent, use an empty array \'[]\' for its alignment.
7.  Ensure the output is a single, valid JSON object. Double-check that all Spanish input indices are keys in BOTH "analysis_by_index" AND "english_data.spanish_index_to_english_indices".
8.  Provide the fine-grained POS tag ('tag') for each word in 'analysis_by_index'.
`;
  // --- Prompt for Call 2: Analyze Indexed Words --- END

  // --- Method for Call 1 --- START
  async generateSimpleText(vocabulary: string[]): Promise<string> {
    const userPrompt = `Generate a text incorporating the following vocabulary: ${vocabulary.join(', ')}`;
    this.logger.log('--- Calling LlmProvider.generateText ---');
    console.log('User Prompt:', userPrompt);
    console.log('System Prompt:', this.SIMPLE_TEXT_PROMPT);
    try {
      const spanishText = await this.llmProvider.generateText(userPrompt, this.SIMPLE_TEXT_PROMPT);
      
      console.log('--- LlmProvider.generateText Response ---', spanishText);
      if (!spanishText) {
        throw new Error('LLM Call 1 did not return Spanish text.');
      }
      return spanishText;
    } catch (error) {
      this.logger.error('Error in generateSimpleText:', error);
      throw new Error(`Failed to generate initial Spanish text using ${this.llmProvider.constructor.name}.`);
    }
  }
  // --- Method for Call 1 --- END

  // --- Method for Call 2 --- START
  async analyzeIndexedWords(indexedWords: IndexedWordSegment[], vocabulary: { id: string; word: string; }[]): Promise<TextAnalysisData> {
    // Prepare the input for the LLM
    const llmInput = { 
      indexed_word_segments: indexedWords,
      vocabulary: vocabulary
    };
    // User prompt remains the same structure, asking for analysis based on the input data
    const userPrompt = `Please analyze the following indexed Spanish word segments, considering the provided vocabulary, and provide the full English translation and analysis according to the specified JSON schema:

\`\`\`json
${JSON.stringify(llmInput, null, 2)}
\`\`\`
`;

    this.logger.log('--- Calling LlmProvider.generateJsonResponse ---');
    // Log prompts if needed for debugging (can be verbose)
    // console.log('System Prompt:', this.ANALYSIS_PROMPT);
    // console.log('User Prompt (Input Data):', userPrompt);

    try {
      // Use the injected provider
      const llmResponse = await this.llmProvider.generateJsonResponse(userPrompt, this.ANALYSIS_PROMPT);

      this.logger.log('--- LlmProvider.generateJsonResponse Raw Content ---', llmResponse.content); // Log raw content before parsing
      
      // JSON Parsing (Cleaning is now handled within providers, but parsing happens here)
      let parsedData: any; 
      try {
        parsedData = JSON.parse(llmResponse.content); 
        // console.log('--- Parsed Result (Raw) ---', JSON.stringify(parsedData, null, 2)); // Optional deep log
      } catch (parseError) {
        this.logger.error('Failed to parse LLM Call 2 response as JSON:', parseError);
        this.logger.error('Raw response was:', llmResponse.content); 
        throw new Error('Failed to get valid JSON analysis from LLM Call 2.');
      }
      
      // --- Validation and Type Casting (Remains the same) --- START
      if (!parsedData?.analysis_by_index || !parsedData?.english_data?.tokens || !parsedData?.english_data?.spanish_index_to_english_indices) {
          this.logger.error('Parsed analysis JSON missing required fields:', parsedData);
          throw new Error('Parsed analysis data from Call 2 is incomplete.');
      }
      
      const analysisResult: AnalysisResult = {
          analysis_by_index: parsedData.analysis_by_index,
          annotations: parsedData.annotations || {} 
      };
      
      const englishData: EnglishData = {
          tokens: parsedData.english_data.tokens,
          spanish_index_to_english_indices: parsedData.english_data.spanish_index_to_english_indices
      };
      
      const fullAnalysisData: Partial<TextAnalysisData> = {
          analysis_result: analysisResult,
          english_data: englishData
      };
      
      return fullAnalysisData as TextAnalysisData;
      // --- Validation and Type Casting --- END

    } catch (error) {
      this.logger.error(`Error in analyzeIndexedWords using ${this.llmProvider.constructor.name}:`, error);
      throw new Error('Failed to generate text analysis.');
    }
  }
  // --- Method for Call 2 --- END

  // Remove or comment out the old generateText method
  /*
  async generateText(...) { ... }
  */
} 