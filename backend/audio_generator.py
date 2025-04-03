import os
from elevenlabs.client import ElevenLabs
from elevenlabs import save
import io

# --- Configuration --- 
# WARNING: Avoid committing real keys to Git in production projects.
ELEVENLABS_API_KEY = "sk_83246b1441f4e29c788d7949990c6269368f199d39486973"
VOICE_ID = "ukupJ4zdf9bo1Py6MiO6"

# Initialize client (can be done once)
try:
    client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
except Exception as e:
    print(f"Error initializing ElevenLabs client: {e}")
    client = None

def generate_audio_elevenlabs(text: str) -> io.BytesIO | None:
    """Generates audio for the given text using ElevenLabs.

    Args:
        text: The text to synthesize.

    Returns:
        A file-like object (io.BytesIO) containing the audio data (e.g., MP3),
        or None if generation fails.
    """
    if not client:
        print("ElevenLabs client not initialized.")
        return None
    if not text:
        print("Cannot generate audio for empty text.")
        return None

    try:
        print(f"Requesting audio generation from ElevenLabs for text: {text[:50]}...")
        # Generate audio stream
        audio_stream = client.generate(
            text=text,
            voice=VOICE_ID,
            model="eleven_multilingual_v2" # Or another suitable model
        )

        # Read the stream into an in-memory bytes buffer
        audio_bytes_io = io.BytesIO()
        for chunk in audio_stream:
            if chunk:
                audio_bytes_io.write(chunk)
        
        audio_bytes_io.seek(0) # Reset buffer position to the beginning
        print("Audio generation successful.")
        return audio_bytes_io

    except Exception as e:
        print(f"Error generating audio with ElevenLabs: {e}")
        return None

# --- Example Usage (for testing) --- 
# if __name__ == '__main__':
#     test_text = "Hola mundo, ¿cómo estás hoy? Este es un texto de prueba."
#     print(f"Testing ElevenLabs audio generation for: {test_text}")
#     audio_data = generate_audio_elevenlabs(test_text)
# 
#     if audio_data:
#         # Example of how to save the received audio data to a file
#         try:
#             with open("test_output.mp3", "wb") as f:
#                 f.write(audio_data.read())
#             print("Saved test audio to test_output.mp3")
#         except IOError as e:
#             print(f"Error saving test audio file: {e}")
#     else:
#         print("Audio generation failed.") 