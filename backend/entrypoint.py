#!/usr/bin/env python3
import os
import sys

port = os.environ.get("PORT", "8000")
print(f"Starting uvicorn on port {port}...")
sys.stdout.flush()

os.execvp("uvicorn", [
    "uvicorn",
    "src.api.main:app",
    "--host", "0.0.0.0",
    "--port", port
])
