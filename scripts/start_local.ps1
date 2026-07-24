$ErrorActionPreference = "Stop"

$project = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot "..\mini-app")
)

& (Join-Path $PSScriptRoot "setup_local.ps1")

Push-Location $project
try {
    Write-Host "Opening Academy locally at http://localhost:3000"
    npm.cmd run dev
}
finally {
    Pop-Location
}
