# Environment Variables Setup

## Overview

This project uses a **single, centralized `.env` file** located in the root directory to avoid confusion and ensure consistency across all Python scripts and services.

## File Locations

- **Primary**: `/alleato-procore/.env` (root directory)
- **Fallback**: `/alleato-procore/.env.local` (root directory)
- **DO NOT USE**: `python-backend/.env` (deprecated, removed)

## How It Works

All Python files use the centralized `env_loader.py` module to load environment variables:

```python
from env_loader import load_env

# Load from root .env file
load_env()
```

The `env_loader` module:
- Automatically finds the root `.env` file regardless of where the script is run from
- Ensures all scripts use the same environment configuration
- Provides helpful error messages if the `.env` file is missing
- Prevents duplicate loading with caching

## Usage in Python Scripts

### Basic Usage

```python
from env_loader import load_env
import os

# Load environment variables
load_env()

# Access variables
api_key = os.getenv("OPENAI_API_KEY")
supabase_url = os.getenv("SUPABASE_URL")
```

### Verify Required Variables

```python
from env_loader import load_env, verify_required_vars

load_env()

# Ensure critical variables are set
verify_required_vars("OPENAI_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_KEY")
```

### Force Reload

```python
from env_loader import load_env

# Force reload even if already loaded
load_env(force_reload=True)
```

## Benefits of Centralized Approach

1. **Single Source of Truth**: One `.env` file to manage
2. **No Path Confusion**: Scripts work from any directory
3. **Easier Onboarding**: New developers only need to configure one file
4. **Consistent Behavior**: All services use the same configuration
5. **Simpler Debugging**: No more "which .env is being loaded?"

## Migration Notes

### Old Pattern (Deprecated)
```python
from dotenv import load_dotenv
from pathlib import Path

# ❌ DON'T DO THIS - different scripts used different paths
env_path = Path(__file__).parent / '.env'
env_path = Path(__file__).parent.parent / '.env'
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(env_path)
```

### New Pattern (Recommended)
```python
from env_loader import load_env

# ✅ DO THIS - always loads from root
load_env()
```

## Files Updated

The following files have been updated to use the centralized loader:

- `python-backend/api.py`
- `python-backend/alleato_agent_workflow/alleato_agent_workflow.py`

## Remaining Scripts

Other scripts in `python-backend/scripts/` still use the old pattern but will be migrated gradually. They should continue to work as long as the root `.env` file exists.

## Troubleshooting

### Error: "No .env file found"

Make sure you have a `.env` file in the project root:
```bash
cp .env.local .env
```

### Warning: "OPENAI_API_KEY is not set"

This warning appeared before because scripts were looking for `.env` in the wrong location. With the centralized loader, this should be resolved.

### Server Not Picking Up Changes

If you update `.env` while the server is running:
1. The server with `--reload` will automatically restart when Python files change
2. For `.env` changes, you may need to manually restart the server:
   ```bash
   # Kill the server (Ctrl+C or kill PID)
   # Restart it
   cd python-backend
   source venv/bin/activate
   python -m uvicorn api:app --reload --port 8000
   ```

## Required Environment Variables

The following variables must be set in the root `.env` file:

### OpenAI
- `OPENAI_API_KEY` - OpenAI API key for agents and embeddings

### Supabase
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `SUPABASE_ANON_KEY` - Supabase anonymous key

### Optional
- `LANGFUSE_PUBLIC_KEY` - LangFuse public key for tracing
- `LANGFUSE_SECRET_KEY` - LangFuse secret key
- `LANGFUSE_HOST` - LangFuse host URL

See `.env.local` or `.env` for the complete list of variables.
