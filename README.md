# Vibe - Spanish Learning Helper

This project aims to streamline a personalized Spanish learning workflow by automating text/audio generation and providing an integrated practice interface.

## Getting Started

### Prerequisites

*   Docker & Docker Compose
*   Node.js (check `frontend/package.json` for version, e.g., >= 18)
*   Python 3 (check `PROJECT_STATUS.md` for specific version notes, e.g., 3.10+)

### Running Locally

1.  **Start Database:**
    ```bash
    docker-compose up -d
    ```
    (Wait a few seconds for the database to initialize on first run).

2.  **Install Dependencies (First Time Only):**
    *   Backend: `cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && cd ..`
    *   Frontend: `cd frontend && npm install && cd ..`

3.  **Run Development Servers:**
    ```bash
    ./start-dev.sh
    ```
    This script handles:
    *   Checking/killing processes on ports 3000 & 8000.
    *   Activating the Python virtual environment.
    *   Starting the backend (FastAPI) at `http://localhost:8000` (logs to `backend.log`).
    *   Starting the frontend (Next.js) at `http://localhost:3000`.

4.  **Access the App:** Open `http://localhost:3000` in your browser.

5.  **Stop Servers:** Press `Ctrl+C` in the terminal running `./start-dev.sh`. The script will stop both frontend and backend.

## Usage

The current version provides a web interface to:
*   View a list of Spanish texts with their English translations
*   Generate new texts based on vocabulary lists
*   View creation dates for all texts
*   Access audio recordings for texts (when available)
*   Manage vocabulary lists for text generation

## Key Technologies

*   **Backend:** Python (FastAPI)
*   **Frontend:** TypeScript (Next.js, React)
*   **Database:** PostgreSQL (via Docker)
*   **LLM for Text Generation & Analysis:** Anthropic Claude 3.7 Sonnet (`claude-3-7-sonnet-20250219`)
*   **Audio Generation:** ElevenLabs

Data is stored persistently in the PostgreSQL database managed by Docker Compose.

## Claude API Response Structure

When generating text, the backend requests a detailed analysis from the Claude API. The expected response is a JSON object with the following structure:

```json
{
  "analysis_version": "1.0",
  "target_audience_profile": "Russian speaker learning Argentinian Spanish, fluent in English",
  "original_request": {
    "vocabulary": ["list", "of", "requested", "words/phrases"]
  },
  "generated_text": {
    "spanish_plain": "<Generated Spanish text as a single string>",
    "tokens": [
      {
        "text": "<Word/Punctuation>",
        "index": <integer, 0-based>,
        "lemma": "<Base form>",
        "pos": "<Part of Speech Tag>",
        "english": "<Contextual English translation or null>",
        "russian": "<Contextual Russian translation or null>",
        "annotation_ids": ["<id_1>"]
      }
      // ...
    ],
    "annotations": {
      "<unique_annotation_id>": {
        "type": "<slang|idiom|grammar|cultural_note|etc.>",
        "scope_indices": [<index1>, <index2>],
        "label": "<Short display label>",
        "explanation_spanish": "<Detailed explanation in Spanish>",
        "explanation_english": "<Detailed explanation in English>",
        "explanation_russian": "<Detailed explanation in Russian>"
      }
      // ...
    }
  },
  "english_translation_plain": "<Full English translation>",
  "vocabulary_usage_report": {
    "requested": ["list", "of", "requested", "words/phrases"],
    "found": [
      {
        "requested": "<word>",
        "found_as": "<word_in_text>",
        "token_indices": [<index>],
        "lemma_match": <boolean>
      }
      // ...
    ],
    "notes": "<Summary of usage>"
  }
}
```

This structured data (`analysis_data` in the database) includes:
*   The plain Spanish and English text.
*   Tokenized Spanish text with POS tags, lemmas, and basic translations.
*   Detailed annotations for slang, idioms, grammar points, etc., linked to specific tokens.
*   This structure enables richer frontend features like contextual popups and highlighting. 