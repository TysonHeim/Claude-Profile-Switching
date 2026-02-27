#!/bin/bash
set -e

# Claude Profile Switching — Installer
# Sets up directories and copies the activator script into ~/.claude

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_DIR="$HOME/.claude"

echo "=== Claude Profile Switching — Setup ==="
echo ""

# Create target directories if missing
for dir in skills agents commands; do
  target="$CLAUDE_DIR/$dir"
  if [ ! -d "$target" ]; then
    mkdir -p "$target"
    echo "  Created $target"
  else
    echo "  OK $target"
  fi
done

# Copy activate-profile.js into ~/.claude (backup existing)
if [ -f "$CLAUDE_DIR/activate-profile.js" ]; then
  cp "$CLAUDE_DIR/activate-profile.js" "$CLAUDE_DIR/activate-profile.js.bak"
  echo "  Backed up existing activate-profile.js → activate-profile.js.bak"
fi
cp "$SCRIPT_DIR/activate-profile.js" "$CLAUDE_DIR/activate-profile.js"
echo "  Installed activate-profile.js → $CLAUDE_DIR/"

echo ""
echo "Done! To activate a profile:"
echo ""
echo "  node ~/.claude/activate-profile.js <profile>"
echo ""
echo "Or run from this repo:"
echo ""
echo "  node activate-profile.js <profile>"
echo ""
