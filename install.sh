#!/usr/bin/env bash
# Installs the skills in ./skills into AI coding tools. Safe to re-run (it replaces older copies).
#
#   bash install.sh                 auto-detect: installs for every tool found on this machine
#   bash install.sh --all           installs into all supported global CLI skill folders
#   bash install.sh --claude        ~/.claude/skills                                      (Claude Code)
#   bash install.sh --codex         ~/.codex/skills                                       (OpenAI Codex CLI)
#   bash install.sh --gemini        ~/.gemini/skills                                      (Gemini CLI)
#   bash install.sh --antigravity   ~/.gemini/config/skills & ~/.gemini/antigravity/skills (Antigravity)
#   bash install.sh --opencode      ~/.config/opencode/skills                             (opencode)
#   bash install.sh --grok          ~/.grok/skills                                        (Grok Build)
#   bash install.sh --cursor        ~/.cursor/skills                                      (Cursor)
#   bash install.sh --copilot       ~/.copilot/skills                                     (GitHub Copilot)
#   bash install.sh --windsurf      ~/.codeium/windsurf/skills                            (Windsurf)
#   bash install.sh --cline         ~/.cline/skills                                       (Cline)
#   bash install.sh --roo           ~/.roo/skills                                         (Roo Code)
#   bash install.sh --kiro          ~/.kiro/skills                                        (Kiro)
#   bash install.sh --amp           ~/.config/agents/skills                               (Amp)
#   bash install.sh --goose         ~/.config/goose/skills                                (Goose)
#   bash install.sh --agents        ~/.agents/skills                                      (Universal .agents/skills)
#   bash install.sh --project       ./.agents/skills & ./.claude/skills                   (this project)
#   bash install.sh --grok-project  ./.grok/skills                                        (Grok Build, this project)
#   bash install.sh --dir PATH      any folder a tool reads skills from
#   bash install.sh --agents-md     copies skills to ./.ai-skills and adds a pointer block to ./AGENTS.md
#   bash install.sh --remove        remove skills instead of installing
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if command -v node >/dev/null 2>&1 && [ -f "$ROOT_DIR/bin/cli.js" ]; then
  exec node "$ROOT_DIR/bin/cli.js" "$@"
fi

SRC="$ROOT_DIR/skills"
[ -d "$SRC" ] || { echo "skills/ folder not found next to install.sh"; exit 1; }

XDG_CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}"
CLAUDE_HOME="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
REMOVE=0

run_to() {
  local dest="$1"
  if [ "$REMOVE" -eq 1 ]; then
    for s in "$SRC"/*/; do
      local name; name="$(basename "$s")"
      if [ -d "${dest:?}/$name" ]; then
        rm -rf "${dest:?}/$name"
        echo "  removed $dest/$name"
      fi
    done
  else
    mkdir -p "$dest"
    for s in "$SRC"/*/; do
      local name; name="$(basename "$s")"
      rm -rf "${dest:?}/$name"
      cp -R "$s" "$dest/$name"
      echo "  installed $name -> $dest/$name"
    done
  fi
}

agents_md() {
  local dest="./.ai-skills" file="./AGENTS.md"
  echo "Project install (AGENTS.md):"
  run_to "$dest"
  if [ "$REMOVE" -eq 1 ]; then
    return
  fi
  if [ -f "$file" ] && grep -q "arc-dex-skills:begin" "$file"; then
    echo "  AGENTS.md already has the pointer block"
    return
  fi
  {
    echo ""
    echo "<!-- arc-dex-skills:begin -->"
    echo "## Arc DEX skills"
    echo "Before working on the DEX frontend (swap, liquidity, pools page, approvals, token selector), read \`.ai-skills/arc-dex-frontend/SKILL.md\` and follow it."
    echo "Before building or changing the subgraph (indexing, pools list, user positions), read \`.ai-skills/arc-dex-subgraph/SKILL.md\` and use its \`template/\`."
    echo "<!-- arc-dex-skills:end -->"
  } >> "$file"
  echo "  added pointer block to $file"
}

ARGS=()
for arg in "$@"; do
  if [ "$arg" = "--remove" ] || [ "$arg" = "remove" ] || [ "$arg" = "uninstall" ]; then
    REMOVE=1
  else
    ARGS+=("$arg")
  fi
done

if [ ${#ARGS[@]} -eq 0 ]; then
  [ -d "$CLAUDE_HOME" ] && { echo "Claude Code:"; run_to "$CLAUDE_HOME/skills"; }
  [ -d "$CODEX_HOME" ] && { echo "Codex CLI:"; run_to "$CODEX_HOME/skills"; }
  [ -d "$HOME/.gemini" ] && {
    echo "Gemini CLI:"; run_to "$HOME/.gemini/skills"
    echo "Antigravity:"; run_to "$HOME/.gemini/config/skills"; run_to "$HOME/.gemini/antigravity/skills"
  }
  [ -d "$XDG_CONFIG/opencode" ] && { echo "opencode:"; run_to "$XDG_CONFIG/opencode/skills"; }
  [ -d "$HOME/.grok" ] && { echo "Grok Build:"; run_to "$HOME/.grok/skills"; }
  [ -d "$HOME/.cursor" ] && { echo "Cursor:"; run_to "$HOME/.cursor/skills"; }
  [ -d "$HOME/.copilot" ] && { echo "GitHub Copilot:"; run_to "$HOME/.copilot/skills"; }
  [ -d "$HOME/.codeium/windsurf" ] && { echo "Windsurf:"; run_to "$HOME/.codeium/windsurf/skills"; }
  [ -d "$HOME/.cline" ] && { echo "Cline:"; run_to "$HOME/.cline/skills"; }
  [ -d "$HOME/.roo" ] && { echo "Roo Code:"; run_to "$HOME/.roo/skills"; }
  [ -d "$HOME/.kiro" ] && { echo "Kiro:"; run_to "$HOME/.kiro/skills"; }
  [ -d "$XDG_CONFIG/amp" ] && { echo "Amp:"; run_to "$XDG_CONFIG/agents/skills"; }
  [ -d "$XDG_CONFIG/goose" ] && { echo "Goose:"; run_to "$XDG_CONFIG/goose/skills"; }
  echo "Universal (.agents/skills):"; run_to "$HOME/.agents/skills"
  exit 0
fi

set -- "${ARGS[@]}"
while [ $# -gt 0 ]; do
  case "$1" in
    --all)
      echo "Claude Code:"; run_to "$CLAUDE_HOME/skills"
      echo "Codex CLI:"; run_to "$CODEX_HOME/skills"
      echo "Gemini CLI:"; run_to "$HOME/.gemini/skills"
      echo "Antigravity:"; run_to "$HOME/.gemini/config/skills"; run_to "$HOME/.gemini/antigravity/skills"
      echo "opencode:"; run_to "$XDG_CONFIG/opencode/skills"
      echo "Grok Build:"; run_to "$HOME/.grok/skills"
      echo "Cursor:"; run_to "$HOME/.cursor/skills"
      echo "GitHub Copilot:"; run_to "$HOME/.copilot/skills"
      echo "Windsurf:"; run_to "$HOME/.codeium/windsurf/skills"
      echo "Cline:"; run_to "$HOME/.cline/skills"
      echo "Roo Code:"; run_to "$HOME/.roo/skills"
      echo "Kiro:"; run_to "$HOME/.kiro/skills"
      echo "Amp:"; run_to "$XDG_CONFIG/agents/skills"
      echo "Goose:"; run_to "$XDG_CONFIG/goose/skills"
      echo "Universal (.agents/skills):"; run_to "$HOME/.agents/skills"
      ;;
    --claude|--claude-code)       echo "Claude Code:"; run_to "$CLAUDE_HOME/skills" ;;
    --codex|--openai-codex)       echo "Codex CLI:"; run_to "$CODEX_HOME/skills" ;;
    --gemini|--gemini-cli)        echo "Gemini CLI:"; run_to "$HOME/.gemini/skills" ;;
    --antigravity|--agy)          echo "Antigravity:"; run_to "$HOME/.gemini/config/skills"; run_to "$HOME/.gemini/antigravity/skills" ;;
    --opencode)                   echo "opencode:"; run_to "$XDG_CONFIG/opencode/skills" ;;
    --grok|--grok-build)          echo "Grok Build:"; run_to "$HOME/.grok/skills" ;;
    --cursor|--cursor-cli)        echo "Cursor:"; run_to "$HOME/.cursor/skills" ;;
    --copilot|--github-copilot)   echo "GitHub Copilot:"; run_to "$HOME/.copilot/skills" ;;
    --windsurf|--codeium)         echo "Windsurf:"; run_to "$HOME/.codeium/windsurf/skills" ;;
    --cline)                      echo "Cline:"; run_to "$HOME/.cline/skills" ;;
    --roo|--roo-code)             echo "Roo Code:"; run_to "$HOME/.roo/skills" ;;
    --kiro|--kiro-cli)            echo "Kiro:"; run_to "$HOME/.kiro/skills" ;;
    --amp)                        echo "Amp:"; run_to "$XDG_CONFIG/agents/skills" ;;
    --goose)                      echo "Goose:"; run_to "$XDG_CONFIG/goose/skills" ;;
    --agents|--universal)         echo "Universal (.agents/skills):"; run_to "$HOME/.agents/skills" ;;
    --project|-p)                 echo "Universal (.agents/skills, this project):"; run_to "./.agents/skills"; echo "Claude Code (this project):"; run_to "./.claude/skills" ;;
    --claude-project)             echo "Claude Code (this project):"; run_to "./.claude/skills" ;;
    --codex-project)              echo "Codex CLI (this project):"; run_to "./.codex/skills" ;;
    --gemini-project)             echo "Gemini CLI (this project):"; run_to "./.gemini/skills" ;;
    --antigravity-project|--agy-project|--agents-project) echo "Universal (.agents/skills, this project):"; run_to "./.agents/skills" ;;
    --opencode-project)           echo "opencode (this project):"; run_to "./.opencode/skills" ;;
    --grok-project)               echo "Grok Build (this project):"; run_to "./.grok/skills" ;;
    --cursor-project)             echo "Cursor (this project):"; run_to "./.cursor/skills" ;;
    --copilot-project)            echo "GitHub Copilot (this project):"; run_to "./.github/skills" ;;
    --windsurf-project)           echo "Windsurf (this project):"; run_to "./.windsurf/skills" ;;
    --cline-project)              echo "Cline (this project):"; run_to "./.cline/skills" ;;
    --roo-project)                echo "Roo Code (this project):"; run_to "./.roo/skills" ;;
    --kiro-project)               echo "Kiro (this project):"; run_to "./.kiro/skills" ;;
    --goose-project)              echo "Goose (this project):"; run_to "./.goose/skills" ;;
    --dir)                        shift; [ $# -gt 0 ] || { echo "--dir needs a path"; exit 1; }; echo "Custom folder:"; run_to "$1" ;;
    --agents-md)                  agents_md ;;
    --list|-l)                    for s in "$SRC"/*/; do basename "$s"; done; exit 0 ;;
    -h|--help)                    sed -n '2,25p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
  shift
done
