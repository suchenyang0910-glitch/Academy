$ErrorActionPreference = "Stop"

$project = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot "..\mini-app")
)

Push-Location $project
try {
    node scripts/reset-learning.mjs
}
finally {
    Pop-Location
}
