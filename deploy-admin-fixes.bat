@echo off
REM Quick Deploy Script for Admin Panel Fixes
REM This script deploys all Firebase configurations and CORS settings

echo ============================================
echo    NewFit Admin Panel - Quick Deploy
echo ============================================
echo.

REM Check if Firebase CLI is installed
where firebase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Firebase CLI not found!
    echo Please install: npm install -g firebase-tools
    echo.
    pause
    exit /b 1
)

echo [1/5] Checking Firebase project...
firebase projects:list
echo.

echo [2/5] Deploying Firestore rules and indexes...
firebase deploy --only firestore
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Firestore deployment failed!
    pause
    exit /b 1
)
echo [SUCCESS] Firestore rules and indexes deployed!
echo.

echo [3/5] Deploying Storage rules...
firebase deploy --only storage
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Storage deployment failed!
    pause
    exit /b 1
)
echo [SUCCESS] Storage rules deployed!
echo.

echo [4/5] Deploying CORS configuration...
echo.
echo IMPORTANT: You need Google Cloud SDK for this step.
echo If you don't have it, follow these instructions:
echo.
echo 1. Download: https://cloud.google.com/sdk/docs/install
echo 2. Run: gcloud auth login
echo 3. Run: gcloud config set project newfit-35320
echo 4. Run: gsutil cors set cors.json gs://newfit-35320.firebasestorage.app
echo.
echo Do you have Google Cloud SDK installed? (Y/N)
set /p GCLOUD_INSTALLED=

if /i "%GCLOUD_INSTALLED%"=="Y" (
    echo Deploying CORS...
    where gcloud >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] gcloud not found in PATH!
        echo Please install Google Cloud SDK.
        pause
        exit /b 1
    )
    
    echo.
    echo Setting project...
    gcloud config set project newfit-35320
    
    echo.
    echo Deploying CORS configuration...
    gsutil cors set cors.json gs://newfit-35320.firebasestorage.app
    
    if %ERRORLEVEL% EQU 0 (
        echo [SUCCESS] CORS configuration deployed!
        echo.
        echo Verifying CORS...
        gsutil cors get gs://newfit-35320.firebasestorage.app
    ) else (
        echo [ERROR] CORS deployment failed!
        echo Please run manually: gsutil cors set cors.json gs://newfit-35320.firebasestorage.app
    )
) else (
    echo.
    echo [SKIPPED] CORS deployment skipped.
    echo Please deploy manually using the commands above.
)

echo.
echo [5/5] Deployment Summary
echo ============================================
echo.
echo [√] Firestore rules deployed
echo [√] Firestore indexes deployed
echo [√] Storage rules deployed
if /i "%GCLOUD_INSTALLED%"=="Y" (
    echo [√] CORS configuration deployed
) else (
    echo [!] CORS needs manual deployment
)
echo.
echo ============================================
echo.
echo Next Steps:
echo 1. Clear browser cache (Ctrl + Shift + Delete)
echo 2. Restart dev server: npm run dev
echo 3. Test admin panel at: http://localhost:8080/admin
echo 4. Try uploading images - should work without CORS errors
echo.
echo If you still see issues, check:
echo - Browser console for errors (F12)
echo - QUICK_DEPLOY_GUIDE.md for troubleshooting
echo.
echo Deployment complete! Happy testing! 🚀
echo.
pause
