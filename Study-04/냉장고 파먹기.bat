@echo off
chcp 65001 >nul
title 냉장고 파먹기

cd /d "%~dp0"

echo.
echo  =============================
echo    냉장고 파먹기 앱 시작 중...
echo  =============================
echo.

start "" http://localhost:3000

call npm run dev
