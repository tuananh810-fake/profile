@echo off
cd /d "%~dp0"
set HOST=127.0.0.1
echo Starting local-only profile server...
echo.
node server.js
pause
