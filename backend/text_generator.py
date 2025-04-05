import anthropic
import os
from typing import List, Tuple
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get API key from environment variable
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY environment variable is not set")

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

SYSTEM_PROMPT = """
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
"""

def generate_text_and_audio(vocabulary: List[str]) -> Tuple[str, str, str]:
    """
    Generate Spanish text incorporating given vocabulary words, along with English translation.
    
    Args:
        vocabulary (List[str]): List of vocabulary words/phrases to include in the text
    
    Returns:
        Tuple[str, str, str]: Spanish text, English translation, and vocabulary usage explanation
    """
    try:
        # Format vocabulary list for prompt
        vocab_str = "\n".join([f"- {word}" for word in vocabulary])
        
        # Construct the prompt
        user_prompt = f"""Please generate a text using these vocabulary words/phrases:

{vocab_str}

Remember to use Argentinian Spanish with 'vos' conjugation and local expressions where appropriate."""

        # Generate text using Claude
        message = client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=1000,
            temperature=0.7,
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": user_prompt
                }
            ]
        )

        # Extract response content
        response = message.content[0].text

        # Parse the response
        spanish_text = ""
        english_translation = ""
        vocabulary_usage = ""
        
        current_section = None
        for line in response.split('\n'):
            if '[SPANISH TEXT]' in line:
                current_section = 'spanish'
                continue
            elif '[ENGLISH TRANSLATION]' in line:
                current_section = 'english'
                continue
            elif '[VOCABULARY USAGE]' in line:
                current_section = 'vocabulary'
                continue
                
            if current_section == 'spanish':
                spanish_text += line + '\n'
            elif current_section == 'english':
                english_translation += line + '\n'
            elif current_section == 'vocabulary':
                vocabulary_usage += line + '\n'
        
        return spanish_text.strip(), english_translation.strip(), vocabulary_usage.strip()

    except Exception as e:
        print(f"Error generating text: {str(e)}")
        return "", "", ""

# Example usage (for testing)
if __name__ == '__main__':
    test_vocab = ["mate", "asado", "che", "facturas"]
    print("Testing Claude integration...")
    spanish, english, usage = generate_text_and_audio(test_vocab)
    print("--- Spanish ---")
    print(spanish)
    print("\n--- English ---")
    print(english)
    print("\n--- Vocabulary Usage ---")
    print(usage) 