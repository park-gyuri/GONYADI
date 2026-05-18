<#
.SYNOPSIS
    GONYADI 프로젝트 백엔드 + DB 원커맨드 시작 스크립트 (Mac용)

.DESCRIPTION
    1) Docker Desktop 실행 여부 확인
    2) PostgreSQL 컨테이너 자동 시작 (꺼져 있으면)
    3) DB 연결 가능할 때까지 대기
    4) Python venv -> uvicorn 백엔드 서버 시작

.USAGE
    pwsh ./start-mac.ps1
#>

$ErrorActionPreference = "Stop"

# -- 색상 유틸 --
function Write-Step($msg) { Write-Host "`n>> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "   [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "   [!!] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "   [ERR] $msg" -ForegroundColor Red }

# -- 경로 설정 --
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir  = Join-Path $ProjectRoot "backend"
$EnvFile     = Join-Path $BackendDir ".env"
$PythonExe   = Join-Path $BackendDir "venv/bin/python"

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
Write-Step "Checking Docker Desktop..."

$dockerRunning = $false
try {
    $null = docker info 2>$null
    $dockerRunning = $true
} catch {}

if (-not $dockerRunning) {
    Write-Warn "Docker Desktop is not running."
    Write-Host "   Docker Desktop 앱을 먼저 켜주세요!" -ForegroundColor Gray
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
    docker start $containerName 2>$null
    Write-Ok "Container '$containerName' started"
}

Write-Step "Waiting for DB connection..."
$maxRetries = 15
$retry = 0
while ($retry -lt $maxRetries) {
    $retry++
    try {
        docker exec $containerName pg_isready -U $env:DB_USER 2>$null | Out-Null
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

# ==============================================================
# STEP 2: Backend Server
# ==============================================================
Write-Step "Starting backend server..."

if (-not (Test-Path $PythonExe)) {
    Write-Err "Python venv not found: $PythonExe"
    Write-Host "   Create it first: python3 -m venv backend/venv" -ForegroundColor Gray
    exit 1
}

# Show current IP
try {
    $localIP = bash -c "ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null"
    if ($localIP) {
        Write-Ok "Current Mac IP: $localIP"
    }
} catch {}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  GONYADI Backend Server Starting" -ForegroundColor White
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor Gray
Write-Host "  Stop: Ctrl+C" -ForegroundColor Gray
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Run uvicorn
Set-Location $BackendDir
& $PythonExe -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
