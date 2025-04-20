#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

FRONTEND_PORT=3000 # Keep the same port for now, Vite will use it

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

echo "Starting frontend in foreground (localhost:$FRONTEND_PORT)..."
(
  # Change directory to frontend
  cd frontend || exit 1
  # Check if node_modules exists, if not install dependencies
  if [ ! -d "node_modules" ]; then
      echo "Node modules not found in frontend/. Installing dependencies..."
      # Run install from root for workspace consistency
      (cd .. && npm install)
      # If you prefer installing only for this workspace (might miss hoisted deps):
      # npm install 
  fi
  echo "Running: npm run dev -- --port $FRONTEND_PORT"
  # npm run dev in frontend executes "vite". The -- --port passes the argument.
  # Press Ctrl+C in the terminal running this script to stop the frontend.
  npm run dev -- --port $FRONTEND_PORT 
)

# Normal exit (if frontend finishes without error)
echo "Frontend process finished."

echo "Script finished." 