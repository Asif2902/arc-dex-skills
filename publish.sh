#!/usr/bin/env bash
# One-time publish: creates a public GitHub repo "arc-dex-skills" from this folder and pushes it.
# Needs the GitHub CLI (https://cli.github.com). Run from inside this folder.
set -e
gh auth status >/dev/null 2>&1 || gh auth login
git init -b main
git add .
git commit -m "Add Arc DEX frontend and subgraph skills"
gh repo create arc-dex-skills --public --source=. --remote=origin --push
USER_NAME=$(gh api user -q .login)
echo
echo "Published: https://github.com/$USER_NAME/arc-dex-skills"
echo "Claude Code install:"
echo "  /plugin marketplace add $USER_NAME/arc-dex-skills"
echo "  /plugin install arc-dex-skills@arc-dex-skills"
