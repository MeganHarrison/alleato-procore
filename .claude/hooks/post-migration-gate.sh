#!/bin/bash
# POST-TOOL-USE HOOK: Invalidate types after any migration-related tool use
#
# This hook runs AFTER tool execution completes.
# If a migration was applied (via MCP, CLI, or SQL), it invalidates the
# schema gate so types must be regenerated before more DB code is written.

GATE_STATE_DIR="/tmp/claude-gates-alleato"
TOOL_NAME="${CLAUDE_TOOL_NAME:-unknown}"

# Read tool input from stdin
INPUT=$(cat)

# Check if this was a migration-related MCP tool
case "$TOOL_NAME" in
    mcp__supabase__apply_migration|mcp__supabase__execute_sql)
        # Invalidate all gate state - schema has changed
        rm -f "$GATE_STATE_DIR/types_fresh"
        rm -f "$GATE_STATE_DIR/types_read"
        rm -f "$GATE_STATE_DIR/schema_confirmed"

        echo ""
        echo "╔══════════════════════════════════════════════════════╗"
        echo "║  SCHEMA CHANGED - Types Invalidated                 ║"
        echo "╠══════════════════════════════════════════════════════╣"
        echo "║                                                      ║"
        echo "║  A database migration or SQL was executed.           ║"
        echo "║  Types are now STALE.                                ║"
        echo "║                                                      ║"
        echo "║  Before writing any database code, you MUST:         ║"
        echo "║  1. npm run db:types (regenerate types)              ║"
        echo "║  2. Read database.types.ts (verify schema)           ║"
        echo "║  3. Confirm schema (echo 'confirmed' > gate file)    ║"
        echo "╚══════════════════════════════════════════════════════╝"
        echo ""
        ;;
esac

# Always exit 0 - PostToolUse hooks should not block
exit 0
