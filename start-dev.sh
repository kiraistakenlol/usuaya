#!/bin/bash
# Simple script to start backend and frontend for development

# IMPORTANT: Ensure ports 8000 and 3000 are free before running this script.
# Stop any previous instances of the backend or frontend servers.

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
echo "Waiting for backend to initialize..."
sleep 4 # Increased sleep slightly

# Check if backend process is still running before starting frontend
if ! kill -0 $BACKEND_PID 2>/dev/null; then
  echo "ERROR: Backend process failed to start. Check backend.log for details." >&2
  exit 1
fi

echo "Starting frontend in foreground (localhost:3000)..."
(
  cd frontend || exit 1
  npm run dev -- --port 3000 # Explicitly set port
)

# When frontend (npm run dev) is stopped (e.g., Ctrl+C), kill the background backend process
echo "Frontend stopped. Attempting to stop backend (PID $BACKEND_PID)..."
# Check if the process exists before trying to kill it
if kill -0 $BACKEND_PID 2>/dev/null; then
  kill $BACKEND_PID
  wait $BACKEND_PID 2>/dev/null # Wait briefly for cleanup
  echo "Backend stopped."
else
  echo "Backend process (PID $BACKEND_PID) already stopped."
fi 