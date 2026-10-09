param(
  [string[]]$Cases = @('PUB-TC-001','PUB-TC-003','PUB-TC-005','CNT-TC-001','CNT-TC-002','CNT-TC-005','CNT-TC-007','FRM-TC-004','FRM-TC-005'),
  [switch]$KeepDatabase
)
$ErrorActionPreference = 'Stop'
$frontend = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$root = (Resolve-Path (Join-Path $frontend '..')).Path
$backend = Join-Path $root 'backend'
$storage = Join-Path $backend 'backend/storage'
$db = [IO.Path]::GetFullPath((Join-Path $storage 'qa-local-run.sqlite'))
$logDir = Join-Path $frontend 'test-results/local-qa'
$envFile = Join-Path $backend '.env.testing'
$procs = @()
function Fail([string]$m) { throw $m }
function Wait-Url([string]$url) {
  for ($i=0; $i -lt 60; $i++) { try { $r=Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { return } } catch {}; Start-Sleep -Milliseconds 500 }
  Fail "Server did not become ready: $url"
}
New-Item -ItemType Directory -Force $storage,$logDir | Out-Null
if (-not $db.StartsWith([IO.Path]::GetFullPath($storage), [StringComparison]::OrdinalIgnoreCase)) { Fail "Unsafe database path: $db" }
if (Test-Path $db) { Remove-Item -LiteralPath $db -Force }
$dbUnix = $db.Replace('\','/')
if ([string]::IsNullOrWhiteSpace($dbUnix) -or $dbUnix -match '\$dbUnix' -or $dbUnix -notmatch '/qa-local-run\.sqlite$') { Fail "Unresolved or unsafe SQLite path: $dbUnix" }
New-Item -ItemType File -Path $db -Force | Out-Null
@"
APP_ENV=testing
APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000
DB_CONNECTION=sqlite
DB_DATABASE=$dbUnix
SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
FILESYSTEM_DISK=local
MAIL_MAILER=array
"@ | Set-Content -LiteralPath $envFile
try {
  $resolved = (Select-String -LiteralPath $envFile -Pattern '^DB_DATABASE=(.+)$').Matches.Groups[1].Value
  if ($resolved -ne $dbUnix -or $resolved -match '\$dbUnix' -or -not (Test-Path -LiteralPath $resolved)) { Fail "DB_DATABASE did not resolve to disposable SQLite file: $resolved" }
  & php (Join-Path $backend 'artisan') config:clear --env=testing *> (Join-Path $logDir 'config-clear.log')
  & php (Join-Path $backend 'artisan') migrate:fresh --force --env=testing *> (Join-Path $logDir 'migrate.log')
  if ($LASTEXITCODE) { Fail 'Laravel migrations failed' }
  $env:APP_ENV='testing'; & php (Join-Path $backend 'tests/qa_shared_seed.php') *> (Join-Path $logDir 'seed.log')
  if ($LASTEXITCODE) { Fail 'Fixture seeding failed' }
  $procs += Start-Process php -ArgumentList 'artisan','serve','--host=127.0.0.1','--port=8000','--env=testing' -WorkingDirectory $backend -RedirectStandardOutput (Join-Path $logDir 'laravel.log') -RedirectStandardError (Join-Path $logDir 'laravel.err') -PassThru
  $env:VITE_BACKEND_ORIGIN='http://127.0.0.1:8000'
  $procs += Start-Process npm.cmd -ArgumentList 'run','dev','--','--host','127.0.0.1','--port','5173','--strictPort' -WorkingDirectory $frontend -RedirectStandardOutput (Join-Path $logDir 'vite.log') -RedirectStandardError (Join-Path $logDir 'vite.err') -PassThru
  Wait-Url 'http://127.0.0.1:8000/api/v1/groups'; Wait-Url 'http://127.0.0.1:5173/'
  $origin = $env:VITE_BACKEND_ORIGIN; if ($origin -ne 'http://127.0.0.1:8000') { Fail 'Backend origin is not localhost' }
  $controlSpec = 'tests/e2e/batch1-navigation.spec.mjs'
  $pendingSpec = 'tests/e2e/batch1-remaining.spec.mjs'
  $controlCase = 'PUB-TC-001'
  $pendingCases = @('PUB-TC-003','PUB-TC-005','CNT-TC-001','CNT-TC-002','CNT-TC-005','CNT-TC-007','FRM-TC-004','FRM-TC-005')
  $requestedPending = @($Cases | Where-Object { $_ -ne $controlCase })
  if ($requestedPending.Count -ne 8 -or (@($requestedPending | Where-Object { $pendingCases -notcontains $_ }).Count -gt 0)) { Fail 'Exactly the eight approved pending cases must be supplied' }
  $casePattern = ($requestedPending | ForEach-Object { [regex]::Escape($_) }) -join '|'
  if ($Cases -notcontains $controlCase) { Fail 'PUB-TC-001 must be included as the control case' }
  if ([string]::IsNullOrWhiteSpace($casePattern) -or $casePattern -match '^\|$') { Fail 'No valid Playwright case pattern was supplied' }
  $playwrightCli = Join-Path $frontend 'node_modules/@playwright/test/cli.js'
  if (-not (Test-Path -LiteralPath $playwrightCli)) { Fail "Playwright CLI not found: $playwrightCli" }
  $env:PLAYWRIGHT_JSON_OUTPUT_NAME = Join-Path $logDir 'control-results.json'
  & node $playwrightCli test $controlSpec --config playwright.config.mjs --grep $controlCase --reporter list,json --output $logDir
  $testExitCode = $LASTEXITCODE
  if ($testExitCode) { Fail "PUB-TC-001 failed with exit code $testExitCode" }
  $env:PLAYWRIGHT_JSON_OUTPUT_NAME = Join-Path $logDir 'pending-results.json'
  & node $playwrightCli test $pendingSpec --config playwright.config.mjs --grep $casePattern --reporter list,json --output $logDir
  $testExitCode = $LASTEXITCODE
  if ($testExitCode) { Fail "Pending Batch 1 cases failed with exit code $testExitCode" }
} finally {
  foreach ($p in $procs) { if ($p -and -not $p.HasExited) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue } }
  if (Test-Path $envFile) { Remove-Item -LiteralPath $envFile -Force }
  Remove-Item Env:PLAYWRIGHT_JSON_OUTPUT_NAME -ErrorAction SilentlyContinue
  if (-not $KeepDatabase -and (Test-Path $db)) { Remove-Item -LiteralPath $db -Force }
}
