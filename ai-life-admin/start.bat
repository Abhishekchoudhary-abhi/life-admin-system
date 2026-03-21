@echo off
echo ================================
echo    Starting AI Life Admin...
echo ================================
echo.

echo Starting API Server...
start "API Server" cmd /k "cd /d D:\Life-Admin\ai-life-admin && venv\Scripts\activate && uvicorn backend.main:app --reload --port 8000"

timeout /t 4 /nobreak > nul

echo Starting Telegram Bot...
start "Telegram Bot" cmd /k "cd /d D:\Life-Admin\ai-life-admin && venv\Scripts\activate && python -m backend.telegram_bot"

timeout /t 2 /nobreak > nul

echo Starting Frontend...
start "Frontend" cmd /k "cd /d D:\Life-Admin\frontend && npm run dev"

echo.
echo ================================
echo All services started!
echo ================================
echo.
echo API Docs:   http://localhost:8000/docs
echo Dashboard:  http://localhost:3000
echo Telegram:   Open your bot and type /start
echo.
pause
```

