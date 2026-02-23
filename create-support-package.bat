@echo off
echo Creating PhonePe functions package for Supabase support...
echo.

cd /d "d:\New folder (2)\newfit2"

REM Create a zip file with the functions
powershell -Command "Compress-Archive -Path 'supabase\functions\phonepe-*' -DestinationPath 'phonepe-functions-for-support.zip' -Force"

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo SUCCESS! Package created:
    echo phonepe-functions-for-support.zip
    echo ============================================
    echo.
    echo This package contains:
    echo - phonepe-initiate function
    echo - phonepe-check-status function
    echo - phonepe-webhook function
    echo.
    echo NEXT STEPS:
    echo.
    echo 1. Email: support@supabase.io
    echo 2. Subject: Deploy Edge Functions for Project oikibnfnhauymhfpxiwi
    echo 3. Attach: phonepe-functions-for-support.zip
    echo 4. Request: Deploy with --no-verify-jwt flag
    echo.
    echo Email template saved in: PHONEPE_DEPLOYMENT_ALTERNATIVES.md
    echo.
    start .
) else (
    echo ERROR: Failed to create package
    echo Please manually zip the following folders and send to support:
    echo - supabase\functions\phonepe-initiate
    echo - supabase\functions\phonepe-check-status
    echo - supabase\functions\phonepe-webhook
)

pause
