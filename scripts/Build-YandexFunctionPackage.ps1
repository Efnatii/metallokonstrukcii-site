param(
  [string]$OutputDir = "dist-yandex\function",
  [string]$ZipPath = "dist-yandex\b2e-yandex-function.zip"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$resolvedOutput = Join-Path $repoRoot $OutputDir
$resolvedZip = Join-Path $repoRoot $ZipPath

if (-not (Test-Path -LiteralPath $repoRoot)) {
  throw "Repository root was not resolved."
}

if (Test-Path -LiteralPath $resolvedOutput) {
  Remove-Item -LiteralPath $resolvedOutput -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $resolvedOutput | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path $resolvedZip -Parent) | Out-Null

$adapterSource = Join-Path $repoRoot "yandex\function\index.mjs"
$workerSource = Join-Path $repoRoot "worker\src\index.js"
$adapterTarget = Join-Path $resolvedOutput "index.js"
$workerTarget = Join-Path $resolvedOutput "worker.mjs"
$packageTarget = Join-Path $resolvedOutput "package.json"

$adapter = Get-Content -Raw -Encoding UTF8 -LiteralPath $adapterSource
$adapter = $adapter.Replace("import worker from '../../worker/src/index.js';", "import worker from './worker.mjs';")
Set-Content -Encoding UTF8 -LiteralPath $adapterTarget -Value $adapter
Copy-Item -LiteralPath $workerSource -Destination $workerTarget -Force
Set-Content -Encoding UTF8 -LiteralPath $packageTarget -Value '{ "type": "module" }'

if (Test-Path -LiteralPath $resolvedZip) {
  Remove-Item -LiteralPath $resolvedZip -Force
}

Compress-Archive -Path (Join-Path $resolvedOutput "*") -DestinationPath $resolvedZip -Force

Write-Output $resolvedZip
