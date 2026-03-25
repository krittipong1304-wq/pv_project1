@echo off
cd /d "%~dp0"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5001 ^| findstr LISTENING') do (
  taskkill /PID %%a /F >nul 2>nul
)
start "FloorCraft Backend" cmd /k "cd /d \"%~dp0..\\backend\" && npm.cmd run dev"
timeout /t 3 /nobreak >nul
start "FloorCraft Frontend" cmd /k ""%~dp0start-frontend.bat""
