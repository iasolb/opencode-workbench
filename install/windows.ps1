# Symlinks this repo's tracked config into $env:APPDATA\opencode (or
# ~/.config/opencode when APPDATA is unset) so opencode picks it up on every
# machine, and keeps the memory MCP graph (data/) syncing through git.
# Existing targets are backed up with a .bak suffix before being replaced,
# never silently overwritten.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File install\windows.ps1

$ErrorActionPreference = "Stop"

$repo_root = Split-Path -Parent $PSScriptRoot
$oc_root = if ($env:APPDATA) { Join-Path $env:APPDATA "opencode" } else { Join-Path $HOME ".config\opencode" }
New-Item -ItemType Directory -Force -Path $oc_root | Out-Null

function Replace-WithSymlink {
    param([string]$Target, [string]$Source, [string]$Label)
    $exists = Test-Path -LiteralPath $Target
    $isLink = $false
    if ($exists) {
        $item = Get-Item -LiteralPath $Target -Force
        $isLink = $item.Attributes -band [IO.FileAttributes]::ReparsePoint
        if ($isLink) {
            Remove-Item -LiteralPath $Target -Force
        } else {
            Move-Item -LiteralPath $Target "$Target.bak" -Force
            Write-Host "Backed up existing $Label to $Label.bak"
        }
    }
    $parent = Split-Path -Parent $Target
    if (-not (Test-Path -LiteralPath $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
    New-Item -ItemType SymbolicLink -Path $Target -Target $Source -ErrorAction Stop | Out-Null
    Write-Host "Linked $Label"
}

# Symlinks on Windows need either an elevated process or Developer Mode.
# Check we can create one before touching any real config.
$probe = Join-Path $oc_root ".symlink-test-$PID"
try {
    New-Item -ItemType SymbolicLink -Path $probe -Target $repo_root -ErrorAction Stop | Out-Null
    Remove-Item -LiteralPath $probe -Force
} catch {
    Write-Host "Cannot create symlinks in $oc_root. Nothing has been touched." -ForegroundColor Red
    Write-Host "Enable Developer Mode (Settings > Update & Security > For developers) or run elevated, then re-run." -ForegroundColor Red
    exit 1
}

foreach ($item in @("opencode.jsonc", "instructions.md", "agents", "commands", "data")) {
    Replace-WithSymlink -Target (Join-Path $oc_root $item) -Source (Join-Path $repo_root $item) -Label $item
}

Write-Host "Installed. Restart opencode to pick up the config."
Write-Host "Replace <you>, <your memory bank root>, and <your projects root>"
Write-Host "placeholders in opencode.jsonc and instructions.md before relying on them."