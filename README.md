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
  "word_timings": [ ... ],       // Timing for each word + index
  "spanish_plain": "...",        // The original Spanish text
  "analysis_result": { ... },    // Detailed analysis from Claude AI
  "english_translation_plain": "..." // Overall English translation from Claude
}
```

Let's break down the important parts inside `analysis_data`:

**1. `word_timings` (Array of Objects)**

*   **What it is:** An ordered list where each object represents a single word (or punctuation treated as a word) from the generated Spanish text. It combines timing information from the audio engine (ElevenLabs) with a unique index.
*   **Relationship:** This is the backbone for syncing audio and text. The `index` in each object links directly to the analysis data for that specific word.
*   **Structure Example:**
    ```typescript
    {
      "index": 4,        // Unique, 0-based position of the word in the sequence. **Crucial Link** to analysis_by_index.
      "word": "casa",    // The actual word as spoken in the audio.
      "start": 0.778,    // When the word begins in the audio (in seconds). Used for audio seeking and highlight start.
      "end": 1.033,      // When the word ends in the audio (in seconds). Used for highlight end.
      "confidence": 1    // How confident the audio engine was about this word (0-1). (Currently informational)
    }
    ```
*   **Frontend Use:**
    *   `start`, `end`: Used to highlight the `word` in the text when the audio playback time falls between these values.
    *   `start`: When a `word` in the text is clicked, the audio player jumps (seeks) to this time.
    *   `index`, `word`: Used to fetch the corresponding analysis when hovering over the word.

**2. `analysis_result` (Object)**

*   **What it is:** Contains the detailed linguistic analysis performed by Claude AI.
*   **Relationship:** This object holds the deeper understanding of the text. Its sub-parts are linked via the word `index` or specific `annotation_id`s.
*   **Key Parts Inside `analysis_result`:**

    *   **a. `analysis_by_index` (Object)**
        *   **What it is:** A dictionary where each key is a word's `index` (as a string, e.g., `"4"`) from the `word_timings` array. The value is an object containing information specifically about *that* word.
        *   **Relationship:** Directly linked to `word_timings` via the `index`.
        *   **Structure Example (for index "4"):**
            ```typescript
            "4": {
              "original_word": "casa",   // The word exactly as it appeared at this index.
              "lemma": "casa",         // The base or dictionary form of the word.
              "pos": "noun",           // Part of Speech (e.g., 'verb', 'noun', 'adjective').
              "english_word_translation": "house", // Contextual English translation for this word.
              "annotation_ids": []       // List of IDs linking to any special 'annotations' that apply to this word. (Empty in this case).
            }
            ```
        *   **Frontend Use:**
            *   Provides the data for the hover popup when hovering over an individual word (lemma, POS, English translation).
            *   `annotation_ids` tells the frontend if this word is part of a larger explained phenomenon (linking to `annotations`).

    *   **b. `annotations` (Object)**
        *   **What it is:** A dictionary where each key is a unique `annotation_id` (e.g., `"ann1"`). The value describes a specific linguistic point (like slang, an idiom, or a grammar rule) that might span one or more words.
        *   **Relationship:** Linked *from* `analysis_by_index[index].annotation_ids`. An annotation can apply to multiple words via its `scope_indices`.
        *   **Structure Example:**
            ```typescript
            "ann1": {
              "type": "grammar",        // Category (e.g., 'slang', 'idiom', 'grammar').
              "scope_indices": [0, 1],  // The indices (from `word_timings`) that this annotation covers.
              "label": "Voseo",         // A short title for the annotation.
              "explanation_spanish": "El 'voseo' es un rasgo...", // Detailed explanation in Spanish.
              "explanation_english": "The 'voseo' is a characteristic..." // Detailed explanation in English.
            }
            ```
        *   **Frontend Use:**
            *   `scope_indices`: Used to visually highlight all words belonging to this annotation when one of them is hovered.
            *   `label`, `explanation_spanish`, `explanation_english`: Displayed in the popup when hovering over an annotated word/phrase.

    *   **c. `english_translation_plain` (String)**
        *   **What it is:** A plain text string containing the full, cohesive English translation of the entire generated Spanish text, as provided by Claude.
        *   **Frontend Use:** Displayed alongside the Spanish text for reference.

**3. `spanish_plain` (String)**

*   **What it is:** The original generated Spanish text as a single string.
*   **Relationship:** This is the source text that was sent for audio generation and analysis. The `word_timings` array represents this text broken down word-by-word.
*   **Frontend Use:** Primarily used as a fallback or for displaying the text if timings/analysis are somehow missing, though the interactive display relies on rendering from `word_timings`.

By linking these structures—using the `index` to connect timings to per-word analysis, and `annotation_ids` to connect words to broader explanations—the frontend can provide a dynamic and informative learning interface. 