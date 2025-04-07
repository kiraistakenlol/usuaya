#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

FRONTEND_PORT=3000
# BACKEND_PORT=8000 # Removed

echo "Checking for existing frontend process..."

# Function to kill process by port
kill_process_on_port() {
  local port=$1
  local pid=$(lsof -ti :${port} || true)
  if [ -n "$pid" ]; then
    echo "Process $pid found using port $port. Attempting to kill..."
    # Try gentle kill first, then force
    kill $pid 2>/dev/null || kill -9 $pid 2>/dev/null || echo "Failed to kill process $pid (maybe already stopped?)."
    sleep 1 # Give OS time to release port
  else
    echo "Port $port is free."
  fi
}

kill_process_on_port $FRONTEND_PORT
# kill_process_on_port $BACKEND_PORT # Removed

# BACKEND_NEW_PID="" # Removed

# Function to clean up backend process on exit # Removed entire function
# cleanup() { ... }

# Trap SIGINT (Ctrl+C) and EXIT signals to run cleanup function # Removed
# trap cleanup SIGINT EXIT

# --- Removed Backend Starting Block --- START
# echo "Starting backend in background (localhost:$BACKEND_PORT)..."
# ( ... backend start logic ... ) 
# echo "Backend process starting with PID $(cat backend.pid). Logging to backend.log"
# echo "Waiting for backend to initialize (3s)..."
# sleep 3 
# if ! kill -0 $(cat backend.pid) 2>/dev/null; then ... exit ... fi
# --- Removed Backend Starting Block --- END

echo "Starting frontend in foreground (localhost:$FRONTEND_PORT)..."
(
  cd frontend || exit 1
  # Check if node_modules exists, if not install dependencies
  if [ ! -d "node_modules" ]; then
      echo "Node modules not found in frontend/. Installing dependencies..."
      npm install
  fi
  echo "Running: npm run dev -- --port $FRONTEND_PORT"
  # If npm run dev fails, the script will exit due to set -e
  # Press Ctrl+C in the terminal running this script to stop the frontend.
  npm run dev -- --port $FRONTEND_PORT
)

# Normal exit (if frontend finishes without error)
echo "Frontend process finished."

# --- Removed Backend Cleanup Block --- START
# rm -f backend.pid
# echo "Frontend stopped. Stopping backend (PID $BACKEND_NEW_PID)..."
# kill $BACKEND_NEW_PID
# wait $BACKEND_NEW_PID 2>/dev/null 
# echo "Backend stopped." 
# --- Removed Backend Cleanup Block --- END

echo "Script finished." 