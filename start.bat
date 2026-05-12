@echo off
echo Installing dependencies...
call npm install
echo.
echo Starting DesaConnect...
echo Open http://localhost:5173 in your browser when ready.
echo Press Ctrl+C to stop the server.
echo.
call npm run dev
pause
