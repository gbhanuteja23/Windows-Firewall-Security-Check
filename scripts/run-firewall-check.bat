@echo off
setlocal enabledelayedexpansion

title Windows Firewall Security Check Launcher
cls

echo ==============================================================================
echo        WINDOWS FIREWALL SECURITY CHECK - 1-CLICK LAUNCHER
echo        Backend Host: WSL 2 Ubuntu 22.04 Docker Container
echo        Fixed Port  : 8090
echo ==============================================================================
echo.

set PORT=8090
set CONTAINER_NAME=windows-firewall-backend
set IMAGE_NAME=windows-firewall-security-check:latest
set URL=http://localhost:%PORT%

rem 1. Check if Docker CLI is responsive
echo [*] Checking Docker daemon status...
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker is not detected in your PATH or Docker Desktop is not running.
    echo Please start Docker Desktop or the WSL 2 Docker service and try again.
    echo.
    pause
    exit /b 1
)

rem 2. Check if container is running
echo [*] Checking container '%CONTAINER_NAME%'...
docker ps --filter "name=^/%CONTAINER_NAME%$" --format "{{.Names}}" | findstr /i "%CONTAINER_NAME%" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [+] Container '%CONTAINER_NAME%' is already running on port %PORT%.
    goto WAIT_HEALTH
)

rem 3. Check if stopped container exists
docker ps -a --filter "name=^/%CONTAINER_NAME%$" --format "{{.Names}}" | findstr /i "%CONTAINER_NAME%" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [*] Starting existing container '%CONTAINER_NAME%'...
    docker start %CONTAINER_NAME% >nul
    goto WAIT_HEALTH
)

rem 4. Build and start new container
echo [*] Building Ubuntu 22.04 backend image '%IMAGE_NAME%'...
pushd "%~dp0.."
docker build -t %IMAGE_NAME% -f Dockerfile .
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker build failed.
    popd
    pause
    exit /b 1
)

echo [*] Starting container '%CONTAINER_NAME%' on port %PORT%...
docker run -d --name %CONTAINER_NAME% -p %PORT%:8080 --restart unless-stopped %IMAGE_NAME% >nul
popd

:WAIT_HEALTH
echo [*] Waiting for security backend readiness at %URL%/api/health...
set RETRIES=0

:HEALTH_LOOP
curl -s -f "%URL%/api/health" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [+] Backend is UP and HEALTHY on port %PORT%!
    goto LAUNCH_CHROME
)

timeout /t 1 /nobreak >nul
set /a RETRIES+=1
if %RETRIES% geq 20 (
    echo [WARNING] Backend took longer than expected to report healthy.
    echo Proceeding to launch browser anyway...
    goto LAUNCH_CHROME
)
echo     ...waiting for service initialization (%RETRIES%/20)
goto HEALTH_LOOP

:LAUNCH_CHROME
echo [*] Launching Google Chrome to %URL%...

rem Try standard Chrome installation paths
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" "%URL%"
    goto FINISH
)

if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" "%URL%"
    goto FINISH
)

if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" "%URL%"
    goto FINISH
)

rem Try launch via cmd PATH
start chrome "%URL%" >nul 2>&1
if %ERRORLEVEL% equ 0 goto FINISH

rem Fallback to default browser
echo [*] Chrome executable not found at standard paths. Opening default browser...
start "" "%URL%"

:FINISH
echo.
echo ==============================================================================
echo  [SUCCESS] Windows Firewall Security Check is active!
echo  URL: %URL%
echo ==============================================================================
echo.
pause
