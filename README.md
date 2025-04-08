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
    *   Backend: `cd backend-ts && npm install && cd ..`
    *   Frontend: `cd frontend && npm install && cd ..`

3.  **Start Backend:** Run the backend server in a separate terminal.
    ```bash
    ./start-backend.sh 
    ```
    This script:
    *   Stops any existing backend process (using port 8000 or the PID file).
    *   Installs dependencies if needed (`backend-ts/node_modules`).
    *   Starts the backend (NestJS) in the background (logging to `backend.log`).
    *   Follows the logs in the current terminal (Press `Ctrl+C` to stop following logs; the backend will continue running).

4.  **Start Frontend:** Run the frontend development server in another terminal.
    ```bash
    ./start-frontend.sh
    ```
    This script:
    *   Stops any existing frontend process (using port 3000).
    *   Installs dependencies if needed (`frontend/node_modules`).
    *   Starts the frontend (Next.js) in the foreground at `http://localhost:3000`.
    *   Press `Ctrl+C` in this terminal to stop the frontend server.

5.  **Access the App:** Open `http://localhost:3000` in your browser.

6.  **Stop Servers:** 
    *   Press `Ctrl+C` in the terminal running `./start-frontend.sh` to stop the frontend.
    *   To stop the backend, you can either run `./start-backend.sh` again (which will stop the old one before starting a new one, effectively just stopping it if you interrupt the script) or find and kill the process using the `backend.pid` file or port 8000.

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

## Text Generation: Creating Interactive Learning Data

**Goal:** When you provide a list of vocabulary words, the backend's goal is to generate not just a Spanish text and audio, but also a rich set of data (`analysis_data`) that allows the frontend to be an interactive learning tool. This data powers features like synchronized highlighting between audio and text, clickable words that jump the audio, and popups explaining words and grammar.

**The Core Data: `analysis_data`**

The main output stored in the `Text` table's `analysis_data` column is a single JSON object containing everything needed for the frontend experience. It looks roughly like this:

```json
{
  "word_timings": [ ... ],       // Spanish word timings + sequential index
  "spanish_plain": "...",        // The original Spanish text
  "analysis_result": { ... },    // Detailed Spanish analysis from Claude AI
  "english_data": { ... }        // Tokenized English text + alignment map
}
```

Let's break down the important parts inside `analysis_data`:

**1. `word_timings` (Array of Objects)**

*   **What it is:** An ordered list where each object represents a single Spanish word/punctuation segment. It combines timing from audio with a unique sequential index.
*   **Relationship:** Backbone for syncing audio and Spanish text. The `index` links to `analysis_result.analysis_by_index` and the keys in `english_data.spanish_index_to_english_indices`.
*   **Structure Example:**
    ```typescript
    {
      "index": 4,        // 0-based position. **Crucial Link** to analysis & alignment.
      "word": "casa",    // The Spanish word.
      "start": 0.778,    // Start time in audio (seconds).
      "end": 1.033,      // End time in audio (seconds).
      "confidence": 1    // Audio engine confidence (0-1).
    }
    ```
*   **Frontend Use:** Highlights Spanish word based on `start`/`end`, seeks audio based on `start`, links to analysis/alignment via `index`.

**2. `analysis_result` (Object)**

*   **What it is:** Contains the detailed linguistic analysis of the *Spanish* text.
*   **Relationship:** Linked to `word_timings` via the `index`.
*   **Key Parts Inside `analysis_result`:**
    *   **a. `analysis_by_index` (Object):** Dictionary keyed by Spanish `index` (string). Value has info about *that specific Spanish word*.
        *   **Structure Example (`"4"`):** `{ "original_word": "casa", "lemma": "casa", "pos": "noun", "english_word_translation": "house" }`
        *   **Frontend Use:** Populates hover popups for Spanish words (lemma, POS, contextual translation). To find annotations for a word, the frontend now iterates through the main `annotations` object and checks if the word's index is in their `scope_indices`.
    *   **b. `annotations` (Object):** Dictionary keyed by unique `annotation_id`. Value describes a specific linguistic point (slang, grammar) potentially spanning multiple Spanish words.
        *   **Structure Example (`"ann1"`):** `{ "type": "grammar", "scope_indices": [0, 1], "label": "Voseo", "explanation_spanish": "...", "explanation_english": "..." }`
        *   **Frontend Use:** The `scope_indices` array directly links the annotation to the relevant word indices from `word_timings`. Used to highlight words and display explanations in popups.

**3. `english_data` (Object)**

*   **What it is:** Contains the tokenized English translation and the map linking it back to the Spanish words.
*   **Key Parts Inside `english_data`:**
    *   **a. `tokens` (Array of Objects):** Ordered list representing the English translation, broken down into words/punctuation.
        *   **Structure Example:** `[ { "text": "You" }, { "text": "know" }, { "text": "that" }, ... ]`
        *   **Frontend Use:** Used to render the English text interactively. The array index of each token is used for highlighting via the alignment map.
    *   **b. `spanish_index_to_english_indices` (Object):** The crucial alignment map.
        *   **What it is:** Dictionary where keys are Spanish `index` values (from `word_timings`, as strings). Values are arrays of **array indices** corresponding to the `tokens` array above.
        *   **Structure Example:** `{ "0": [0], "1": [1], "5": [3, 4], "19": [15], "20": [15], "21": [15] }` (e.g., Spanish word at index 5 maps to English tokens at array indices 3 and 4).
        *   **Frontend Use:** When a Spanish word (index `i`) is highlighted (due to audio playback or hover), the frontend looks up `spanish_index_to_english_indices[String(i)]` and highlights the English tokens at the specified array indices.

**4. `spanish_plain` (String)**

*   **What it is:** The original generated Spanish text as a single string.
*   **Frontend Use:** Primarily for reference or fallback display.

By linking these structures—using the Spanish `index` to connect timings, Spanish analysis (`analysis_by_index`), and the alignment map (`english_data`), while using `scope_indices` within the main `annotations` object to link linguistic points back to word indices—the frontend can provide a dynamic and informative learning interface with synchronized highlighting. 