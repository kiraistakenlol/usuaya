#!/bin/bash
# Simple script to start backend and frontend for development

echo "Starting backend in background (localhost:8000)..."
(
  cd backend || exit 1
  # Assuming venv is named 'venv' and python is accessible
  # Use python -m to avoid PATH issues if activation fails
  source venv/bin/activate
  python -m uvicorn main:app --reload --port 8000
) > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend process started with PID $BACKEND_PID. Logging to backend.log"

# Give backend a moment to start up
sleep 3

echo "Starting frontend in foreground (localhost:3000)..."
(
  cd frontend || exit 1
  npm run dev -- --port 3000 # Explicitly set port
)

# When frontend (npm run dev) is stopped (e.g., Ctrl+C), kill the background backend process
echo "Frontend stopped. Stopping backend (PID $BACKEND_PID)..."
kill $BACKEND_PID
wait $BACKEND_PID 2>/dev/null # Wait briefly for cleanup
echo "Backend stopped." 