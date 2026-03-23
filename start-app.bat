@echo off
cd /d "%~dp0"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
  taskkill /PID %%a /F >nul 2>nul
)
start "FloorCraft Backend" cmd /k ""%~dp0start-backend.bat""
timeout /t 3 /nobreak >nul
start "FloorCraft Frontend" cmd /k ""%~dp0start-frontend.bat""
