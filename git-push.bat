@echo off
echo ============================================
echo Git Commit and Push
echo ============================================
echo.

cd /d "d:\New folder (2)\newfit2"

REM Check if git is initialized
if not exist .git (
    echo Initializing git repository...
    git init
    git branch -M main
    echo.
)

REM Add all files
echo Adding files to git...
git add .
echo.

REM Commit
echo Enter commit message:
set /p commit_msg="Message: "
if "%commit_msg%"=="" set commit_msg="Update: Production deployment ready"

git commit -m "%commit_msg%"
echo.

REM Check if remote exists
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo.
    echo ============================================
    echo Remote repository not configured
    echo ============================================
    echo.
    echo Please create a GitHub repository first, then run:
    echo git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
    echo git push -u origin main
    echo.
    pause
    exit /b 0
)

REM Push
echo Pushing to GitHub...
git push
if errorlevel 1 (
    echo.
    echo First time pushing? Run:
    echo git push -u origin main
    echo.
)

echo.
echo ============================================
echo Git push complete!
echo ============================================
echo.
echo Next steps:
echo 1. Go to https://vercel.com/new
echo 2. Import your GitHub repository
echo 3. Add environment variables from .env
echo 4. Deploy!
echo.
pause
