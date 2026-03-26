@echo off
echo Starting HearMe Feedback Server...
echo.
cd /d "C:\Users\Shivam Jaiswal\feedbackform_project_finl-review"
:start
node server.js
echo.
echo Server crashed or stopped. Restarting in 5 seconds...
timeout /t 5 /nobreak >nul
goto start
