#!/bin/bash
# Restarts the backend server and logs directly to the terminal.

set -e # Exit on error

# Remove PID/Log file definitions as they are no longer used
# BACKEND_PID_FILE="backend.pid"
# BACKEND_LOG_FILE="backend.log"
BACKEND_PORT=8000

echo "--- Attempting to restart backend --- "

# Function to check if port is in use
check_port() {
    lsof -i ":$1" >/dev/null 2>&1
    return $?
}

# --- Stop existing processes ---
# First check known PID file location for cleanup (even if we don't use it now)
if [ -f "backend.pid" ]; then
    OLD_PID=$(cat "backend.pid")
    if [ -n "$OLD_PID" ]; then
        echo "Found previous backend PID: $OLD_PID"
        if kill -0 "$OLD_PID" 2>/dev/null; then
            echo "Stopping process $OLD_PID..."
            kill "$OLD_PID" 2>/dev/null || kill -9 "$OLD_PID" 2>/dev/null
            sleep 2  # Wait longer for process to stop
        fi
    fi
    rm -f "backend.pid"
fi

# Then check if port is still in use (could be a different process)
if check_port "$BACKEND_PORT"; then
    echo "Port $BACKEND_PORT is still in use. Attempting to free it..."
    lsof -ti ":$BACKEND_PORT" | xargs kill -9 2>/dev/null || true
    sleep 2  # Wait for port to be freed
fi

# --- Start new backend process ---
# Remove log file clearing
# > "$BACKEND_LOG_FILE"

echo "Starting new backend process (logging to terminal)..."
echo "Press Ctrl+C to stop."
echo "------------------------------------ "
(
    cd src/backend || exit 1
    if [ ! -d "node_modules" ]; then
        echo "Node modules not found. Installing dependencies..."
        npm install
    fi

    # Start NestJS in FOREGROUND, logs go to terminal
    npm run start:dev
)

# Removed background execution, PID saving, sleep, verification, and tail -f log
ic

echo "Backend process stopped." # This will only be reached if npm run start:dev
 exits 