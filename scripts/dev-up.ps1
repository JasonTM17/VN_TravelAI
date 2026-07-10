# Boot local TravelAI stack (Docker infra + seed + node services).
# Usage (from repo root):  powershell -File scripts/dev-up.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "==> Docker Desktop"
$dd = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue
if (-not $dd) {
  $exe = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
  if (-not (Test-Path $exe)) { throw "Docker Desktop not found at $exe" }
  Start-Process $exe
}
for ($i = 1; $i -le 60; $i++) {
  docker info 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { break }
  Start-Sleep 3
  if ($i -eq 60) { throw "Docker engine not ready" }
}

Write-Host "==> Infra (postgres/redis/meili)"
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d postgres redis meilisearch | Out-Host
Start-Sleep 4
docker compose -f docker-compose.yml -f docker-compose.local.yml exec -T postgres pg_isready -U travelai | Out-Host

Write-Host "==> Seed catalog"
$env:DATABASE_URL = "postgresql://travelai:travelai_dev@127.0.0.1:55432/travelai"
$env:DIRECT_URL = $env:DATABASE_URL
Push-Location "$Root\api"
node ./node_modules/tsx/dist/cli.mjs prisma/seed.ts
Pop-Location

Write-Host "==> Ports expected: web 53000 | api 53001 | identity 53002 | ai 53003"
Write-Host "Start node services in separate terminals if not already running."
Write-Host "Smoke: Invoke-WebRequest http://127.0.0.1:53001/v1/destinations"
Write-Host "Web:   http://127.0.0.1:53000/vi"
