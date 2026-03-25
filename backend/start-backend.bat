@echo off
cd /d "%~dp0"
title FloorCraft Backend
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5001 ^| findstr LISTENING') do (
  taskkill /PID %%a /F >nul 2>nul
)
npm.cmd run dev
