#!/bin/bash
# Check for Next.js dynamic route conflicts
# This script ensures consistent naming of dynamic route parameters

echo "Checking for dynamic route conflicts..."

# Find all dynamic route directories
ROUTES=$(find frontend/src/app -type d -name "[*]" 2>/dev/null | sort)

# Group by parent directory
declare -A PARENTS

for route in $ROUTES; do
  parent=$(dirname "$route")
  param=$(basename "$route")

  if [ -n "${PARENTS[$parent]}" ] && [ "${PARENTS[$parent]}" != "$param" ]; then
    echo "❌ CONFLICT DETECTED:"
    echo "   Parent: $parent"
    echo "   Params: ${PARENTS[$parent]},$param"
    echo "   [Error: You cannot use different slug names for the same dynamic path]"
    exit 1
  fi

  PARENTS[$parent]="$param"
done

echo "✅ No route conflicts found"
exit 0
