$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '..')
$auditVariables = @('APP_ENV', 'DB_CONNECTION', 'DB_DATABASE', 'LARAVEL_STORAGE_PATH')
$previousAuditEnvironment = @{}
foreach ($name in $auditVariables) { $previousAuditEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }
try {
    $env:APP_ENV = 'testing'
    $env:DB_CONNECTION = 'sqlite'
    $env:DB_DATABASE = ':memory:'
    $env:LARAVEL_STORAGE_PATH = Join-Path (Get-Location) 'storage/admin-audit-isolated'
    foreach ($directory in @('framework/views', 'framework/cache', 'framework/sessions', 'logs')) {
        New-Item -ItemType Directory -Force -Path (Join-Path $env:LARAVEL_STORAGE_PATH $directory) | Out-Null
    }
    php vendor/phpunit/phpunit/phpunit audit/AdminAuditTest.php --testdox --log-junit audit/results.xml > audit/results.txt
    $auditExitCode = $LASTEXITCODE
    Get-Content audit/results.txt
} finally {
    foreach ($name in $auditVariables) { [Environment]::SetEnvironmentVariable($name, $previousAuditEnvironment[$name], 'Process') }
    Pop-Location
}
exit $auditExitCode
