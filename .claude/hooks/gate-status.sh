#!/bin/bash
# Show current state of all gates
# Usage: bash .claude/hooks/gate-status.sh

GATE_STATE_DIR="/tmp/claude-gates-alleato"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║             SUPABASE GATE STATUS                    ║"
echo "╠══════════════════════════════════════════════════════╣"

# Step 1: Types Fresh
if [ -f "$GATE_STATE_DIR/types_fresh" ]; then
    FRESH_TIME=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$GATE_STATE_DIR/types_fresh" 2>/dev/null || stat -c "%y" "$GATE_STATE_DIR/types_fresh" 2>/dev/null | cut -c1-16)
    echo "║  [x] Step 1: Types generated ($FRESH_TIME)"
else
    echo "║  [ ] Step 1: Types NOT generated"
fi

# Step 2: Types Read
if [ -f "$GATE_STATE_DIR/types_read" ]; then
    READ_TIME=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$GATE_STATE_DIR/types_read" 2>/dev/null || stat -c "%y" "$GATE_STATE_DIR/types_read" 2>/dev/null | cut -c1-16)
    echo "║  [x] Step 2: Types read ($READ_TIME)"
else
    echo "║  [ ] Step 2: Types NOT read"
fi

# Step 3: Schema Confirmed
if [ -f "$GATE_STATE_DIR/schema_confirmed" ]; then
    CONF_TIME=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$GATE_STATE_DIR/schema_confirmed" 2>/dev/null || stat -c "%y" "$GATE_STATE_DIR/schema_confirmed" 2>/dev/null | cut -c1-16)
    echo "║  [x] Step 3: Schema confirmed ($CONF_TIME)"
else
    echo "║  [ ] Step 3: Schema NOT confirmed"
fi

echo "║                                                      ║"

# Overall status
if [ -f "$GATE_STATE_DIR/types_fresh" ] && [ -f "$GATE_STATE_DIR/types_read" ] && [ -f "$GATE_STATE_DIR/schema_confirmed" ]; then
    echo "║  STATUS: UNLOCKED - Database edits allowed          ║"
else
    echo "║  STATUS: LOCKED - Database edits blocked            ║"
fi

echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Session info
if [ -f "$GATE_STATE_DIR/session_start" ]; then
    SESSION_TIME=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$GATE_STATE_DIR/session_start" 2>/dev/null || stat -c "%y" "$GATE_STATE_DIR/session_start" 2>/dev/null | cut -c1-16)
    echo "Session started: $SESSION_TIME"
fi

echo "State dir: $GATE_STATE_DIR"
echo ""
echo "To reset gates: rm -rf /tmp/claude-gates-alleato"
echo ""
