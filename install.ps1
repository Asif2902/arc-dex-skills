# Windows installer. Run in PowerShell from this folder:
#   .\install.ps1                 auto-detect installed AI coding CLIs
#   .\install.ps1 -All            install into all supported global CLI skill folders
#   .\install.ps1 -Claude         $HOME\.claude\skills
#   .\install.ps1 -Codex          $HOME\.codex\skills
#   .\install.ps1 -Gemini         $HOME\.gemini\skills
#   .\install.ps1 -Antigravity    $HOME\.gemini\config\skills & $HOME\.gemini\antigravity\skills
#   .\install.ps1 -Opencode       $HOME\.config\opencode\skills
#   .\install.ps1 -Grok           $HOME\.grok\skills
#   .\install.ps1 -Cursor         $HOME\.cursor\skills
#   .\install.ps1 -Copilot        $HOME\.copilot\skills
#   .\install.ps1 -Windsurf       $HOME\.codeium\windsurf\skills
#   .\install.ps1 -Cline          $HOME\.cline\skills
#   .\install.ps1 -Roo            $HOME\.roo\skills
#   .\install.ps1 -Kiro           $HOME\.kiro\skills
#   .\install.ps1 -Agents         $HOME\.agents\skills
#   .\install.ps1 -Project        .\.agents\skills & .\.claude\skills
#   .\install.ps1 -Dir C:\path    any folder a tool reads skills from
param(
  [switch]$All,
  [switch]$Claude,
  [switch]$Codex,
  [switch]$Gemini,
  [switch]$Antigravity,
  [switch]$Opencode,
  [switch]$Grok,
  [switch]$Cursor,
  [switch]$Copilot,
  [switch]$Windsurf,
  [switch]$Cline,
  [switch]$Roo,
  [switch]$Kiro,
  [switch]$Amp,
  [switch]$Goose,
  [switch]$Agents,
  [switch]$Project,
  [switch]$GrokProject,
  [switch]$AgentsMd,
  [switch]$Remove,
  [switch]$List,
  [switch]$Help,
  [string]$Dir,
  [Parameter(ValueFromRemainingArguments = $true)][string[]]$ExtraArgs
)

$cliJs = Join-Path $PSScriptRoot "bin\cli.js"
if ((Get-Command node -ErrorAction SilentlyContinue) -and (Test-Path $cliJs)) {
  $nodeArgs = @()
  if ($All)         { $nodeArgs += "--all" }
  if ($Claude)      { $nodeArgs += "--claude" }
  if ($Codex)       { $nodeArgs += "--codex" }
  if ($Gemini)      { $nodeArgs += "--gemini" }
  if ($Antigravity) { $nodeArgs += "--antigravity" }
  if ($Opencode)    { $nodeArgs += "--opencode" }
  if ($Grok)        { $nodeArgs += "--grok" }
  if ($Cursor)      { $nodeArgs += "--cursor" }
  if ($Copilot)     { $nodeArgs += "--copilot" }
  if ($Windsurf)    { $nodeArgs += "--windsurf" }
  if ($Cline)       { $nodeArgs += "--cline" }
  if ($Roo)         { $nodeArgs += "--roo" }
  if ($Kiro)        { $nodeArgs += "--kiro" }
  if ($Amp)         { $nodeArgs += "--amp" }
  if ($Goose)       { $nodeArgs += "--goose" }
  if ($Agents)      { $nodeArgs += "--agents" }
  if ($Project)     { $nodeArgs += "--project" }
  if ($GrokProject) { $nodeArgs += "--grok-project" }
  if ($AgentsMd)    { $nodeArgs += "--agents-md" }
  if ($Remove)      { $nodeArgs += "--remove" }
  if ($List)        { $nodeArgs += "--list" }
  if ($Help)        { $nodeArgs += "--help" }
  if ($Dir)         { $nodeArgs += @("--dir", $Dir) }
  if ($ExtraArgs)   { $nodeArgs += $ExtraArgs }
  & node $cliJs @nodeArgs
  exit $LASTEXITCODE
}

$src = Join-Path $PSScriptRoot "skills"
if (-not (Test-Path $src)) { Write-Error "skills folder not found"; exit 1 }

function Install-To($dest) {
  if ($Remove) {
    Get-ChildItem $src -Directory | ForEach-Object {
      $target = Join-Path $dest $_.Name
      if (Test-Path $target) {
        Remove-Item -Recurse -Force $target
        Write-Host "  removed $target"
      }
    }
    return
  }
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  Get-ChildItem $src -Directory | ForEach-Object {
    $target = Join-Path $dest $_.Name
    if (Test-Path $target) { Remove-Item -Recurse -Force $target }
    Copy-Item -Recurse $_.FullName $target
    Write-Host "  installed $($_.Name) -> $target"
  }
}

$did = $false
if ($All -or $Claude)      { Write-Host "Claude Code:"; Install-To "$HOME\.claude\skills"; $did = $true }
if ($All -or $Codex)       { Write-Host "Codex CLI:"; Install-To "$HOME\.codex\skills"; $did = $true }
if ($All -or $Gemini)      { Write-Host "Gemini CLI:"; Install-To "$HOME\.gemini\skills"; $did = $true }
if ($All -or $Antigravity) { Write-Host "Antigravity:"; Install-To "$HOME\.gemini\config\skills"; Install-To "$HOME\.gemini\antigravity\skills"; $did = $true }
if ($All -or $Opencode)    { Write-Host "opencode:"; Install-To "$HOME\.config\opencode\skills"; $did = $true }
if ($All -or $Grok)        { Write-Host "Grok Build:"; Install-To "$HOME\.grok\skills"; $did = $true }
if ($All -or $Cursor)      { Write-Host "Cursor:"; Install-To "$HOME\.cursor\skills"; $did = $true }
if ($All -or $Copilot)     { Write-Host "GitHub Copilot:"; Install-To "$HOME\.copilot\skills"; $did = $true }
if ($All -or $Windsurf)    { Write-Host "Windsurf:"; Install-To "$HOME\.codeium\windsurf\skills"; $did = $true }
if ($All -or $Cline)       { Write-Host "Cline:"; Install-To "$HOME\.cline\skills"; $did = $true }
if ($All -or $Roo)         { Write-Host "Roo Code:"; Install-To "$HOME\.roo\skills"; $did = $true }
if ($All -or $Kiro)        { Write-Host "Kiro:"; Install-To "$HOME\.kiro\skills"; $did = $true }
if ($All -or $Amp)         { Write-Host "Amp:"; Install-To "$HOME\.config\agents\skills"; $did = $true }
if ($All -or $Goose)       { Write-Host "Goose:"; Install-To "$HOME\.config\goose\skills"; $did = $true }
if ($All -or $Agents)      { Write-Host "Universal (.agents/skills):"; Install-To "$HOME\.agents\skills"; $did = $true }
if ($Project)              { Write-Host "Project (.agents/skills & .claude/skills):"; Install-To ".\.agents\skills"; Install-To ".\.claude\skills"; $did = $true }
if ($GrokProject)          { Write-Host "Grok Build (this project):"; Install-To ".\.grok\skills"; $did = $true }
if ($Dir)                  { Write-Host "Custom folder:"; Install-To $Dir; $did = $true }

if (-not $did) {
  if (Test-Path "$HOME\.claude")           { Write-Host "Claude Code:"; Install-To "$HOME\.claude\skills"; $did = $true }
  if (Test-Path "$HOME\.codex")            { Write-Host "Codex CLI:"; Install-To "$HOME\.codex\skills"; $did = $true }
  if (Test-Path "$HOME\.gemini")           { Write-Host "Gemini CLI:"; Install-To "$HOME\.gemini\skills"; Write-Host "Antigravity:"; Install-To "$HOME\.gemini\config\skills"; Install-To "$HOME\.gemini\antigravity\skills"; $did = $true }
  if (Test-Path "$HOME\.config\opencode")  { Write-Host "opencode:"; Install-To "$HOME\.config\opencode\skills"; $did = $true }
  if (Test-Path "$HOME\.grok")             { Write-Host "Grok Build:"; Install-To "$HOME\.grok\skills"; $did = $true }
  if (Test-Path "$HOME\.cursor")           { Write-Host "Cursor:"; Install-To "$HOME\.cursor\skills"; $did = $true }
  if (Test-Path "$HOME\.copilot")          { Write-Host "GitHub Copilot:"; Install-To "$HOME\.copilot\skills"; $did = $true }
  if (Test-Path "$HOME\.codeium\windsurf") { Write-Host "Windsurf:"; Install-To "$HOME\.codeium\windsurf\skills"; $did = $true }
  if (Test-Path "$HOME\.cline")            { Write-Host "Cline:"; Install-To "$HOME\.cline\skills"; $did = $true }
  if (Test-Path "$HOME\.roo")              { Write-Host "Roo Code:"; Install-To "$HOME\.roo\skills"; $did = $true }
  if (Test-Path "$HOME\.kiro")             { Write-Host "Kiro:"; Install-To "$HOME\.kiro\skills"; $did = $true }
  Write-Host "Universal (.agents/skills):"
  Install-To "$HOME\.agents\skills"
}
