<#
.SYNOPSIS
    GONYADI 프로젝트 백엔드 + DB 종료 스크립트

.USAGE
    .\stop.ps1            # 백엔드 서버만 종료
    .\stop.ps1 -StopDB    # 백엔드 + DB 컨테이너도 종료
#>

param(
    [switch]$StopDB
)

function Write-Step($msg) { Write-Host "`n>> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "   [OK] $msg" -ForegroundColor Green }

# -- uvicorn process stop --
Write-Step "Stopping backend server (uvicorn)..."

$uvicornProcs = Get-Process -Name "python" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*uvicorn*" -or $_.MainWindowTitle -like "*uvicorn*" }

if ($uvicornProcs) {
    $uvicornProcs | Stop-Process -Force
    Write-Ok "uvicorn processes stopped"
} else {
    Write-Ok "No running uvicorn processes found"
}

# -- DB container stop (optional) --
if ($StopDB) {
    Write-Step "Stopping DB container..."

    $ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
    $BackendDir  = Join-Path $ProjectRoot "backend"

    docker-compose -f (Join-Path $BackendDir "docker-compose.yml") down 2>$null
    Write-Ok "DB container stopped"
}

Write-Host "`nDone." -ForegroundColor Green
