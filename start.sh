#!/bin/bash
echo "Starting the WebRTC Object Detection application..."

# Default mode is wasm, as it's the low-resource path
export MODE=${MODE:-wasm}

echo "Running in MODE=$MODE"

# Add logic here to switch between wasm and server configs if needed.
# For this example, both modes use the same docker-compose setup.

docker-compose up --build -d

echo "Application started."
echo "Open http://localhost:3000 on your laptop."