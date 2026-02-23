@echo off
echo.
echo ========================================
echo   PhonePe Edge Function Redeploy
echo ========================================
echo.
echo IMPORTANT: Before running this script:
echo 1. Go to: https://supabase.com/dashboard/project/oikibnfnhauymhfpxiwi/settings/functions
echo 2. Change PHONEPE_ENV from "SANDBOX" to "PRODUCTION"
echo 3. Click Save
echo 4. Then run this script
echo.
pause
echo.
echo Redeploying phonepe-initiate function...
supabase functions deploy phonepe-initiate --project-ref oikibnfnhauymhfpxiwi --no-verify-jwt
echo.
echo Redeploying phonepe-check-status function...
supabase functions deploy phonepe-check-status --project-ref oikibnfnhauymhfpxiwi --no-verify-jwt
echo.
echo Redeploying phonepe-webhook function...
supabase functions deploy phonepe-webhook --project-ref oikibnfnhauymhfpxiwi --no-verify-jwt
echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Now test your online payment at your website.
echo.
pause
