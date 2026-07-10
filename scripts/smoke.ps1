# TravelAI local smoke — infra + app health + catalog search
# Usage (local ports remap):
#   .\scripts\smoke.ps1
#   .\scripts\smoke.ps1 -BaseWeb http://127.0.0.1:53000 -BaseApi http://127.0.0.1:53001 -BaseIdentity http://127.0.0.1:53002 -BaseAi http://127.0.0.1:53003

param(
  [string]$BaseWeb = "http://127.0.0.1:53000",
  [string]$BaseApi = "http://127.0.0.1:53001",
  [string]$BaseIdentity = "http://127.0.0.1:53002",
  [string]$BaseAi = "http://127.0.0.1:53003"
)

$ErrorActionPreference = "Stop"
$failed = 0

function Check-Json($name, $url) {
  try {
    $r = Invoke-RestMethod -Uri $url -TimeoutSec 8
    Write-Host "OK  $name  $url  -> $($r | ConvertTo-Json -Compress)"
  } catch {
    Write-Host "FAIL $name  $url  -> $_"
    $script:failed++
  }
}

# PowerShell default string bodies mis-size UTF-8 Content-Length for Vietnamese.
function Invoke-JsonPost([string]$Url, [string]$JsonBody, [hashtable]$Headers = @{}) {
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($JsonBody)
  $hdrs = @{ "Content-Type" = "application/json; charset=utf-8" }
  foreach ($k in $Headers.Keys) { $hdrs[$k] = $Headers[$k] }
  return Invoke-RestMethod -Method POST -Uri $Url -Headers $hdrs -Body $bytes -TimeoutSec 60
}

Write-Host "=== TravelAI smoke ==="
Check-Json "web/healthz" "$BaseWeb/healthz"
Check-Json "web/readyz" "$BaseWeb/readyz"
Check-Json "api/healthz" "$BaseApi/healthz"
Check-Json "api/readyz" "$BaseApi/readyz"
Check-Json "identity/healthz" "$BaseIdentity/healthz"
Check-Json "identity/readyz" "$BaseIdentity/readyz"
Check-Json "ai/healthz" "$BaseAi/healthz"
Check-Json "ai/readyz" "$BaseAi/readyz"

try {
  $jwks = Invoke-RestMethod "$BaseIdentity/.well-known/jwks.json"
  $kids = ($jwks.keys | ForEach-Object { $_.kid }) -join ","
  if ($jwks.keys.Count -lt 2) { throw "JWKS needs dual keys, got $($jwks.keys.Count)" }
  Write-Host "OK  jwks dual keys: $kids"
} catch {
  Write-Host "FAIL jwks -> $_"
  $failed++
}

try {
  $hotels = Invoke-RestMethod "$BaseApi/v1/hotels?q=Da%20Nang&limit=3"
  if (-not $hotels.data -or $hotels.data.Count -lt 1) { throw "empty hotel search" }
  Write-Host "OK  search hotels Da Nang count=$($hotels.data.Count)"
} catch {
  Write-Host "FAIL search -> $_"
  $failed++
}

try {
  $login = Invoke-JsonPost "$BaseIdentity/v1/auth/login" '{"email":"demo@travelai.local","password":"DemoTravelAI1!"}'
  $token = $login.data.accessToken
  if (-not $token) { throw "no access token" }
  Write-Host "OK  login demo user"
  $ai = Invoke-JsonPost "$BaseAi/v1/itineraries" '{"destination":"Hoi An","days":3,"budgetVnd":5000000,"style":"couple"}' @{ Authorization = "Bearer $token" }
  if (-not $ai.data.days -or $ai.data.days.Count -lt 1) { throw "empty itinerary" }
  Write-Host "OK  ai itinerary days=$($ai.data.days.Count) degraded=$($ai.data.degraded)"

  $chat = Invoke-JsonPost "$BaseAi/v1/chat" '{"message":"3 ngay Da Nang budget 8 trieu couple"}' @{ Authorization = "Bearer $token" }
  if (-not $chat.data.reply -or $chat.data.reply.Length -lt 10) { throw "empty chat reply" }
  Write-Host "OK  ai chat replyLen=$($chat.data.reply.Length) degraded=$($chat.data.degraded)"
  if ($env:DEEPSEEK_API_KEY -and $env:DEEPSEEK_API_KEY.Trim().Length -gt 0) {
    if ($chat.data.degraded -eq $true) { throw "expected live chat (degraded=false) when DEEPSEEK_API_KEY is set" }
    if ($chat.data.reply -match '^TravelAI Concierge \(live\):') { throw "legacy template reply still in use" }
    Write-Host "OK  live DeepSeek chat path"
  } else {
    Write-Host "INFO chat degraded path acceptable without DEEPSEEK_API_KEY (set key for live LLM)"
  }
} catch {
  Write-Host "FAIL auth/ai -> $_"
  $failed++
}

if ($failed -gt 0) {
  Write-Host "=== SMOKE FAILED ($failed) ==="
  exit 1
}
Write-Host "=== SMOKE PASSED ==="
exit 0
