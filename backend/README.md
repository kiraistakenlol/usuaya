# usuaya-backend

NestJS backend for the Vibe Spanish Helper project.

## Setup

1.  **Prerequisites:**
    *   Node.js (check `package.json` for required version)
    *   Access to a PostgreSQL database (local via Docker or remote)
    *   API Keys (Anthropic, Grok, ElevenLabs) stored in AWS Secrets Manager or `.env` file for local dev.

2.  **Environment Variables:**
    *   Copy `.env.example` to `.env` in the `backend` directory and fill in the required values:
        ```bash
        cp backend/.env.example backend/.env
        ```
    *   Ensure values for `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` are correct for your
        database setup.
    *   Fill in `ANTHROPIC_API_KEY`, `GROK_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`.

3.  **Install Dependencies:**
    *   From the project root directory, run:
        ```bash
        npm install
        ```
    *   Alternatively, from within the `backend` directory:
        ```bash
        npm install
        ```

## Running the app

```bash
# From project root
./start-backend.sh

# OR directly (from within the `backend` directory)

# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Test

```bash
# From project root
npm run test -w backend

# OR directly (from within the `backend` directory)

# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Database Migrations (TypeORM)

Ensure your `.env` file is configured with database credentials.
Run these commands from within the `backend` directory:

```bash
# Generate a new migration file (e.g., after changing entities)
npm run typeorm:migration:generate -- src/migrations/MyMigrationName

# Run pending migrations
npm run typeorm:migration:run

# Revert the last executed migration
npm run typeorm:migration:revert
```
