#!/bin/bash

cd "$(dirname "$0")"   # ensure we're in the script's folder

# Load nvm so npm/node are available when launched from Finder
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

npm install

# Start server in background, capture its PID
npm start &
SERVER_PID=$!

# When this script exits (window closed, Ctrl+C, etc.), kill the server
trap "kill $SERVER_PID 2>/dev/null" EXIT

# Wait for server to be ready
echo "Starting server..."
until curl -s http://localhost:3000 > /dev/null; do
  sleep 0.5
done

open http://localhost:3000

# Keep the script alive (so the trap fires on window close)
wait $SERVER_PID