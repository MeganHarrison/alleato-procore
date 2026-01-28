#!/bin/bash
# ENFORCEMENT HOOKS - These actually BLOCK operations when rules are violated
#
# Exit codes:
#   0 = Allow operation
#   1 = Block operation (Claude will see the error message)
#
# GATE SYSTEM:
#   1. Types must be FRESH (regenerated within this session)
#   2. Types must be READ after regeneration
#   3. Schema CONFIRMATION must exist (Claude explicitly confirmed types match)
#   4. Only then can database-related files be edited

set -e

# Configuration
GATE_STATE_DIR="/tmp/claude-gates-alleato"
TYPES_FILE="/Users/meganharrison/Documents/github/alleato-procore/frontend/src/types/database.types.ts"
PROJECT_ROOT="/Users/meganharrison/Documents/github/alleato-procore"

# Ensure state directory exists
mkdir -p "$GATE_STATE_DIR" 2>/dev/null || true

# Clear state if it's more than 4 hours old (new session)
if [ -f "$GATE_STATE_DIR/session_start" ]; then
    if [ "$(find "$GATE_STATE_DIR/session_start" -mmin +240 2>/dev/null)" ]; then
        rm -f "$GATE_STATE_DIR"/*
        touch "$GATE_STATE_DIR/session_start"
    fi
else
    touch "$GATE_STATE_DIR/session_start"
fi

# Read tool input from stdin
INPUT=$(cat)

# Extract tool name from environment or input
TOOL_NAME="${CLAUDE_TOOL_NAME:-unknown}"

# ============================================================================
# DATABASE FILE DETECTION
# ============================================================================
is_database_file() {
    local file_path="$1"

    # Patterns that indicate database-related files
    local db_patterns=(
        "api/.*route\.ts"
        "hooks/use-.*\.ts"
        "services/.*Service\.ts"
        "services/.*service\.ts"
        "lib/supabase"
        "lib/db"
        "lib/schemas"
        "scheduling"
        "\.sql$"
        "types/database"
    )

    for pattern in "${db_patterns[@]}"; do
        if echo "$file_path" | grep -qE "$pattern"; then
            return 0
        fi
    done
    return 1
}

# ============================================================================
# SUPABASE GATE ENFORCEMENT (3-STEP VERIFICATION)
# ============================================================================
check_supabase_gate() {
    local file_path="$1"

    if ! is_database_file "$file_path"; then
        return 0
    fi

    # Allow editing database.types.ts itself (it's the output of type generation)
    if echo "$file_path" | grep -q "types/database.types.ts"; then
        return 0
    fi

    # Allow editing scaffold templates
    if echo "$file_path" | grep -q "\.claude/scaffolds"; then
        return 0
    fi

    local types_fresh="$GATE_STATE_DIR/types_fresh"
    local types_read="$GATE_STATE_DIR/types_read"
    local schema_confirmed="$GATE_STATE_DIR/schema_confirmed"

    # STEP 1: Check if types were regenerated this session
    if [ ! -f "$types_fresh" ]; then
        echo ""
        echo "╔══════════════════════════════════════════════════════╗"
        echo "║      SUPABASE GATE - STEP 1/3 BLOCKED              ║"
        echo "╠══════════════════════════════════════════════════════╣"
        echo "║                                                      ║"
        echo "║  You are editing: $(basename "$file_path")"
        echo "║  This is a database-related file.                    ║"
        echo "║                                                      ║"
        echo "║  REQUIRED: Regenerate types first:                   ║"
        echo "║                                                      ║"
        echo "║  npx supabase gen types typescript \                  ║"
        echo "║    --project-id \"lgveqfnpkxvzbnnwuled\" \             ║"
        echo "║    --schema public > $TYPES_FILE                     ║"
        echo "║                                                      ║"
        echo "║  Or: npm run db:types (from frontend dir)            ║"
        echo "║                                                      ║"
        echo "║  WHY: Stale types caused the 2026-01-28 incident     ║"
        echo "║  where UUID/INTEGER mismatch broke all queries.      ║"
        echo "║                                                      ║"
        echo "║  Progress: [ ] Generate types                        ║"
        echo "║            [ ] Read database.types.ts                ║"
        echo "║            [ ] Confirm schema matches                ║"
        echo "╚══════════════════════════════════════════════════════╝"
        echo ""
        return 1
    fi

    # STEP 2: Check if types were read after regeneration
    if [ ! -f "$types_read" ]; then
        echo ""
        echo "╔══════════════════════════════════════════════════════╗"
        echo "║      SUPABASE GATE - STEP 2/3 BLOCKED              ║"
        echo "╠══════════════════════════════════════════════════════╣"
        echo "║                                                      ║"
        echo "║  Types were regenerated. Now READ them:              ║"
        echo "║                                                      ║"
        echo "║  Read: frontend/src/types/database.types.ts          ║"
        echo "║                                                      ║"
        echo "║  Look for:                                           ║"
        echo "║  - Table names you'll use                            ║"
        echo "║  - Column names and types                            ║"
        echo "║  - FK column types match PK types                    ║"
        echo "║    (projects.id = INTEGER, not UUID!)                ║"
        echo "║                                                      ║"
        echo "║  Progress: [x] Generate types                        ║"
        echo "║            [ ] Read database.types.ts                ║"
        echo "║            [ ] Confirm schema matches                ║"
        echo "╚══════════════════════════════════════════════════════╝"
        echo ""
        return 1
    fi

    # STEP 3: Check if schema was confirmed
    if [ ! -f "$schema_confirmed" ]; then
        echo ""
        echo "╔══════════════════════════════════════════════════════╗"
        echo "║      SUPABASE GATE - STEP 3/3 BLOCKED              ║"
        echo "╠══════════════════════════════════════════════════════╣"
        echo "║                                                      ║"
        echo "║  Types read. Now CONFIRM the schema by writing       ║"
        echo "║  a confirmation file. Run this bash command:         ║"
        echo "║                                                      ║"
        echo "║  echo 'confirmed' > /tmp/claude-gates-alleato/schema_confirmed"
        echo "║                                                      ║"
        echo "║  BEFORE confirming, verify:                          ║"
        echo "║  - Tables you need exist in the types                ║"
        echo "║  - Column names are correct                          ║"
        echo "║  - FK types: projects.id is INTEGER (not UUID)       ║"
        echo "║  - No type mismatches between related tables         ║"
        echo "║                                                      ║"
        echo "║  Progress: [x] Generate types                        ║"
        echo "║            [x] Read database.types.ts                ║"
        echo "║            [ ] Confirm schema matches                ║"
        echo "╚══════════════════════════════════════════════════════╝"
        echo ""
        return 1
    fi

    # All 3 steps complete - allow edit
    return 0
}

# ============================================================================
# TRACK TYPE GENERATION
# ============================================================================
track_type_generation() {
    local command="$1"

    # Detect type generation commands
    if echo "$command" | grep -qE "supabase gen types|db:types|gen types typescript"; then
        mkdir -p "$GATE_STATE_DIR" 2>/dev/null || true
        touch "$GATE_STATE_DIR/types_fresh"
        # Reset read and confirmation (must re-verify after fresh generation)
        rm -f "$GATE_STATE_DIR/types_read"
        rm -f "$GATE_STATE_DIR/schema_confirmed"
        echo "GATE: Types regenerated - Step 1/3 complete. Now read database.types.ts."
    fi

    # Detect schema confirmation command
    if echo "$command" | grep -q "schema_confirmed"; then
        # This is the confirmation command itself, allow it
        return 0
    fi
}

# ============================================================================
# TRACK READ OPERATIONS
# ============================================================================
track_read() {
    local file_path="$1"

    # If reading database.types.ts after types were freshly generated
    if echo "$file_path" | grep -q "database.types.ts"; then
        if [ -f "$GATE_STATE_DIR/types_fresh" ]; then
            touch "$GATE_STATE_DIR/types_read"
            echo "GATE: database.types.ts read - Step 2/3 complete. Now confirm schema matches by running:"
            echo "  echo 'confirmed' > /tmp/claude-gates-alleato/schema_confirmed"
        else
            echo "GATE: database.types.ts read, but types may be stale. Regenerate with: npm run db:types"
        fi
    fi
}

# ============================================================================
# BASH COMMAND VALIDATION
# ============================================================================
check_bash_command() {
    local command="$1"

    # Track type generation and confirmation
    track_type_generation "$command"

    # Block cd && chains (don't work reliably in zsh)
    if echo "$command" | grep -qE "^cd [^;|&]+ &&"; then
        echo ""
        echo "╔══════════════════════════════════════════════════════╗"
        echo "║      BASH PATTERN VIOLATION - BLOCKED               ║"
        echo "╠══════════════════════════════════════════════════════╣"
        echo "║                                                      ║"
        echo "║  Command: $command"
        echo "║                                                      ║"
        echo "║  'cd X && command' chains don't work in zsh.         ║"
        echo "║  Use absolute paths instead.                         ║"
        echo "║                                                      ║"
        echo "║  WRONG:  cd frontend && npm run test                 ║"
        echo "║  RIGHT:  npm run test --prefix /full/path/frontend   ║"
        echo "╚══════════════════════════════════════════════════════╝"
        echo ""
        return 1
    fi

    # Warn about relative path redirects
    if echo "$command" | grep -qE "> [^/].*\.(ts|js|json|md)"; then
        echo ""
        echo "WARNING: Relative path in redirect. Use absolute paths."
        echo ""
    fi

    return 0
}

# ============================================================================
# MIGRATION GATE - Block migrations without fresh types afterward
# ============================================================================
track_migration() {
    local command="$1"

    # If applying a migration, invalidate types (they'll be stale)
    if echo "$command" | grep -qE "apply_migration|supabase db push|\.sql"; then
        rm -f "$GATE_STATE_DIR/types_fresh"
        rm -f "$GATE_STATE_DIR/types_read"
        rm -f "$GATE_STATE_DIR/schema_confirmed"
        echo "GATE: Migration detected - types invalidated. Regenerate with: npm run db:types"
    fi
}

# ============================================================================
# MAIN DISPATCH
# ============================================================================
case "$TOOL_NAME" in
    "Read")
        # Extract file_path and track reads
        FILE_PATH=$(echo "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/')
        if [ -n "$FILE_PATH" ]; then
            track_read "$FILE_PATH"
        fi
        exit 0
        ;;

    "Edit"|"Write")
        # Extract file_path and check Supabase gate
        FILE_PATH=$(echo "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/')
        if [ -n "$FILE_PATH" ]; then
            if ! check_supabase_gate "$FILE_PATH"; then
                exit 1
            fi
        fi
        exit 0
        ;;

    "Bash")
        # Extract command and validate
        COMMAND=$(echo "$INPUT" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/"command"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/')
        if [ -n "$COMMAND" ]; then
            COMMAND=$(echo "$COMMAND" | sed 's/\\"/"/g' | sed "s/\\\\'/'/g")
            track_migration "$COMMAND"
            if ! check_bash_command "$COMMAND"; then
                exit 1
            fi
        fi
        exit 0
        ;;

    *)
        # Unknown tool, allow
        exit 0
        ;;
esac
