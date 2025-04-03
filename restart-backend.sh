#!/bin/bash
# Restarts only the backend server.

set -e # Exit on error

BACKEND_PID_FILE="backend.pid"
BACKEND_LOG_FILE="backend.log"
BACKEND_PORT=8000

echo "--- Attempting to restart backend --- "

# --- Stop existing backend process ---
if [ -f "$BACKEND_PID_FILE" ]; then
    OLD_PID=$(cat "$BACKEND_PID_FILE")
    if [ -n "$OLD_PID" ]; then
        echo "Found existing backend PID: $OLD_PID"
        # Check if process exists before trying to kill
        if kill -0 "$OLD_PID" 2>/dev/null; then
            echo "Stopping process $OLD_PID..."
            # Try gentle kill, then force kill if needed
            kill "$OLD_PID" 2>/dev/null || kill -9 "$OLD_PID" 2>/dev/null || echo "Failed to stop process $OLD_PID."
            # Wait a moment for the port to be released
            sleep 1 
        else
            echo "Process $OLD_PID not found (already stopped?)."
        fi
    else
        echo "PID file $BACKEND_PID_FILE was empty."
    fi
    # Clean up the old PID file
    rm -f "$BACKEND_PID_FILE"
else
    echo "Backend PID file ($BACKEND_PID_FILE) not found. Attempting to start fresh."
    # Optional: You could add a check here to see if the port is busy anyway
fi

# --- Start new backend process ---
echo "Starting new backend process (logging to terminal)..."
(
  cd backend || exit 1
  # Ensure venv exists and activate it
  if [ ! -d "venv" ]; then
      echo "Creating backend virtual environment..." >&2
      python3 -m venv venv || { echo "Failed to create venv"; exit 1; }
  fi
  source venv/bin/activate || { echo "Failed to activate venv"; exit 1; }
  
  # Ensure dependencies are installed (optional, but can be helpful)
  # echo "Installing/updating backend dependencies..."
  # pip install -r requirements.txt

  # Start Uvicorn in background, log to terminal, save PID
  # NOTE: Logs will mix with script output when run this way.
  python -m uvicorn main:app --reload --port $BACKEND_PORT &
  NEW_PID=$!
  echo $NEW_PID > "../$BACKEND_PID_FILE"
) 

# Brief pause and verification
sleep 2
if [ -f "$BACKEND_PID_FILE" ]; then
    VERIFY_PID=$(cat "$BACKEND_PID_FILE")
    if kill -0 "$VERIFY_PID" 2>/dev/null; then
        echo "Backend restarted successfully. New PID: $VERIFY_PID"
    else
        echo "ERROR: Backend process $VERIFY_PID not found after restart attempt. Check $BACKEND_LOG_FILE." >&2
        rm -f "$BACKEND_PID_FILE"
        exit 1
    fi
else
    echo "ERROR: Failed to create PID file after restart attempt. Check $BACKEND_LOG_FILE." >&2
    exit 1
fi

echo "------------------------------------ "

exit 0 