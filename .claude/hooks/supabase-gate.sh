#!/bin/bash
# Supabase Gate Hook
# Reminds Claude to verify database types before editing database-related files

# Read the tool input from stdin
INPUT=$(cat)

# Extract file path from the JSON input
FILE_PATH=$(echo "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/')

# If no file_path found, exit silently
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Patterns that indicate database-related files
DB_PATTERNS=(
  "api/.*route\.ts"
  "hooks/use-.*\.ts"
  "services/.*\.ts"
  "lib/supabase"
  "lib/db"
  "migrations/"
  "database\.types\.ts"
)

# Check if file matches any database pattern
MATCHES_DB=false
for pattern in "${DB_PATTERNS[@]}"; do
  if echo "$FILE_PATH" | grep -qE "$pattern"; then
    MATCHES_DB=true
    break
  fi
done

# If it's a database-related file, output reminder
if [ "$MATCHES_DB" = true ]; then
  echo "SUPABASE GATE REMINDER: You are editing a database-related file."
  echo "Have you run 'npm run db:types' and read the generated types?"
  echo "If not, do so BEFORE making changes to avoid schema mismatches."
fi

# Always exit 0 to allow the operation (hook is advisory, not blocking)
exit 0
