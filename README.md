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

The current version provides a basic web interface to:
*   View a list of Spanish phrases.
*   Add new phrases.
*   Delete existing phrases.

Data is stored persistently in the PostgreSQL database managed by Docker Compose. 