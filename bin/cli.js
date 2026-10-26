#!/usr/bin/env node
// Installs the bundled skills into AI coding tools. No dependencies.
const fs = require('fs')
const os = require('os')
const path = require('path')

const SKILLS_DIR = path.join(__dirname, '..', 'skills')
const HOME = process.env.ARC_DEX_SKILLS_HOME || process.env.HOME || os.homedir()
const XDG_CONFIG = process.env.XDG_CONFIG_HOME || path.join(HOME, '.config')
const CLAUDE_HOME = process.env.CLAUDE_CONFIG_DIR || path.join(HOME, '.claude')
const CODEX_HOME = process.env.CODEX_HOME || path.join(HOME, '.codex')

const TARGETS = {
  claude: {
    aliases: ['claude-code'],
    label: 'Claude Code',
    dirs: [path.join(CLAUDE_HOME, 'skills')],
    projectDirs: ['.claude/skills'],
    detect: [CLAUDE_HOME],
    projectDetect: ['.claude'],
  },
  codex: {
    aliases: ['openai-codex'],
    label: 'Codex CLI',
    dirs: [path.join(CODEX_HOME, 'skills')],
    projectDirs: ['.codex/skills'],
    detect: [CODEX_HOME],
    projectDetect: ['.codex'],
  },
  gemini: {
    aliases: ['gemini-cli'],
    label: 'Gemini CLI',
    dirs: [path.join(HOME, '.gemini', 'skills')],
    projectDirs: ['.gemini/skills'],
    detect: [path.join(HOME, '.gemini')],
    projectDetect: ['.gemini'],
  },
  antigravity: {
    aliases: ['agy'],
    label: 'Antigravity',
    dirs: [
      path.join(HOME, '.gemini', 'config', 'skills'),
      path.join(HOME, '.gemini', 'antigravity', 'skills'),
    ],
    projectDirs: ['.agents/skills'],
    detect: [
      path.join(HOME, '.gemini', 'antigravity-cli'),
      path.join(HOME, '.gemini', 'antigravity'),
      path.join(HOME, '.gemini', 'config'),
      path.join(HOME, '.gemini'),
    ],
    projectDetect: ['.agents', '.agent'],
  },
  opencode: {
    aliases: [],
    label: 'opencode',
    dirs: [path.join(XDG_CONFIG, 'opencode', 'skills')],
    projectDirs: ['.opencode/skills'],
    detect: [path.join(XDG_CONFIG, 'opencode'), path.join(HOME, '.opencode')],
    projectDetect: ['.opencode'],
  },
  grok: {
    aliases: ['grok-build'],
    label: 'Grok Build',
    dirs: [path.join(HOME, '.grok', 'skills')],
    projectDirs: ['.grok/skills'],
    detect: [path.join(HOME, '.grok')],
    projectDetect: ['.grok'],
  },
  cursor: {
    aliases: ['cursor-cli'],
    label: 'Cursor',
    dirs: [path.join(HOME, '.cursor', 'skills')],
    projectDirs: ['.cursor/skills'],
    detect: [path.join(HOME, '.cursor')],
    projectDetect: ['.cursor'],
  },
  copilot: {
    aliases: ['github-copilot'],
    label: 'GitHub Copilot',
    dirs: [path.join(HOME, '.copilot', 'skills')],
    projectDirs: ['.github/skills'],
    detect: [path.join(HOME, '.copilot'), path.join(XDG_CONFIG, 'github-copilot')],
    projectDetect: ['.github'],
  },
  windsurf: {
    aliases: ['codeium'],
    label: 'Windsurf',
    dirs: [path.join(HOME, '.codeium', 'windsurf', 'skills')],
    projectDirs: ['.windsurf/skills'],
    detect: [path.join(HOME, '.codeium', 'windsurf'), path.join(HOME, '.windsurf')],
    projectDetect: ['.windsurf'],
  },
  cline: {
    aliases: [],
    label: 'Cline',
    dirs: [path.join(HOME, '.cline', 'skills')],
    projectDirs: ['.cline/skills'],
    detect: [path.join(HOME, '.cline')],
    projectDetect: ['.cline'],
  },
  roo: {
    aliases: ['roo-code'],
    label: 'Roo Code',
    dirs: [path.join(HOME, '.roo', 'skills')],
    projectDirs: ['.roo/skills'],
    detect: [path.join(HOME, '.roo')],
    projectDetect: ['.roo'],
  },
  kiro: {
    aliases: ['kiro-cli'],
    label: 'Kiro',
    dirs: [path.join(HOME, '.kiro', 'skills')],
    projectDirs: ['.kiro/skills'],
    detect: [path.join(HOME, '.kiro')],
    projectDetect: ['.kiro'],
  },
  amp: {
    aliases: [],
    label: 'Amp',
    dirs: [path.join(XDG_CONFIG, 'agents', 'skills')],
    projectDirs: ['.agents/skills'],
    detect: [path.join(XDG_CONFIG, 'amp'), path.join(HOME, '.amp')],
    projectDetect: [],
  },
  goose: {
    aliases: [],
    label: 'Goose',
    dirs: [path.join(XDG_CONFIG, 'goose', 'skills')],
    projectDirs: ['.goose/skills'],
    detect: [path.join(XDG_CONFIG, 'goose'), path.join(HOME, '.goose')],
    projectDetect: ['.goose'],
  },
  agents: {
    aliases: ['universal'],
    label: 'Universal (.agents/skills)',
    dirs: [path.join(HOME, '.agents', 'skills')],
    projectDirs: ['.agents/skills'],
    detect: [path.join(HOME, '.agents')],
    projectDetect: ['.agents'],
  },
}

const HELP = `arc-dex-skills: install the Arc DEX skills into your AI coding tools

Usage:  npx arc-dex-skills [options]

  (no options)        auto-detect: install for every supported CLI found on this machine
                      (plus ~/.agents/skills universal folder)
  --all               install into all supported global CLI skill folders
  --claude            ~/.claude/skills                                      Claude Code
  --codex             ~/.codex/skills                                       Codex CLI
  --gemini            ~/.gemini/skills                                      Gemini CLI
  --antigravity       ~/.gemini/config/skills & ~/.gemini/antigravity/skills Antigravity (agy)
  --opencode          ~/.config/opencode/skills                             opencode
  --grok              ~/.grok/skills                                        Grok Build
  --cursor            ~/.cursor/skills                                      Cursor
  --copilot           ~/.copilot/skills                                     GitHub Copilot
  --windsurf          ~/.codeium/windsurf/skills                            Windsurf
  --cline             ~/.cline/skills                                       Cline
  --roo               ~/.roo/skills                                         Roo Code
  --kiro              ~/.kiro/skills                                        Kiro
  --amp               ~/.config/agents/skills                               Amp
  --goose             ~/.config/goose/skills                                Goose
  --agents            ~/.agents/skills                                      Universal Agent Skills

Project-scoped options:
  --project, -p       install into this project instead of $HOME (combine with any tool flag,
                      or use alone for ./.agents/skills + ./.claude/skills)
  --<tool>-project    install into this project for <tool> (e.g. --grok-project, --gemini-project,
                      --cursor-project, --claude-project, --codex-project, --antigravity-project)
  --all-project       install into all supported project skill folders
  --agents-md         copy skills to ./.ai-skills and add a pointer block to ./AGENTS.md

Other options:
  --agent, -a <name>  target a specific CLI by name (e.g. -a gemini-cli -a cursor)
  --skill, -s <name>  install/remove only the named skill (default: all bundled skills)
  --dir <path>        install into any custom folder path
  --remove            remove the skills instead of installing (combine with any flags above)
  --list, -l          show the skills in this package
  -h, --help          show this help
`

function copyRecursive(src, dest) {
  if (typeof fs.cpSync === 'function') {
    fs.cpSync(src, dest, { recursive: true })
    return
  }
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true })
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry))
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(src, dest)
  }
}

function allSkillNames() {
  return fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(SKILLS_DIR, d.name, 'SKILL.md')))
    .map((d) => d.name)
}

function resolveTarget(name) {
  const clean = name.replace(/^--/, '').toLowerCase()
  if (TARGETS[clean]) return TARGETS[clean]
  for (const t of Object.values(TARGETS)) {
    if (t.aliases && t.aliases.includes(clean)) return t
  }
  return null
}

function installTo(dest, selectedSkills) {
  fs.mkdirSync(dest, { recursive: true })
  for (const name of selectedSkills) {
    const target = path.join(dest, name)
    fs.rmSync(target, { recursive: true, force: true })
    copyRecursive(path.join(SKILLS_DIR, name), target)
    console.log(`  installed ${name} -> ${target}`)
  }
}

function removeFrom(dest, selectedSkills) {
  for (const name of selectedSkills) {
    const target = path.join(dest, name)
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true })
      console.log(`  removed ${target}`)
    }
  }
}

function agentsMd(remove, selectedSkills) {
  const dest = path.join(process.cwd(), '.ai-skills')
  const file = path.join(process.cwd(), 'AGENTS.md')
  console.log('Project install (AGENTS.md):')
  if (remove) {
    removeFrom(dest, selectedSkills)
    if (fs.existsSync(dest) && fs.readdirSync(dest).length === 0) {
      fs.rmSync(dest, { recursive: true, force: true })
    }
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8')
      const updated = content.replace(/\n?<!-- arc-dex-skills:begin -->[\s\S]*?<!-- arc-dex-skills:end -->\n?/g, '\n')
      if (updated !== content) {
        fs.writeFileSync(file, updated)
        console.log('  removed pointer block from AGENTS.md')
      }
    }
    return
  }
  installTo(dest, selectedSkills)
  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
  if (existing.includes('arc-dex-skills:begin')) {
    console.log('  AGENTS.md already has the pointer block')
    return
  }
  const block = [
    '',
    '<!-- arc-dex-skills:begin -->',
    '## Arc DEX skills',
    'Before working on the DEX frontend (swap, liquidity, pools page, approvals, token selector), read `.ai-skills/arc-dex-frontend/SKILL.md` and follow it.',
    'Before building or changing the subgraph (indexing, pools list, user positions), read `.ai-skills/arc-dex-subgraph/SKILL.md` and use its `template/`.',
    '<!-- arc-dex-skills:end -->',
    '',
  ].join('\n')
  fs.writeFileSync(file, existing + block)
  console.log('  added pointer block to AGENTS.md')
}

function main() {
  const rawArgs = process.argv.slice(2)
  const args = []
  for (const arg of rawArgs) {
    if (arg.startsWith('--') && arg.includes('=')) {
      const idx = arg.indexOf('=')
      args.push(arg.slice(0, idx), arg.slice(idx + 1))
    } else {
      args.push(arg)
    }
  }

  if (args.includes('-h') || args.includes('--help') || args.includes('help')) {
    return console.log(HELP)
  }

  const availableSkills = allSkillNames()
  if (args.includes('--list') || args.includes('-l') || args.includes('list') || args.includes('ls')) {
    return availableSkills.forEach((n) => console.log(n))
  }

  let remove = false
  let projectScope = false
  let allTargets = false
  let allProjectTargets = false
  let doAgentsMd = false
  const explicitTargets = []
  const explicitProjectTargets = []
  const customDirs = []
  const skillFilter = []

  for (let i = 0; i < args.length; i++) {
    const f = args[i]
    if (f === 'install' || f === 'add' || f === '-g' || f === '--global' || f === '-y' || f === '--yes') {
      continue
    } else if (f === '--remove' || f === 'remove' || f === 'uninstall' || f === 'rm') {
      remove = true
    } else if (f === '--project' || f === '-p') {
      projectScope = true
    } else if (f === '--all') {
      allTargets = true
    } else if (f === '--all-project') {
      allProjectTargets = true
    } else if (f === '--agents-md') {
      doAgentsMd = true
    } else if (f === '--dir') {
      const p = args[++i]
      if (!p) { console.error('--dir needs a path'); process.exit(1) }
      customDirs.push(path.resolve(p))
    } else if (f === '--agent' || f === '-a') {
      const a = args[++i]
      if (!a) { console.error(`${f} needs an agent name`); process.exit(1) }
      if (a === 'all' || a === '*') {
        allTargets = true
      } else {
        const t = resolveTarget(a)
        if (!t) { console.error(`Unknown agent: ${a}\n`); console.log(HELP); process.exit(1) }
        explicitTargets.push(t)
      }
    } else if (f === '--skill' || f === '-s') {
      const s = args[++i]
      if (!s) { console.error(`${f} needs a skill name`); process.exit(1) }
      if (s !== 'all' && s !== '*') {
        if (!availableSkills.includes(s)) {
          console.error(`Unknown skill: ${s}. Available: ${availableSkills.join(', ')}`)
          process.exit(1)
        }
        skillFilter.push(s)
      }
    } else if (f.startsWith('--') && f.endsWith('-project')) {
      const base = f.slice(2, -'-project'.length)
      const t = resolveTarget(base)
      if (!t) { console.error(`Unknown option: ${f}\n`); console.log(HELP); process.exit(1) }
      explicitProjectTargets.push(t)
    } else if (f.startsWith('--')) {
      const t = resolveTarget(f.slice(2))
      if (!t) { console.error(`Unknown option: ${f}\n`); console.log(HELP); process.exit(1) }
      explicitTargets.push(t)
    } else {
      console.error(`Unknown option: ${f}\n`)
      console.log(HELP)
      process.exit(1)
    }
  }

  const selectedSkills = skillFilter.length > 0 ? skillFilter : availableSkills
  const processedDirs = new Set()

  const runDirs = (label, dirs) => {
    const unique = dirs.map((d) => path.resolve(d)).filter((d) => !processedDirs.has(d))
    if (unique.length === 0) return
    console.log(`${label}:`)
    for (const d of unique) {
      processedDirs.add(d)
      remove ? removeFrom(d, selectedSkills) : installTo(d, selectedSkills)
    }
  }

  const hasExplicitAction =
    allTargets ||
    allProjectTargets ||
    doAgentsMd ||
    explicitTargets.length > 0 ||
    explicitProjectTargets.length > 0 ||
    customDirs.length > 0

  if (!hasExplicitAction) {
    if (projectScope) {
      // Auto-detect project folders or install into universal .agents/skills + .claude/skills
      let did = false
      for (const t of Object.values(TARGETS)) {
        const detected = (t.projectDetect || []).some((p) => fs.existsSync(path.join(process.cwd(), p)))
        const hasInstalled = t.projectDirs.some((p) => fs.existsSync(path.join(process.cwd(), p)))
        if (detected || (remove && hasInstalled)) {
          runDirs(`${t.label} (this project)`, t.projectDirs.map((p) => path.join(process.cwd(), p)))
          did = true
        }
      }
      if (!remove || !did) {
        runDirs('Universal (.agents/skills, this project)', [path.join(process.cwd(), '.agents', 'skills')])
        runDirs('Claude Code (this project)', [path.join(process.cwd(), '.claude', 'skills')])
      }
      return
    }

    // Auto-detect global CLIs
    let did = false
    for (const t of Object.values(TARGETS)) {
      const detected = t.detect.some((d) => fs.existsSync(d))
      const hasInstalled = t.dirs.some((d) => fs.existsSync(d))
      if (detected || (remove && hasInstalled)) {
        runDirs(t.label, t.dirs)
        did = true
      }
    }

    if (!remove) {
      // Always ensure the universal ~/.agents/skills folder has the skills
      runDirs(TARGETS.agents.label, TARGETS.agents.dirs)
      if (!did) {
        // Fallback if no tool folder existed yet: install to primary CLI locations so all work out of the box
        for (const key of ['claude', 'codex', 'gemini', 'antigravity', 'opencode', 'grok', 'cursor']) {
          runDirs(TARGETS[key].label, TARGETS[key].dirs)
        }
      }
    }
    return
  }

  if (allTargets) {
    for (const t of Object.values(TARGETS)) {
      const dirs = projectScope
        ? t.projectDirs.map((p) => path.join(process.cwd(), p))
        : t.dirs
      runDirs(projectScope ? `${t.label} (this project)` : t.label, dirs)
    }
  }

  if (allProjectTargets) {
    for (const t of Object.values(TARGETS)) {
      runDirs(`${t.label} (this project)`, t.projectDirs.map((p) => path.join(process.cwd(), p)))
    }
  }

  for (const t of explicitTargets) {
    const dirs = projectScope
      ? t.projectDirs.map((p) => path.join(process.cwd(), p))
      : t.dirs
    runDirs(projectScope ? `${t.label} (this project)` : t.label, dirs)
  }

  for (const t of explicitProjectTargets) {
    runDirs(`${t.label} (this project)`, t.projectDirs.map((p) => path.join(process.cwd(), p)))
  }

  for (const d of customDirs) {
    runDirs('Custom folder', [d])
  }

  if (doAgentsMd) {
    agentsMd(remove, selectedSkills)
  }
}

main()
