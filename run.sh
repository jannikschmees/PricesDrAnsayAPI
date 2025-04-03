#!/bin/bash

# Check if Python virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies if needed
pip install -r requirements.txt

# Check if the frontend node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Start the backend server in the background
echo "Starting backend server..."
python server.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start the frontend in the background
echo "Starting frontend..."
cd frontend && npm start &
FRONTEND_PID=$!

# Function to handle exit and cleanup
cleanup() {
    echo "Shutting down servers..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit 0
}

# Set up trap for SIGINT (Ctrl+C)
trap cleanup SIGINT

echo "Both servers are running. Press Ctrl+C to stop."

# Wait for user to press Ctrl+C
wait 