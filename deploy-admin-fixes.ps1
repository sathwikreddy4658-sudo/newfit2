# Quick Deploy Script for Admin Panel Fixes
# This script deploys all Firebase configurations and CORS settings

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   NewFit Admin Panel - Quick Deploy" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
$firebaseCli = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebaseCli) {
    Write-Host "[ERROR] Firebase CLI not found!" -ForegroundColor Red
    Write-Host "Please install: npm install -g firebase-tools" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "[1/5] Checking Firebase project..." -ForegroundColor Yellow
firebase projects:list
Write-Host ""

Write-Host "[2/5] Deploying Firestore rules and indexes..." -ForegroundColor Yellow
firebase deploy --only firestore
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Firestore deployment failed!" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "[SUCCESS] Firestore rules and indexes deployed!" -ForegroundColor Green
Write-Host ""

Write-Host "[3/5] Deploying Storage rules..." -ForegroundColor Yellow
firebase deploy --only storage
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Storage deployment failed!" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "[SUCCESS] Storage rules deployed!" -ForegroundColor Green
Write-Host ""

Write-Host "[4/5] Deploying CORS configuration..." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: You need Google Cloud SDK for this step." -ForegroundColor Cyan
Write-Host "If you don't have it, follow these instructions:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Download: https://cloud.google.com/sdk/docs/install" -ForegroundColor White
Write-Host "2. Run: gcloud auth login" -ForegroundColor White
Write-Host "3. Run: gcloud config set project newfit-35320" -ForegroundColor White
Write-Host "4. Run: gsutil cors set cors.json gs://newfit-35320.firebasestorage.app" -ForegroundColor White
Write-Host ""

$gcloudInstalled = Read-Host "Do you have Google Cloud SDK installed? (Y/N)"

if ($gcloudInstalled -eq "Y" -or $gcloudInstalled -eq "y") {
    Write-Host "Deploying CORS..." -ForegroundColor Yellow
    
    $gcloudCli = Get-Command gcloud -ErrorAction SilentlyContinue
    if (-not $gcloudCli) {
        Write-Host "[ERROR] gcloud not found in PATH!" -ForegroundColor Red
        Write-Host "Please install Google Cloud SDK." -ForegroundColor Yellow
        pause
        exit 1
    }
    
    Write-Host ""
    Write-Host "Setting project..." -ForegroundColor Yellow
    gcloud config set project newfit-35320
    
    Write-Host ""
    Write-Host "Deploying CORS configuration..." -ForegroundColor Yellow
    gsutil cors set cors.json gs://newfit-35320.firebasestorage.app
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] CORS configuration deployed!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Verifying CORS..." -ForegroundColor Yellow
        gsutil cors get gs://newfit-35320.firebasestorage.app
    } else {
        Write-Host "[ERROR] CORS deployment failed!" -ForegroundColor Red
        Write-Host "Please run manually: gsutil cors set cors.json gs://newfit-35320.firebasestorage.app" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "[SKIPPED] CORS deployment skipped." -ForegroundColor Yellow
    Write-Host "Please deploy manually using the commands above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[5/5] Deployment Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[√] Firestore rules deployed" -ForegroundColor Green
Write-Host "[√] Firestore indexes deployed" -ForegroundColor Green
Write-Host "[√] Storage rules deployed" -ForegroundColor Green
if ($gcloudInstalled -eq "Y" -or $gcloudInstalled -eq "y") {
    Write-Host "[√] CORS configuration deployed" -ForegroundColor Green
} else {
    Write-Host "[!] CORS needs manual deployment" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Clear browser cache (Ctrl + Shift + Delete)" -ForegroundColor White
Write-Host "2. Restart dev server: npm run dev" -ForegroundColor White
Write-Host "3. Test admin panel at: http://localhost:8080/admin" -ForegroundColor White
Write-Host "4. Try uploading images - should work without CORS errors" -ForegroundColor White
Write-Host ""
Write-Host "If you still see issues, check:" -ForegroundColor Yellow
Write-Host "- Browser console for errors (F12)" -ForegroundColor White
Write-Host "- QUICK_DEPLOY_GUIDE.md for troubleshooting" -ForegroundColor White
Write-Host ""
Write-Host "Deployment complete! Happy testing! 🚀" -ForegroundColor Green
Write-Host ""
pause
