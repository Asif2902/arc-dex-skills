# Arc DEX Skills

Two independent skills for building a **Uniswap V2-style DEX on Arc**. Each is its own folder in `skills/` with a `SKILL.md` (the open Agent Skills format).

| Skill | What it does |
|---|---|
| [`skills/arc-dex-frontend`](skills/arc-dex-frontend) | dApp rules and code: no WETH/WUSDC, USDC at 6 decimals, token ordering without flipping the UI, user liquidity loading, USDC gas buffer on Max, approvals, pools page. |
| [`skills/arc-dex-subgraph`](skills/arc-dex-subgraph) | A ready subgraph template (The Graph / Goldsky): one query for a user's LP positions, one for all pools. |

## Install with npx (no clone)

```bash
npx -y github:Asif2902/arc-dex-skills                 # auto-detects all installed AI CLIs + ~/.agents/skills
npx -y github:Asif2902/arc-dex-skills --grok          # Grok Build, all projects (~/.grok/skills)
npx -y github:Asif2902/arc-dex-skills --grok-project  # Grok Build, this project only (./.grok/skills)
npx -y github:Asif2902/arc-dex-skills --all           # install into all supported global CLI folders
npx -y github:Asif2902/arc-dex-skills --claude        # Claude Code (also: --codex --gemini --antigravity --opencode)
npx -y github:Asif2902/arc-dex-skills --cursor        # Cursor (also: --copilot --windsurf --cline --roo --kiro --amp --goose)
npx -y github:Asif2902/arc-dex-skills --project       # this project only (./.agents/skills & ./.claude/skills)
npx -y github:Asif2902/arc-dex-skills --dir PATH      # any custom folder a tool reads skills from
npx -y github:Asif2902/arc-dex-skills --agents-md     # copies skills to ./.ai-skills and adds a pointer to ./AGENTS.md
npx -y github:Asif2902/arc-dex-skills --remove --grok # uninstall (combine --remove with any flags above)
```
Re-running replaces older copies. `--list` shows the skills; `--help` shows every option.

Also compatible with the standard `skills` CLI:
```bash
npx skills add Asif2902/arc-dex-skills
```

### Shorter command: publish to npm (optional)
```bash
npm login
npm publish --access public
```
Then anyone runs `npx -y arc-dex-skills --grok`. If the name `arc-dex-skills` is taken, change `"name"` in `package.json` to `@YOUR-NPM-USERNAME/arc-dex-skills` and run `npx -y @YOUR-NPM-USERNAME/arc-dex-skills --grok`.

### Without Node
Unzip the repo and run `bash install.sh` (Mac/Linux) or `.\install.ps1` (Windows). They take the same options (`--grok`, `--all`, `--claude`, `--gemini`, `--antigravity`, `--cursor`, ...).

### Where each tool reads skills
| Tool | Global Folder | Project Folder | Command |
|---|---|---|---|
| Grok Build | `~/.grok/skills/` | `./.grok/skills/` | `npx -y github:Asif2902/arc-dex-skills --grok` / `--grok-project` |
| Claude Code | `~/.claude/skills/` | `./.claude/skills/` | `npx -y github:Asif2902/arc-dex-skills --claude` / `--claude-project` |
| Codex CLI | `~/.codex/skills/` | `./.codex/skills/` | `npx -y github:Asif2902/arc-dex-skills --codex` / `--codex-project` |
| Gemini CLI | `~/.gemini/skills/` | `./.gemini/skills/` | `npx -y github:Asif2902/arc-dex-skills --gemini` / `--gemini-project` |
| Antigravity (`agy`) | `~/.gemini/config/skills/` & `~/.gemini/antigravity/skills/` | `./.agents/skills/` | `npx -y github:Asif2902/arc-dex-skills --antigravity` / `--agy` |
| opencode | `~/.config/opencode/skills/` | `./.opencode/skills/` | `npx -y github:Asif2902/arc-dex-skills --opencode` / `--opencode-project` |
| Cursor | `~/.cursor/skills/` | `./.cursor/skills/` | `npx -y github:Asif2902/arc-dex-skills --cursor` / `--cursor-project` |
| GitHub Copilot | `~/.copilot/skills/` | `./.github/skills/` | `npx -y github:Asif2902/arc-dex-skills --copilot` / `--copilot-project` |
| Windsurf | `~/.codeium/windsurf/skills/` | `./.windsurf/skills/` | `npx -y github:Asif2902/arc-dex-skills --windsurf` / `--windsurf-project` |
| Cline | `~/.cline/skills/` | `./.cline/skills/` | `npx -y github:Asif2902/arc-dex-skills --cline` / `--cline-project` |
| Roo Code | `~/.roo/skills/` | `./.roo/skills/` | `npx -y github:Asif2902/arc-dex-skills --roo` / `--roo-project` |
| Kiro | `~/.kiro/skills/` | `./.kiro/skills/` | `npx -y github:Asif2902/arc-dex-skills --kiro` / `--kiro-project` |
| Amp | `~/.config/agents/skills/` | `./.agents/skills/` | `npx -y github:Asif2902/arc-dex-skills --amp` / `--amp-project` |
| Goose | `~/.config/goose/skills/` | `./.goose/skills/` | `npx -y github:Asif2902/arc-dex-skills --goose` / `--goose-project` |
| Universal Agent Skills | `~/.agents/skills/` | `./.agents/skills/` | `npx -y github:Asif2902/arc-dex-skills --agents` / `--agents-project` |
| Claude app (claude.ai, desktop, mobile) | upload in skills settings | — | use the zips in `dist/` (one skill per zip) |
| Any `AGENTS.md` tool | — | `./.ai-skills/` + `./AGENTS.md` | `npx -y github:Asif2902/arc-dex-skills --agents-md` |

If your tool keeps skills somewhere else, use `--dir <path>`.

### Claude Code plugin (optional)
```
/plugin marketplace add Asif2902/arc-dex-skills
/plugin install arc-dex-skills@arc-dex-skills
```

## Notes
- Arc facts come from Arc's public docs: chain IDs 5042 / 5042002, USDC ERC-20 interface `0x3600…0000`, 6 decimals. Re-verify before production.
- The subgraph template has not been compiled. Run `npm i && npx graph codegen && npx graph build` first. Confirm Arc's network name with your indexer host.
