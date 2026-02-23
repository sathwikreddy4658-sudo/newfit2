@echo off
echo ============================================
echo   PhonePe Edge Functions Deployment
echo ============================================
echo.
echo Step 1: Installing Supabase CLI...
echo.
call npm install -g supabase
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Supabase CLI
    pause
    exit /b 1
)

echo.
echo Step 2: Logging in to Supabase...
echo (This will open your browser)
echo.
call supabase login
if %errorlevel% neq 0 (
    echo ERROR: Failed to login
    pause
    exit /b 1
)

echo.
echo Step 3: Linking to your project...
echo.
call supabase link --project-ref oikibnfnhauymhfpxiwi
if %errorlevel% neq 0 (
    echo ERROR: Failed to link project
    pause
    exit /b 1
)

echo.
echo Step 4: Deploying phonepe-initiate function...
echo.
call supabase functions deploy phonepe-initiate --no-verify-jwt
if %errorlevel% neq 0 (
    echo WARNING: phonepe-initiate deployment had issues
)

echo.
echo Step 5: Deploying phonepe-check-status function...
echo.
call supabase functions deploy phonepe-check-status --no-verify-jwt
if %errorlevel% neq 0 (
    echo WARNING: phonepe-check-status deployment had issues
)

echo.
echo Step 6: Deploying phonepe-webhook function...
echo.
call supabase functions deploy phonepe-webhook --no-verify-jwt
if %errorlevel% neq 0 (
    echo WARNING: phonepe-webhook deployment had issues
)

echo.
echo Step 7: Verifying deployment...
echo.
call supabase functions list

echo.
echo ============================================
echo   Deployment Complete!
echo ============================================
echo.
echo NEXT STEPS:
echo.
echo 1. Go to: https://supabase.com/dashboard/project/oikibnfnhauymhfpxiwi/settings/functions
echo 2. Click "Secrets" tab
echo 3. Add these 4 secrets:
echo.
echo    PHONEPE_MERCHANT_ID = M23DXJKWOH2QZ
echo    PHONEPE_CLIENT_ID = SU2511071520405754774079
echo    PHONEPE_CLIENT_SECRET = c70dce3a-c985-4237-add4-b8b9ad647bbf
echo    PHONEPE_API_URL = https://api.phonepe.com/apis/pg
echo.
echo 4. Click Save
echo 5. Test your payment flow!
echo.
pause
