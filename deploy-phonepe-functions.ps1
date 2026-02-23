# PhonePe Edge Functions Deployment Script
# Run this in PowerShell

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PhonePe Edge Functions Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install Supabase CLI
Write-Host "Step 1: Installing Supabase CLI..." -ForegroundColor Yellow
Write-Host ""
try {
    npm install -g supabase
    Write-Host "Supabase CLI installed" -ForegroundColor Green
} catch {
    Write-Host "Failed to install Supabase CLI" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Login
Write-Host "Step 2: Logging in to Supabase..." -ForegroundColor Yellow
Write-Host "(This will open your browser for authentication)" -ForegroundColor Gray
Write-Host ""
try {
    supabase login
    Write-Host "Logged in successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to login" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Link project
Write-Host "Step 3: Linking to your Supabase project..." -ForegroundColor Yellow
Write-Host ""
try {
    supabase link --project-ref oikibnfnhauymhfpxiwi
    Write-Host "Project linked" -ForegroundColor Green
} catch {
    Write-Host "Failed to link project" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Tip: Make sure you are logged in and have access to project oikibnfnhauymhfpxiwi" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 4-6: Deploy functions
$functions = @("phonepe-initiate", "phonepe-check-status", "phonepe-webhook")
$step = 4

foreach ($func in $functions) {
    Write-Host "Step ${step}: Deploy ${func} function..." -ForegroundColor Yellow
    Write-Host ""
    try {
        supabase functions deploy $func --no-verify-jwt
        Write-Host "${func} deployed successfully" -ForegroundColor Green
    } catch {
        Write-Host "${func} deployment had issues" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
    }
    Write-Host ""
    $step++
}

# Step 7: Verify deployment
Write-Host "Step 7: Verifying deployment..." -ForegroundColor Yellow
Write-Host ""
try {
    supabase functions list
    Write-Host ""
    Write-Host "Deployment verification complete" -ForegroundColor Green
} catch {
    Write-Host "Could not list functions" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to: https://supabase.com/dashboard/project/oikibnfnhauymhfpxiwi/settings/functions" -ForegroundColor White
Write-Host "2. Click Secrets tab" -ForegroundColor White
Write-Host "3. Add these 4 secrets:" -ForegroundColor White
Write-Host ""
Write-Host "   PHONEPE_MERCHANT_ID = M23DXJKWOH2QZ" -ForegroundColor Cyan
Write-Host "   PHONEPE_CLIENT_ID = SU2511071520405754774079" -ForegroundColor Cyan
Write-Host "   PHONEPE_CLIENT_SECRET = c70dce3a-c985-4237-add4-b8b9ad647bbf" -ForegroundColor Cyan
Write-Host "   PHONEPE_API_URL = https://api.phonepe.com/apis/pg" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Click Save" -ForegroundColor White
Write-Host "5. Test your payment flow" -ForegroundColor White
Write-Host ""
Write-Host "To test, open browser console and run the test from FIX_PHONEPE_DEPLOYMENT.md" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"
