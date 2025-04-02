# Project Status & Planning

This file tracks the overall status, plans, and conventions for this project. It's intended as a reference, especially for AI collaboration.

## Project Vision

Create an application to streamline a personalized Spanish learning workflow. The app should automate text generation (Argentinian Spanish, using known/unknown vocabulary), translation, and text-to-speech generation. It should provide an integrated interface for consuming this content, allowing granular audio playback tied to text segments, spaced repetition of vocabulary, and in-app grammar explanations. The primary goal is to make the learning process less time-consuming and more effective.

## Current State

Project initialized with basic file structure (`README.md`, `PROJECT_STATUS.md`) and git repository. No application code exists yet.

## Roadmap / Next Steps

(Use Markdown checklists for planned tasks or features)

**Core Workflow Automation (Problem A):**
- [ ] Integrate with an AI model (like GPT) for text generation based on vocabulary lists and regional preferences (Argentinian Spanish).
- [ ] Integrate with a Text-to-Speech (TTS) service to generate audio for Spanish text.
- [ ] Integrate with an AI model or translation service for English translation.
- [ ] Develop a mechanism to store/manage generated content sets (Spanish text, English translation, audio file). (Initially, maybe simple file storage, later potentially a database).
- [ ] Optional: Explore Telegram Bot integration for delivering content (or build a dedicated UI).

**Enhanced Playback (Problem B):**
- [ ] Develop a UI that displays Spanish text alongside its translation.
- [ ] Implement synchronized playback: clicking a sentence/word in the Spanish text plays the corresponding audio segment.

**Spaced Repetition & Vocabulary Management (Problem C):**
- [ ] Create a system to store and track user's known/unknown vocabulary.
- [ ] Implement logic to incorporate previously learned/unknown words into newly generated texts with adjustable frequency (Spaced Repetition System - SRS).
- [ ] Optional: Rank vocabulary by real-world usage frequency.

**In-App Grammar Explanations (Problem D):**
- [ ] Integrate with an AI model to provide grammar explanations for selected words or sentences within the application.

**Foundation:**
- [X] Define project architecture (e.g., language/framework choice, frontend/backend separation).
- [X] Initialize project structure and status tracking.

## Key Decisions & Conventions

(Record important architectural choices, coding style guides, etc.)
- **Technology Stack:**
    - **Backend:** Python with FastAPI
    - **Frontend:** Next.js (React) with Tailwind CSS
    - **Development Environment:** Local setup for both frontend and backend.

## README Update Rules

**Objective:** Keep `README.md` concise and focused on users/developers needing to *run* or *understand* the project at a high level. Avoid deep technical details or exhaustive feature lists unless critical for getting started.

**Update Triggers & Content:**

1.  **Initial Setup:** Update "Getting Started" when the basic setup/build/run commands are established.
2.  **Core Functionality:** Update the main description and "Usage" section when significant user-facing features are completed and stable.
3.  **Dependencies:** Update "Getting Started" if new system dependencies or crucial setup steps are added.
4.  **API Changes (if applicable):** If the project exposes an API, update relevant sections when breaking changes or significant additions occur.
5.  **Versioning/Releases:** If we implement versioning, update `README.md` to reflect the latest stable version and link to a `CHANGELOG.md` (if we create one).

**Information Sources:** I should primarily use the "Project Vision", "Current State", and completed items from the "Roadmap" section of *this file* to inform `README.md` updates. Key technical details needed for setup should come from established configurations or installation scripts. 