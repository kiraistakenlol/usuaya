#!/bin/bash
# Restarts only the backend server.

set -e # Exit on error

BACKEND_PID_FILE="backend.pid"
BACKEND_PORT=8000

echo "--- Attempting to restart backend --- "

# Function to check if port is in use
check_port() {
    lsof -i ":$1" >/dev/null 2>&1
    return $?
}

# --- Stop existing processes ---
# First check PID file
if [ -f "$BACKEND_PID_FILE" ]; then
    OLD_PID=$(cat "$BACKEND_PID_FILE")
    if [ -n "$OLD_PID" ]; then
        echo "Found existing backend PID: $OLD_PID"
        if kill -0 "$OLD_PID" 2>/dev/null; then
            echo "Stopping process $OLD_PID..."
            kill "$OLD_PID" 2>/dev/null || kill -9 "$OLD_PID" 2>/dev/null
            sleep 2  # Wait longer for process to stop
        fi
    fi
    rm -f "$BACKEND_PID_FILE"
fi

# Then check if port is still in use (could be a different process)
if check_port "$BACKEND_PORT"; then
    echo "Port $BACKEND_PORT is still in use. Attempting to free it..."
    lsof -ti ":$BACKEND_PORT" | xargs kill -9 2>/dev/null || true
    sleep 2  # Wait for port to be freed
fi

# --- Start new backend process ---
echo "Starting new backend process (logging to terminal)..."
(
    cd backend-ts || exit 1
    if [ ! -d "node_modules" ]; then
        echo "Node modules not found. Installing dependencies..."
        npm install
    fi
    
    # Start NestJS in background, log to terminal, save PID
    npm run start:dev > ../backend.log 2>&1 &
    NEW_PID=$!
    echo $NEW_PID > "../$BACKEND_PID_FILE"
) 

# Brief pause and verification
sleep 3  # Wait longer for startup
if [ -f "$BACKEND_PID_FILE" ]; then
    VERIFY_PID=$(cat "$BACKEND_PID_FILE")
    if kill -0 "$VERIFY_PID" 2>/dev/null; then
        # Additional check to ensure port is actually in use by our process
        if check_port "$BACKEND_PORT"; then
            echo "Backend restarted successfully. New PID: $VERIFY_PID"
            echo "------------------------------------ "
            echo "Showing logs (press Ctrl+C to stop watching logs, backend will keep running)..."
            echo "------------------------------------ "
            tail -f backend.log
        else
            echo "ERROR: Backend process started but not listening on port $BACKEND_PORT" >&2
            kill "$VERIFY_PID" 2>/dev/null
            rm -f "$BACKEND_PID_FILE"
            exit 1
        fi
    else
        echo "ERROR: Backend process $VERIFY_PID not found after restart attempt." >&2
        rm -f "$BACKEND_PID_FILE"
        exit 1
    fi
else
    echo "ERROR: Failed to create PID file after restart attempt." >&2
    exit 1
fi

exit 0 