#!/bin/bash
set -e

# Use PORT env var from Render, default to 8000 for local
PORT=${PORT:-8000}

echo "Starting uvicorn on port $PORT..."
exec uvicorn src.api.main:app --host 0.0.0.0 --port "$PORT"
