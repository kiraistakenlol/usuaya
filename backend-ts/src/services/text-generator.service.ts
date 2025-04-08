import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { IndexedWordSegment, AnalysisResult, TextAnalysisData, EnglishData } from '../types/analysis-data.types';
import { WordTiming } from '../types/analysis-data.types';

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
You are a linguistic expert assistant specialized in Argentinian Spanish and English. Your task is to analyze a sequence of indexed Spanish word segments provided as a JSON array named "indexed_word_segments". For each segment, you must provide linguistic analysis (lemma, POS, contextual English translation). You also need to identify relevant annotations (slang, grammar, idioms). 

Critically, you must also provide a TOKENIZED English translation of the entire sequence (as an array of token objects) and an ALIGNMENT map linking each Spanish word index to the array indices of its corresponding English token(s).

Input Format: The user will provide a JSON object: 
{ "indexed_word_segments": [ { "index": <number>, "word": "<string>" } ] }

Output JSON Schema:
{
  "analysis_by_index": {
    "<input_index_as_string>": {
      "original_word": "<Input 'word'>",
      "lemma": "<Base/dictionary form>",
      "pos": "<Part of Speech>",
      "english_word_translation": "<Contextual English translation or null>",
      "annotation_ids": ["<annotation_id_1>"]
    }
    // ... entry for EVERY index provided in the input array
  },
  "annotations": {
    "<unique_annotation_id>": {
      "type": "<Annotation type: 'slang', 'idiom', 'grammar', etc.>",
      "scope_indices": [<input_index_1>, <input_index_2>], // Spanish indices this covers
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
1.  Analyze EVERY Spanish segment from "indexed_word_segments". Create a corresponding entry in "analysis_by_index" keyed by the segment's "index" (as a string). Provide all required fields.
2.  Identify annotations (slang, idioms, grammar). Create entries in "annotations". Ensure "scope_indices" uses the Spanish input indices.
3.  Populate "annotation_ids" in "analysis_by_index" entries to link them to relevant "annotations".
4.  Generate the full English translation.
5.  TOKENIZE the English translation accurately (including punctuation). Create an object containing only the "text" field for each token and place these objects in an array in "english_data.tokens".
6.  Create the ALIGNMENT map in "english_data.spanish_index_to_english_indices". For each Spanish input index (as a string key), provide an array of the 0-based **array indices** from the "english_data.tokens" array that correspond to it. If a Spanish word has no direct English equivalent, use an empty array \`[]\` for its alignment.
7.  Ensure the output is a single, valid JSON object. Double-check that all Spanish input indices are keys in BOTH "analysis_by_index" AND "english_data.spanish_index_to_english_indices".
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
  async analyzeIndexedWords(indexedWords: IndexedWordSegment[]): Promise<TextAnalysisData> {
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

      let parsedData: any; // Use 'any' temporarily for parsing
      try {
        // Parse the cleaned string
        parsedData = JSON.parse(cleanedJsonResponseString);
        console.log('--- Call 2 Parsed Result (Raw) ---', JSON.stringify(parsedData, null, 2));
      } catch (parseError) {
        console.error('Failed to parse Claude Call 2 response as JSON:', parseError);
        console.error('Raw response was:', jsonResponseString);
        throw new Error('Failed to get valid JSON analysis from Claude Call 2.');
      }
      
      // --- Validation and Type Casting --- START
      if (!parsedData?.analysis_by_index || !parsedData?.english_data?.tokens || !parsedData?.english_data?.spanish_index_to_english_indices) {
          console.error('Parsed analysis JSON missing required fields (analysis_by_index or english_data parts):', parsedData);
          throw new Error('Parsed analysis data from Call 2 is incomplete.');
      }
      
      // Construct the AnalysisResult part
      const analysisResult: AnalysisResult = {
          analysis_by_index: parsedData.analysis_by_index,
          annotations: parsedData.annotations || {} // Ensure annotations object exists, even if empty
      };
      
      // Construct the EnglishData part
      const englishData: EnglishData = {
          tokens: parsedData.english_data.tokens,
          spanish_index_to_english_indices: parsedData.english_data.spanish_index_to_english_indices
      };
      
      // Construct the final TextAnalysisData (excluding fields added by TextService)
      const fullAnalysisData: Partial<TextAnalysisData> = {
          analysis_result: analysisResult,
          english_data: englishData
      };
      
      // Return the combined structure expected by TextService (it will add spanish_plain and word_timings)
      // We cast here because the method signature now returns TextAnalysisData
      return fullAnalysisData as TextAnalysisData;
      // --- Validation and Type Casting --- END

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