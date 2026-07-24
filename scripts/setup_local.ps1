$ErrorActionPreference = "Stop"

$project = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot "..\mini-app")
)

Push-Location $project
try {
    npm.cmd run build
    npm.cmd run db:migrate
    Write-Host "Academy local SQLite database is ready."
    Write-Host "Copy .env.example to .env.local and replace placeholder secrets before Telegram testing."
    Write-Host "Start the app with: npm.cmd run dev"
}
finally {
    Pop-Location
}
