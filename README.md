# Vibe - Spanish Learning Helper

This project aims to streamline a personalized Spanish learning workflow by automating text/audio generation and providing an integrated practice interface.

## Getting Started

### Prerequisites

*   Docker & Docker Compose
*   Node.js (check `frontend/package.json` for version, e.g., >= 19)
*   No Python needed.

### Running Locally

1.  **Start Database:**
    ```bash
    docker-compose up -d
    ```
    (Wait a few seconds for the database to initialize on first run).

2.  **Install Dependencies (First Time Only):
    *   Run `npm install` in the project root. This will install dependencies for all workspaces (`backend`, `frontend`, `packages/shared-types`).

3.  **Start Backend:** Run the backend server in a separate terminal.
    ```bash
    ./start-backend.sh
    ```
    This script:
    *   Stops any existing backend process (using port 8000).
    *   Installs dependencies if needed (`backend/node_modules`, though root install is preferred).
    *   Starts the backend (NestJS) in the foreground (logging to terminal).
    *   Press `Ctrl+C` to stop the backend.

4.  **Start Frontend:** Run the frontend development server in another terminal.
    ```bash
    ./start-frontend.sh
    ```
    This script:
    *   Stops any existing frontend process (using port 3000).
    *   Installs dependencies if needed (`frontend/node_modules`, though root install is preferred).
    *   Starts the frontend (Vite + React) in the foreground at `http://localhost:3000`.
    *   Press `Ctrl+C` in this terminal to stop the frontend server.

5.  **Access the App:** Open `http://localhost:3000` in your browser.

6.  **Stop Servers:**
    *   Press `Ctrl+C` in the terminals running `./start-frontend.sh` and `./start-backend.sh`.

## Usage

The current version provides a web interface to:
*   View a list of Spanish texts with their English translations
*   Generate new texts based on vocabulary lists
*   View creation dates for all texts
*   Access audio recordings for texts (when available)
*   Manage vocabulary lists for text generation

## Key Technologies

*   **Backend:** TypeScript (NestJS / TypeORM)
*   **Frontend:** TypeScript (Vite, React, MUI, Tailwind)
*   **Database:** PostgreSQL (via Docker)
*   **LLM for Text Generation & Analysis:** Anthropic Claude / Grok
*   **Audio Generation:** ElevenLabs

Data is stored persistently in the PostgreSQL database managed by Docker Compose.

## Deployment

Deployment is managed using AWS (App Runner, RDS, S3, Amplify Hosting) managed via Terraform. Configuration and plans can be found in the `infra/` directory.

## Text Generation: Creating Interactive Learning Data

**Goal:** ... generate ... a set of data (`analysis_data`) that allows the frontend to be an interactive learning tool. This data powers features like synchronized highlighting between audio and text, clickable words that jump the audio, and identifying used vocabulary.

**The Core Data: `analysis_data`**

The main output stored in the `Text` table's `analysis_data` column is a single JSON object containing everything needed for the simplified frontend experience. It looks roughly like this:

```json
{
  "word_timings": [ ... ],                   // Spanish word timings + sequential index
  "spanish_plain": "...",                    // The original Spanish text
  "indexed_spanish_words": { ... },        // Map: Spanish index -> { text, vocab_id }
  "indexed_english_translation_words": [ ... ], // Array of English token strings
  "alignment_spanish_to_english": { ... }     // Map: Spanish index -> English token indices
}
```

**Additional Stored Data (in separate `Text` table columns):**

*   `llm_generation_request_prompt`: The full prompt sent to the LLM for initial text generation.
*   `raw_llm_generation_response`: The raw text response received for initial text generation.
*   `llm_analysis_request`: The JSON payload sent to the LLM for analysis.
*   `raw_llm_analysis_response`: The raw JSON string received from the LLM analysis call.

(These logging fields are stored for debugging/auditing but are not typically used directly by the frontend).

Let's break down the important parts inside the main `analysis_data` field:

**1. `word_timings` (Array of Objects)**

*   **What it is:** An ordered list where each object represents a single Spanish word/punctuation segment. It combines timing from audio with a unique sequential `index`.
*   **Relationship:** Backbone for syncing audio and Spanish text. The `index` links to `indexed_spanish_words` and the keys in `alignment_spanish_to_english`.
*   **Structure Example:**
    ```typescript
    {
      "index": 4,        // 0-based position. **Crucial Link** to analysis & alignment.
      "word": "casa",    // The Spanish word (from audio service, might differ slightly from LLM analysis).
      "start": 0.778,    // Start time in audio (seconds).
      "end": 1.033,      // End time in audio (seconds).
      "confidence": 1    // Audio engine confidence (0-1).
    }
    ```
*   **Frontend Use:** Highlights Spanish word based on `start`/`end`, seeks audio based on `start`, links to alignment via `index`.

**2. `indexed_spanish_words` (Object)**

*   **What it is:** Dictionary keyed by Spanish `index` (string). Value contains the text of the Spanish word as seen by the LLM and its vocabulary ID.
*   **Relationship:** Linked to `word_timings` via the `index` key.
*   **Structure Example (`"4"`):** `{ "text": "casa", "vocabulary_id": null }`
*   **Frontend Use:** Used to render the Spanish text and check `vocabulary_id` to highlight words that were part of the input vocabulary.

**3. `indexed_english_translation_words` (Array of Strings)**

*   **What it is:** Ordered list representing the English translation, broken down into words/punctuation strings.
*   **Structure Example:** `[ "You", "know", "that", ... ]`
*   **Frontend Use:** Used to render the English text. The array index of each token is used for highlighting via the alignment map.

**4. `alignment_spanish_to_english` (Object)**

*   **What it is:** The crucial alignment map.
*   **What it is:** Dictionary where keys are Spanish `index` values (from `word_timings`, as strings). Values are arrays of **array indices** corresponding to the `indexed_english_translation_words` array.
*   **Structure Example:** `{ "0": [0], "1": [1], "5": [3, 4], "19": [15], "20": [15] }` (e.g., Spanish word at index 5 maps to English tokens at array indices 3 and 4).
*   **Frontend Use:** When a Spanish word (index `i`) is highlighted (due to audio playback or hover), the frontend looks up `alignment_spanish_to_english[String(i)]` and highlights the English tokens at the specified array indices. Also used for English-to-Spanish hover.

**5. `spanish_plain` (String)**

*   **What it is:** The original generated Spanish text as a single string.
*   **Frontend Use:** Primarily for reference or fallback display.

By linking these structures—using the Spanish `index` to connect timings, the Spanish word details (`indexed_spanish_words`), and the alignment map (`alignment_spanish_to_english`)—the frontend can provide a dynamic learning interface with synchronized highlighting and vocabulary identification. 