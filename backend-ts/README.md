# Vibe Coding Backend

A NestJS backend for generating Spanish language learning content with text-to-speech capabilities.

## Features

- Generate Spanish text with English translations using Claude AI
- Convert Spanish text to speech using ElevenLabs
- Store generated content in PostgreSQL database
- RESTful API endpoints for text and audio retrieval

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (typically run via Docker)
- Docker and Docker Compose (for the database)

## Environment Variables

Copy `.env.example` to `.env` in the `backend-ts` directory and fill in the required values:

```bash
cp backend-ts/.env.example backend-ts/.env
```

Required environment variables:
- `DB_HOST`: PostgreSQL host (e.g., `localhost` if using Docker Compose from root)
- `DB_PORT`: PostgreSQL port (e.g., `5432`)
- `DB_USERNAME`: PostgreSQL username
- `DB_PASSWORD`: PostgreSQL password
- `DB_DATABASE`: PostgreSQL database name
- `ANTHROPIC_API_KEY`: Anthropic API key for Claude AI
- `ELEVENLABS_API_KEY`: ElevenLabs API key for text-to-speech
- `ELEVENLABS_VOICE_ID`: ElevenLabs voice ID for text-to-speech

## Installation

Navigate to the backend directory and install dependencies:

```bash
cd backend-ts
npm install
cd .. 
```

## Running the Application

The development environment is typically managed by scripts in the project root directory:

-   **Start Backend:** Use `../start-backend.sh` from the project root. This script handles stopping old processes, installing dependencies if needed, and starting the NestJS server.
-   **Start Frontend:** Use `../start-frontend.sh` from the project root (in a separate terminal) to run the frontend application.

Refer to the main project `README.md` for the complete workflow.

## API Endpoints

### Text Generation

```http
POST /texts
Content-Type: application/json

{
  "vocabulary": ["word1", "word2", "word3"]
}
```

### Text Retrieval

```http
GET /texts
GET /texts/:id
```

### Audio Retrieval

```http
GET /texts/:id/audio
```

## Development

Run these commands from within the `backend-ts` directory:

```bash
# Run tests
npm run test

# Run linter
npm run lint

# Run formatter
npm run format
```
