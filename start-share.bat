@echo off
cd /d "%~dp0"
set HOST=0.0.0.0
echo Starting LAN share profile server...
echo.
node server.js
pause
