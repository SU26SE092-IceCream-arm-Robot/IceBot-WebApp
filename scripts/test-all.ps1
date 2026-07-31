[CmdletBinding()]
param(
    [switch]$SkipUnit,
    [switch]$SkipBuild,
    [switch]$SkipE2E
)

$ErrorActionPreference = "Stop"

function Invoke-NpmStep {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Label,
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    Write-Host ""
    Write-Host "==> $Label" -ForegroundColor Cyan
    & npm @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE."
    }
}

if (-not $SkipUnit) {
    Invoke-NpmStep -Label "Unit and contract tests" -Arguments @("run", "test")
}

Invoke-NpmStep -Label "ESLint" -Arguments @("run", "lint")

if (-not $SkipBuild) {
    Invoke-NpmStep -Label "Production build" -Arguments @("run", "build")
}

if (-not $SkipE2E) {
    if ([string]::IsNullOrWhiteSpace($env:ICEBOT_E2E_USERNAME) -or
        [string]::IsNullOrWhiteSpace($env:ICEBOT_E2E_PASSWORD)) {
        throw "ICEBOT_E2E_USERNAME and ICEBOT_E2E_PASSWORD are required. Credentials are never read or hardcoded by this script."
    }

    Invoke-NpmStep -Label "Browser E2E smoke tests" -Arguments @("run", "test:e2e")
}

Write-Host ""
Write-Host "PASS: All selected test steps completed." -ForegroundColor Green
