#!/bin/bash
# SessionStart hook (cloud sessions only): pnpm + Node LTS + deps for both apps.
# Idempotent: each step is skipped when already done.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME/bin:$PATH"

# --- pnpm: install via official script if missing or not the version pinned in packageManager ---
want_pnpm=$(sed -n 's/.*"packageManager": *"pnpm@\([^"]*\)".*/\1/p' three-001/package.json)
if [ "$(pnpm -v 2>/dev/null || true)" != "$want_pnpm" ]; then
  curl -fsSL https://get.pnpm.io | env PNPM_VERSION="$want_pnpm" sh -
fi

# --- Node LTS managed by pnpm (global) ---
if [ ! -x "$PNPM_HOME/bin/node" ]; then
  (cd "$HOME" && pnpm runtime set node lts -g -y)
fi

# --- Dependencies per app; re-install only when this script, manifest or lockfile changed ---
for app in three-001 babylon-001; do
  hashes="$app/node_modules/.session-start.sha256"
  if ! sha256sum --check --status "$hashes" 2>/dev/null; then
    rm -f "$hashes"
    (cd "$app" && pnpm install --frozen-lockfile)
    sha256sum .claude/hooks/session-start.sh "$app/package.json" "$app/pnpm-lock.yaml" > "$hashes" || rm -f "$hashes"
  fi
done

# --- Every session: put pnpm + its Node first on PATH ---
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export PNPM_HOME=\"$PNPM_HOME\"" >> "$CLAUDE_ENV_FILE"
  echo "export PATH=\"$PNPM_HOME/bin:\$PATH\"" >> "$CLAUDE_ENV_FILE"
fi
