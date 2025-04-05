#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

FRONTEND_PORT=3000
BACKEND_PORT=8000

echo "Checking for existing processes..."

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
kill_process_on_port $BACKEND_PORT

BACKEND_NEW_PID=""

# Function to clean up backend process on exit
cleanup() {
  echo
  if [ -n "$BACKEND_NEW_PID" ]; then
    echo "Script interrupted/exiting. Stopping backend (PID $BACKEND_NEW_PID)..."
    # Check if the process still exists before killing
    if kill -0 $BACKEND_NEW_PID 2>/dev/null; then
        # Try gentle kill first, then force
        kill $BACKEND_NEW_PID 2>/dev/null || kill -9 $BACKEND_NEW_PID 2>/dev/null
        wait $BACKEND_NEW_PID 2>/dev/null # Wait briefly for cleanup
        echo "Backend stopped."
    else
        echo "Backend process $BACKEND_NEW_PID already stopped or not found."
    fi
  else
    echo "No backend process PID recorded to stop."
  fi
}

# Trap SIGINT (Ctrl+C) and EXIT signals to run cleanup function
trap cleanup SIGINT EXIT

echo "Starting backend in background (localhost:$BACKEND_PORT)..."
(
  cd backend-ts || exit 1
  # Check if node_modules exists, if not install dependencies
  if [ ! -d "node_modules" ]; then
      echo "Node modules not found. Installing dependencies..."
      npm install
  fi
  echo "Running: npm run start:dev"
  # Start backend and capture its PID
  npm run start:dev > ../backend.log 2>&1 &
  BACKEND_NEW_PID=$!
  echo $BACKEND_NEW_PID > ../backend.pid # Store PID in a file
) 
echo "Backend process starting with PID $(cat backend.pid). Logging to backend.log"

# Give backend a moment to start up
echo "Waiting for backend to initialize (3s)..."
sleep 3 # Adjust if needed

# Check if backend started successfully (check if PID exists)
if ! kill -0 $(cat backend.pid) 2>/dev/null; then
    echo "ERROR: Backend process failed to start. Check backend.log for details." >&2
    rm -f backend.pid # Clean up pid file
    exit 1
fi

echo "Starting frontend in foreground (localhost:$FRONTEND_PORT)..."
(
  cd frontend || exit 1
  echo "Running: npm run dev -- --port $FRONTEND_PORT"
  # If npm run dev fails, the script will exit due to set -e, triggering the trap
  npm run dev -- --port $FRONTEND_PORT
)

# Normal exit (if frontend finishes without error) will also trigger the trap
echo "Frontend process finished."

# Clean up PID file on successful script completion (trap handles abnormal exit)
rm -f backend.pid

echo "Frontend stopped. Stopping backend (PID $BACKEND_NEW_PID)..."
kill $BACKEND_NEW_PID
wait $BACKEND_NEW_PID 2>/dev/null # Wait briefly for cleanup
echo "Backend stopped." 