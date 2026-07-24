$ErrorActionPreference = "Stop"

$project = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot "..\mini-app")
)
$config = Join-Path $project "dist\server\wrangler.json"
$state = Join-Path $project ".wrangler\state"
$env:WRANGLER_LOG_PATH = Join-Path $project ".wrangler\wrangler.log"

if (-not (Test-Path -LiteralPath $config)) {
    throw "Run scripts\setup_local.ps1 before resetting local learning data."
}

Push-Location $project
try {
    $resetSql = @(
        "DELETE FROM payment_transactions",
        "DELETE FROM payment_orders",
        "DELETE FROM subscriptions",
        "DELETE FROM invitations",
        "DELETE FROM reminder_events",
        "DELETE FROM notes",
        "DELETE FROM submissions",
        "DELETE FROM enrollments",
        "DELETE FROM users",
        "DELETE FROM schema_version"
    ) -join "; "

    npx.cmd wrangler d1 execute site-creator-d1 `
        --local `
        --persist-to $state `
        --config $config `
        --command ($resetSql + ";")

    if ($LASTEXITCODE -ne 0) {
        throw "Unable to reset local learning data."
    }

    Write-Host "Local learning data was reset. Open the app to start again from Day 1."
}
finally {
    Pop-Location
}
