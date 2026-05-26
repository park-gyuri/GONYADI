<#
.SYNOPSIS
    GONYADI 프로젝트 백엔드 + DB 원커맨드 시작 스크립트

.DESCRIPTION
    1) Docker Desktop 실행 여부 확인
    2) PostgreSQL 컨테이너 자동 시작 (꺼져 있으면)
    3) DB 연결 가능할 때까지 대기
    4) Python venv 활성화 -> uvicorn 백엔드 서버 시작

.USAGE
    .\start.ps1            # 기본 실행
    .\start.ps1 -SkipDB    # DB가 이미 실행 중이면 DB 단계 건너뜀
#>

param(
    [switch]$SkipDB
)

$ErrorActionPreference = "Stop"

# -- 색상 유틸 --
function Write-Step($msg) { Write-Host "`n>> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "   [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "   [!!] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "   [ERR] $msg" -ForegroundColor Red }

# -- 경로 설정 --
$ProjectRoot  = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir   = Join-Path $ProjectRoot "backend"

# 프로젝트 루트가 아닌 곳에서 실행됐으면 루트로 이동
if ((Get-Location).Path -ne $ProjectRoot) {
    Set-Location $ProjectRoot
}
$VenvActivate = Join-Path $BackendDir "venv\Scripts\Activate.ps1"
$EnvFile      = Join-Path $BackendDir ".env"

# -- .env 파일 로드 --
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line -split "=", 2
            if ($parts.Length -eq 2) {
                [Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
            }
        }
    }
    Write-Ok ".env loaded"
} else {
    Write-Err ".env not found: $EnvFile"
    exit 1
}

# ==============================================================
# STEP 1: Docker + DB
# ==============================================================
if (-not $SkipDB) {
    Write-Step "Checking Docker Desktop..."

    $dockerRunning = $false
    try {
        $null = docker info 2>$null
        $dockerRunning = $true
    } catch {}

    if (-not $dockerRunning) {
        Write-Warn "Docker Desktop is not running."
        Write-Host "   Start Docker Desktop first, or use: .\start.ps1 -SkipDB" -ForegroundColor Gray
        exit 1
    }
    Write-Ok "Docker Desktop is running"

    Write-Step "Checking PostgreSQL container..."

    $containerName = "GONYADI"
    $containerState = docker inspect -f '{{.State.Running}}' $containerName 2>$null

    if ($containerState -eq "true") {
        Write-Ok "Container '$containerName' already running"
    } else {
        Write-Host "   Starting container..." -ForegroundColor Gray
        docker-compose --env-file $EnvFile -f (Join-Path $BackendDir "docker-compose.yml") up -d 2>$null
        Write-Ok "Container '$containerName' started"
    }

    Write-Step "Waiting for DB connection..."
    $maxRetries = 15
    $retry = 0
    while ($retry -lt $maxRetries) {
        $retry++
        try {
            $result = docker exec $containerName pg_isready -U $env:DB_USER 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Ok "DB ready ($retry/$maxRetries)"
                break
            }
        } catch {}

        if ($retry -eq $maxRetries) {
            Write-Err "DB connection timeout. Check Docker Desktop."
            exit 1
        }
        Write-Host "   Waiting... ($retry/$maxRetries)" -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

# ==============================================================
# STEP 2: Backend Server
# ==============================================================
Write-Step "Starting backend server..."

if (-not (Test-Path $VenvActivate)) {
    Write-Err "Python venv not found: $VenvActivate"
    Write-Host "   Create it first: python -m venv backend/venv" -ForegroundColor Gray
    exit 1
}

# Show current IP (for debugging)
$localIP = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -ne "127.0.0.1" -and $_.PrefixOrigin -ne "WellKnown" } |
    Select-Object -First 1).IPAddress

if ($localIP) {
    Write-Ok "Current PC IP: $localIP"
    Write-Host "   Frontend auto-detects this IP. Manual override:" -ForegroundColor Gray
    Write-Host "   frontend/gonyadi-app/.env -> EXPO_PUBLIC_API_URL=http://${localIP}:8000" -ForegroundColor Gray
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  GONYADI Backend Server Starting" -ForegroundColor White
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor Gray
Write-Host "  Stop: Ctrl+C" -ForegroundColor Gray
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Activate venv and run uvicorn (foreground - Ctrl+C to stop)
& $VenvActivate
Set-Location $BackendDir
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
