@echo off
echo ================================
echo    Starting AI Life Admin...
echo ================================
echo.

echo Starting API Server...
start "API Server" cmd /k "cd /d D:\Life-Admin\ai-life-admin && venv\Scripts\activate && uvicorn backend.main:app --reload --port 8000"

echo Waiting for API to start...
timeout /t 4 /nobreak > nul

echo Starting Telegram Bot...
start "Telegram Bot" cmd /k "cd /d D:\Life-Admin\ai-life-admin && venv\Scripts\activate && python -m backend.telegram_bot"

echo.
echo ================================
echo All services started!
echo ================================
echo.
echo API Docs:  http://localhost:8000/docs
echo Telegram:  Open your bot and type /start
echo.
echo You can close this window now.
pause
