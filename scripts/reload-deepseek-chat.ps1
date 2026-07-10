# Reload chat-webhook + ai after editing DEEPSEEK_API_KEY in .env
# Usage: .\scripts\reload-deepseek-chat.ps1
# Never prints the key value.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$envFile = Join-Path $root ".env"
if (-not (Test-Path $envFile)) {
  Write-Host "FAIL: missing .env — copy from .env.example first"
  exit 1
}

$keyLen = 0
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*DEEPSEEK_API_KEY\s*=\s*(.*)$') {
    $keyLen = $matches[1].Trim().Trim('"').Trim("'").Length
  }
}

if ($keyLen -lt 10) {
  Write-Host "FAIL: DEEPSEEK_API_KEY still empty/too short in .env (len=$keyLen)"
  Write-Host "Edit D:\VN_TravelAI\.env and set:"
  Write-Host "  DEEPSEEK_API_KEY=sk-your-key-here"
  Write-Host "Save file, then re-run this script."
  exit 2
}

Write-Host "OK DEEPSEEK_API_KEY present (len=$keyLen) — recreating chat-webhook + ai..."
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --force-recreate chat-webhook ai
Start-Sleep -Seconds 6

$health = curl.exe -s "http://127.0.0.1:55679/healthz"
Write-Host "chat-webhook health: $health"
if ($health -notmatch '"deepseekConfigured":true') {
  Write-Host "WARN: deepseekConfigured is not true — compose may not have loaded .env"
  exit 3
}

Write-Host "Running live chat smoke (REQUIRE_LIVE=1)..."
$env:REQUIRE_LIVE = "1"
node (Join-Path $root "scripts\smoke-chat.mjs")
exit $LASTEXITCODE
