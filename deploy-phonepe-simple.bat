@echo off
echo ============================================
echo PhonePe Edge Functions Deployment
echo ============================================
echo.

REM Step 1: Check if npm is installed
echo Step 1: Checking npm installation...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm not found. Please install Node.js from https://nodejs.org/
    echo Press any key to open Node.js download page...
    pause
    start https://nodejs.org/en/download/
    exit /b 1
)
echo npm found!
echo.

REM Step 2: Install Supabase CLI
echo Step 2: Installing Supabase CLI...
call npm install -g supabase
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Supabase CLI
    pause
    exit /b 1
)
echo Supabase CLI installed!
echo.

REM Step 3: Login
echo Step 3: Logging in to Supabase...
echo This will open your browser for authentication
echo.
call supabase login
if %errorlevel% neq 0 (
    echo ERROR: Login failed
    echo.
    echo Alternative: Use access token
    echo 1. Go to: https://app.supabase.com/account/tokens
    echo 2. Generate access token
    echo 3. Set environment variable: set SUPABASE_ACCESS_TOKEN=your-token
    echo 4. Run this script again
    pause
    exit /b 1
)
echo Logged in successfully!
echo.

REM Step 4: Link project
echo Step 4: Linking to Supabase project...
call supabase link --project-ref oikibnfnhauymhfpxiwi
if %errorlevel% neq 0 (
    echo ERROR: Failed to link project
    echo Make sure you have access to project: oikibnfnhauymhfpxiwi
    pause
    exit /b 1
)
echo Project linked!
echo.

REM Step 5: Deploy functions
echo Step 5: Deploying phonepe-initiate...
call supabase functions deploy phonepe-initiate --no-verify-jwt
if %errorlevel% neq 0 (
    echo WARNING: phonepe-initiate deployment had issues
) else (
    echo phonepe-initiate deployed successfully!
)
echo.

echo Step 6: Deploying phonepe-check-status...
call supabase functions deploy phonepe-check-status --no-verify-jwt
if %errorlevel% neq 0 (
    echo WARNING: phonepe-check-status deployment had issues
) else (
    echo phonepe-check-status deployed successfully!
)
echo.

echo Step 7: Deploying phonepe-webhook...
call supabase functions deploy phonepe-webhook --no-verify-jwt
if %errorlevel% neq 0 (
    echo WARNING: phonepe-webhook deployment had issues
) else (
    echo phonepe-webhook deployed successfully!
)
echo.

REM Step 8: Verify
echo Step 8: Verifying deployment...
call supabase functions list
echo.

echo ============================================
echo Deployment Complete!
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
echo 4. Save and test your payment!
echo.
pause
