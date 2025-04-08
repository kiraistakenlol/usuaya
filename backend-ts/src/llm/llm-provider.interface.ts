export interface LlmResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Interface for LLM provider services.
 * Defines common methods for text generation and structured JSON generation.
 */
export abstract class LlmProvider {
  /**
   * Generates plain text based on a user prompt and an optional system prompt.
   * @param userPrompt The main user request.
   * @param systemPrompt Optional system instructions or persona.
   * @returns A promise resolving to the generated text content.
   */
  abstract generateText(userPrompt: string, systemPrompt?: string): Promise<string>;

  /**
   * Attempts to generate a response structured as JSON, based on prompts.
   * Note: Underlying model support for guaranteed JSON varies.
   * @param userPrompt The main user request, often including JSON examples/schema.
   * @param systemPrompt System instructions detailing the desired JSON structure.
   * @returns A promise resolving to an LlmResponse containing the JSON string and token usage.
   */
  abstract generateJsonResponse(userPrompt: string, systemPrompt?: string): Promise<LlmResponse>;
} 