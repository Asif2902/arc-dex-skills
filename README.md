# Arc DEX Skills

Two independent skills for building a **Uniswap V2-style DEX on Arc**. Each is its own folder in `skills/` with a `SKILL.md` (the open Agent Skills format).

| Skill | What it does |
|---|---|
| [`skills/arc-dex-frontend`](skills/arc-dex-frontend) | dApp rules and code: no WETH/WUSDC, USDC at 6 decimals, token ordering without flipping the UI, user liquidity loading, USDC gas buffer on Max, approvals, pools page. |
| [`skills/arc-dex-subgraph`](skills/arc-dex-subgraph) | A ready subgraph template (The Graph / Goldsky): one query for a user's LP positions, one for all pools. |

## Install with npx (no clone)

Replace `YOUR-USERNAME` with your GitHub username.

```bash
npx github:YOUR-USERNAME/arc-dex-skills                 # auto-detects all installed AI CLIs + ~/.agents/skills
npx github:YOUR-USERNAME/arc-dex-skills --all           # install into all supported global CLI folders
npx github:YOUR-USERNAME/arc-dex-skills --claude        # Claude Code (also: --codex --gemini --antigravity --opencode --grok)
npx github:YOUR-USERNAME/arc-dex-skills --cursor        # Cursor (also: --copilot --windsurf --cline --roo --kiro --amp --goose)
npx github:YOUR-USERNAME/arc-dex-skills --project       # this project only (./.agents/skills & ./.claude/skills)
npx github:YOUR-USERNAME/arc-dex-skills --grok-project  # tool-specific project folder (any --<tool>-project works)
npx github:YOUR-USERNAME/arc-dex-skills --dir PATH      # any custom folder a tool reads skills from
npx github:YOUR-USERNAME/arc-dex-skills --agents-md     # copies skills to ./.ai-skills and adds a pointer to ./AGENTS.md
npx github:YOUR-USERNAME/arc-dex-skills --remove        # uninstall (combine with any flags above)
```
Re-running replaces older copies. `--list` shows the skills; `--help` shows every option.

Also compatible with the standard `skills` CLI:
```bash
npx skills add YOUR-USERNAME/arc-dex-skills
```

### Shorter command: publish to npm (optional)
```bash
npm login
npm publish --access public
```
Then anyone runs `npx arc-dex-skills`. If the name `arc-dex-skills` is taken, change `"name"` in `package.json` to `@YOUR-NPM-USERNAME/arc-dex-skills` and run `npx @YOUR-NPM-USERNAME/arc-dex-skills`.

### Without Node
Unzip the repo and run `bash install.sh` (Mac/Linux) or `.\install.ps1` (Windows). They take the same options (`--all`, `--claude`, `--gemini`, `--antigravity`, `--grok`, `--cursor`, ...).

### Where each tool reads skills
| Tool | Global Folder | Project Folder | Flag |
|---|---|---|---|
| Claude Code | `~/.claude/skills/` | `./.claude/skills/` | `--claude` / `--claude-project` |
| Codex CLI | `~/.codex/skills/` | `./.codex/skills/` | `--codex` / `--codex-project` |
| Gemini CLI | `~/.gemini/skills/` | `./.gemini/skills/` | `--gemini` / `--gemini-project` |
| Antigravity (`agy`) | `~/.gemini/config/skills/` & `~/.gemini/antigravity/skills/` | `./.agents/skills/` | `--antigravity` / `--agy` |
| opencode | `~/.config/opencode/skills/` | `./.opencode/skills/` | `--opencode` / `--opencode-project` |
| Grok Build | `~/.grok/skills/` | `./.grok/skills/` | `--grok` / `--grok-project` |
| Cursor | `~/.cursor/skills/` | `./.cursor/skills/` | `--cursor` / `--cursor-project` |
| GitHub Copilot | `~/.copilot/skills/` | `./.github/skills/` | `--copilot` / `--copilot-project` |
| Windsurf | `~/.codeium/windsurf/skills/` | `./.windsurf/skills/` | `--windsurf` / `--windsurf-project` |
| Cline | `~/.cline/skills/` | `./.cline/skills/` | `--cline` / `--cline-project` |
| Roo Code | `~/.roo/skills/` | `./.roo/skills/` | `--roo` / `--roo-project` |
| Kiro | `~/.kiro/skills/` | `./.kiro/skills/` | `--kiro` / `--kiro-project` |
| Amp | `~/.config/agents/skills/` | `./.agents/skills/` | `--amp` / `--amp-project` |
| Goose | `~/.config/goose/skills/` | `./.goose/skills/` | `--goose` / `--goose-project` |
| Universal Agent Skills | `~/.agents/skills/` | `./.agents/skills/` | `--agents` / `--agents-project` |
| Claude app (claude.ai, desktop, mobile) | upload in skills settings | — | use the zips in `dist/` (one skill per zip) |
| Any `AGENTS.md` tool | — | `./.ai-skills/` + `./AGENTS.md` | `--agents-md` |

If your tool keeps skills somewhere else, use `--dir <path>`.

### Claude Code plugin (optional)
After pushing this repo to GitHub:
```
/plugin marketplace add <your-github-username>/arc-dex-skills
/plugin install arc-dex-skills@arc-dex-skills
```

## Put it on GitHub first (no command line needed)
1. Sign in at github.com, click **+** (top right) → **New repository**.
2. Name it `arc-dex-skills`, choose **Public**, click **Create repository**.
3. Unzip `arc-dex-skills.zip`. On the new repo page click **uploading an existing file**, then drag in everything **inside** the unzipped folder (not the folder itself). Click **Commit changes**.
   - **Make sure `package.json`, `bin/` and `skills/` are uploaded.** `npx` needs them. Hidden files like `.claude-plugin` are optional.

Or with the GitHub CLI: run `bash publish.sh` inside the unzipped folder.

## Notes
- Arc facts come from Arc's public docs: chain IDs 5042 / 5042002, USDC ERC-20 interface `0x3600…0000`, 6 decimals. Re-verify before production.
- The subgraph template has not been compiled. Run `npm i && npx graph codegen && npx graph build` first. Confirm Arc's network name with your indexer host.
