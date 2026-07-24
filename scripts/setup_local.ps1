$ErrorActionPreference = "Stop"

$project = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot "..\mini-app")
)
$config = Join-Path $project "dist\server\wrangler.json"
$state = Join-Path $project ".wrangler\state"
$env:WRANGLER_LOG_PATH = Join-Path $project ".wrangler\wrangler.log"

Push-Location $project
try {
    npm.cmd run build

    if (-not (Test-Path -LiteralPath $config)) {
        throw "Build did not create dist\server\wrangler.json"
    }

    $initialSchemaJson = npx.cmd wrangler d1 execute site-creator-d1 `
        --local `
        --persist-to $state `
        --config $config `
        --command "SELECT COUNT(*) AS count FROM sqlite_master WHERE type='table' AND name='users';" `
        --json
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to inspect the local D1 database"
    }

    $initialSchema = $initialSchemaJson | ConvertFrom-Json
    $hasInitialSchema = [int]$initialSchema[0].results[0].count -gt 0

    if (-not $hasInitialSchema) {
        npx.cmd wrangler d1 execute site-creator-d1 `
            --local `
            --persist-to $state `
            --config $config `
            --file "drizzle\0000_clean_maestro.sql"
        if ($LASTEXITCODE -ne 0) {
            throw "Initial D1 migration failed"
        }
    }

    $schemaJson = npx.cmd wrangler d1 execute site-creator-d1 `
        --local `
        --persist-to $state `
        --config $config `
        --command "SELECT COUNT(*) AS count FROM pragma_table_info('enrollments') WHERE name='started_on';" `
        --json
    $schema = $schemaJson | ConvertFrom-Json
    $hasSecondMigration = [int]$schema[0].results[0].count -gt 0

    if (-not $hasSecondMigration) {
        npx.cmd wrangler d1 execute site-creator-d1 `
            --local `
            --persist-to $state `
            --config $config `
            --file "drizzle\0001_useful_wallow.sql"
        if ($LASTEXITCODE -ne 0) {
            throw "Second D1 migration failed"
        }
    }

    $profileSchemaJson = npx.cmd wrangler d1 execute site-creator-d1 `
        --local `
        --persist-to $state `
        --config $config `
        --command "SELECT COUNT(*) AS count FROM pragma_table_info('users') WHERE name='referral_code';" `
        --json
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to inspect the profile and invitation schema"
    }

    $profileSchema = $profileSchemaJson | ConvertFrom-Json
    $hasProfileMigration = [int]$profileSchema[0].results[0].count -gt 0

    if (-not $hasProfileMigration) {
        npx.cmd wrangler d1 execute site-creator-d1 `
            --local `
            --persist-to $state `
            --config $config `
            --file "drizzle\0002_neat_doctor_octopus.sql"
        if ($LASTEXITCODE -ne 0) {
            throw "Profile and invitation migration failed"
        }
    }

    $accessSchemaJson = npx.cmd wrangler d1 execute site-creator-d1 `
        --local `
        --persist-to $state `
        --config $config `
        --command "SELECT COUNT(*) AS count FROM sqlite_master WHERE type='table' AND name='subscriptions';" `
        --json
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to inspect the subscription schema"
    }

    $accessSchema = $accessSchemaJson | ConvertFrom-Json
    $hasAccessMigration = [int]$accessSchema[0].results[0].count -gt 0

    if (-not $hasAccessMigration) {
        npx.cmd wrangler d1 execute site-creator-d1 `
            --local `
            --persist-to $state `
            --config $config `
            --file "drizzle\0003_ordinary_captain_flint.sql"
        if ($LASTEXITCODE -ne 0) {
            throw "Subscription migration failed"
        }
    }

    $paymentSchemaJson = npx.cmd wrangler d1 execute site-creator-d1 `
        --local `
        --persist-to $state `
        --config $config `
        --command "SELECT COUNT(*) AS count FROM sqlite_master WHERE type='table' AND name='payment_transactions';" `
        --json
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to inspect the Telegram Stars payment schema"
    }

    $paymentSchema = $paymentSchemaJson | ConvertFrom-Json
    $hasPaymentMigration = [int]$paymentSchema[0].results[0].count -gt 0

    if (-not $hasPaymentMigration) {
        npx.cmd wrangler d1 execute site-creator-d1 `
            --local `
            --persist-to $state `
            --config $config `
            --file "drizzle\0004_round_morbius.sql"
        if ($LASTEXITCODE -ne 0) {
            throw "Telegram Stars payment migration failed"
        }
    }

    Write-Host "Academy local database is ready."
    Write-Host "Copy .env.example to .env.local and replace placeholder secrets before Telegram testing."
    Write-Host "Start the app with: npm.cmd run dev"
}
finally {
    Pop-Location
}
