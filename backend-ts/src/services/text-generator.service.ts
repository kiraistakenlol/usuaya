import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { AnalysisData } from '../types/analysis-data.types';

@Injectable()
export class TextGeneratorService {
  private readonly anthropic: Anthropic;

  constructor(private configService: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  // --- NEW SYSTEM PROMPT requesting JSON --- START
  private readonly SYSTEM_PROMPT = `
You are a linguistic expert assistant specialized in Argentinian Spanish, English, and Russian. 
Your task is to generate a short, cohesive story or conversational text in Argentinian Spanish (using 'vos' conjugation, 
local slang where appropriate and natural). The text MUST incorporate the vocabulary words/phrases provided by the user.

Instead of plain text, you MUST format your entire response as a single, valid JSON object adhering strictly 
to the schema described below. Do not include any text outside the JSON structure.

JSON Schema:
{
  "generated_text": {
    "spanish_plain": "<Generated Spanish text as a single string>",
    "tokens": [
      {
        "text": "<Word/Punctuation>",
        "index": <integer, 0-based>,
        "lemma": "<Base form>",
        "pos": "<Part of Speech Tag (e.g., DET, NOUN, VERB, ADJ, ADV, ADP, CONJ, PRON, PUNCT)>",
        "english": "<Contextual English translation or null>",
        "russian": "<Contextual Russian translation or null>",
        "annotation_ids": ["<id_1>", "<id_2>"] // List of IDs linking to the \'annotations\' dictionary below, can be empty []
      }
      // ... more tokens
    ],
    "annotations": {
      "<unique_annotation_id>": {
        "type": "<Annotation type: \'slang\', \'idiom\', \'grammar\', \'cultural_note\', etc.>",
        "scope_indices": [<index1>, <index2>], // List of token indices this annotation covers
        "label": "<Short display label>",
        "explanation_spanish": "<Detailed explanation in Spanish>",
        "explanation_english": "<Detailed explanation in English>",
        "explanation_russian": "<Detailed explanation in Russian>"
      }
      // ... more annotations
    }
  },
  "english_translation_plain": "<Full English translation of the Spanish text>"
}

Instructions for Analysis:
1.  Tokenize the generated Spanish text meticulously, including punctuation.
2.  For each token, provide its exact text, index, lemma, and Part-of-Speech tag.
3.  Provide concise, context-aware English and Russian translations for each token where applicable.
4.  Identify and create annotations for:
    *   **Slang:** Any Argentinian slang or informal words/phrases.
    *   **Idioms:** Multi-word expressions whose meaning isn\'t literal.
    *   **Grammar Points:** Interesting or potentially confusing grammatical structures (e.g., specific tenses, pronoun usage like \'voseo\', subjunctive mood, complex sentence structures).
    *   **Cultural Notes:** References specific to Argentinian culture if relevant.
5.  Ensure each annotation has a unique ID, a clear type, the correct scope_indices covering the relevant tokens, a display label, and explanations in Spanish, English, and Russian.
6.  Link tokens to their relevant annotations using the annotation_ids field.
7.  Provide the full Spanish text as a single string in \`generated_text.spanish_plain\`.
8.  Provide the full English translation as a single string in \`english_translation_plain\`.
9.  Double-check that the final output is a single, valid JSON object with no extra text before or after.
10. IMPORTANT: Your entire response MUST start with { and end with } and contain ONLY the valid JSON object described above.
`;
  // --- NEW SYSTEM PROMPT requesting JSON --- END

  async generateText(vocabulary: string[]): Promise<{ spanishText: string; englishTranslation: string; analysisData: AnalysisData }> {
    const userPrompt = `Generate a text incorporating the following vocabulary: ${vocabulary.join(', ')}`;

    try {
      // --- Log the prompts --- START
      console.log('--- System Prompt Sent to Claude ---');
      console.log(this.SYSTEM_PROMPT);
      console.log('--- User Prompt Sent to Claude ---');
      console.log(userPrompt);
      console.log('-----------------------------------');
      // --- Log the prompts --- END

      const msg = await this.anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 10000,
        temperature: 0.7,
        system: this.SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      });

      // Assuming the entire response content is the JSON string
      // Safely access text content only if the first block is of type 'text'
      const firstContentBlock = msg.content[0];
      if (firstContentBlock?.type !== 'text') {
        console.error('First content block from Claude is not text:', firstContentBlock);
        throw new Error('Unexpected content block type received from Claude.');
      }
      const jsonResponseString = firstContentBlock.text;
      console.log('Claude Raw Response:', jsonResponseString);

      // Attempt to parse the JSON string
      let analysisData: AnalysisData;
      try {
          analysisData = JSON.parse(jsonResponseString) as AnalysisData;
      } catch (parseError) {
          console.error('Failed to parse Claude response as JSON:', parseError);
          console.error('Raw response was:', jsonResponseString);
          throw new Error('Failed to get valid JSON analysis from Claude.');
      }

      // Extract plain text parts from the parsed JSON
      const spanishText = analysisData?.generated_text?.spanish_plain;
      const englishTranslation = analysisData?.english_translation_plain;

      // Validate that we got the necessary text parts
      if (!spanishText || !englishTranslation) {
           console.error('Parsed JSON missing required text fields:', analysisData);
           throw new Error('Parsed analysis data is incomplete.');
      }

      return {
        spanishText,
        englishTranslation,
        analysisData,
      };

    } catch (error) {
      console.error('Error calling Anthropic API:', error);
      throw new Error('Failed to generate text analysis.');
    }
  }
} 