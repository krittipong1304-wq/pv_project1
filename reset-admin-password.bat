@echo off
cd /d "%~dp0"
title Reset FloorCraft Admin Password
node backend\scripts\reset-admin-password.js
pause
