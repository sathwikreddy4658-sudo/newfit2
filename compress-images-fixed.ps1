# Image Compression Script - Preserves Transparency!
# Compresses PNG (keeps transparency) and JPEG separately

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Image Compression (Transparency Safe)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if npm is available
$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
    Write-Host "[ERROR] Node.js/npm not found!" -ForegroundColor Red
    Write-Host "Please install Node.js first." -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "[1/5] Installing Squoosh CLI..." -ForegroundColor Yellow
Write-Host "This might take 30-60 seconds..." -ForegroundColor Gray
npm install -g @squoosh/cli 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[INFO] Squoosh CLI already installed or installation failed" -ForegroundColor Gray
}
Write-Host ""

Write-Host "[2/5] Finding images in project..." -ForegroundColor Yellow
$publicPath = ".\public"
$srcPath = ".\src"
$distPath = ".\dist"

# Find image folders
$imageFolders = @()
if (Test-Path $publicPath) { $imageFolders += Get-ChildItem -Path $publicPath -Recurse -Directory | Where-Object { $_.GetFiles("*.png").Count -gt 0 -or $_.GetFiles("*.jpg").Count -gt 0 } }
if (Test-Path "$srcPath\assets") { $imageFolders += "$srcPath\assets" }

if ($imageFolders.Count -eq 0) {
    Write-Host "[ERROR] No image folders found!" -ForegroundColor Red
    Write-Host "Please ensure you have images in public/ or src/assets/" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "Found image folders:" -ForegroundColor Green
foreach ($folder in $imageFolders) {
    Write-Host "  - $folder" -ForegroundColor White
}
Write-Host ""

# Ask user to confirm
$confirm = Read-Host "Compress images in these folders? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}
Write-Host ""

Write-Host "[3/5] Creating backups..." -ForegroundColor Yellow
$backupFolder = ".\images-backup-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null

foreach ($folder in $imageFolders) {
    $images = Get-ChildItem -Path $folder -Include *.png,*.jpg,*.jpeg -File
    foreach ($image in $images) {
        $backupPath = Join-Path $backupFolder $image.Name
        Copy-Item $image.FullName $backupPath -Force
    }
}
Write-Host "[SUCCESS] Backup created: $backupFolder" -ForegroundColor Green
Write-Host ""

Write-Host "[4/5] Compressing images..." -ForegroundColor Yellow
Write-Host ""

$totalSaved = 0
$processedCount = 0

foreach ($folder in $imageFolders) {
    Write-Host "Processing: $folder" -ForegroundColor Cyan
    
    # Get PNG files (keep transparency)
    $pngFiles = Get-ChildItem -Path $folder -Filter *.png -File
    if ($pngFiles.Count -gt 0) {
        Write-Host "  PNG files (keeping transparency):" -ForegroundColor Yellow
        foreach ($png in $pngFiles) {
            $originalSize = $png.Length
            
            # Compress PNG with OxiPNG (keeps transparency!)
            Write-Host "    Compressing: $($png.Name)..." -ForegroundColor Gray
            npx @squoosh/cli --oxipng '{"level":3}' -d $folder $png.FullName 2>$null
            
            # Check new size
            $newFile = Get-Item $png.FullName
            $newSize = $newFile.Length
            $saved = $originalSize - $newSize
            $totalSaved += $saved
            $processedCount++
            
            $savedPercent = [math]::Round(($saved / $originalSize) * 100, 1)
            $originalMB = [math]::Round($originalSize / 1MB, 2)
            $newMB = [math]::Round($newSize / 1MB, 2)
            
            Write-Host "      $($png.Name): $originalMB MB → $newMB MB (saved $savedPercent%)" -ForegroundColor Green
        }
    }
    
    # Get JPG files
    $jpgFiles = Get-ChildItem -Path $folder -Include *.jpg,*.jpeg -File
    if ($jpgFiles.Count -gt 0) {
        Write-Host "  JPEG files:" -ForegroundColor Yellow
        foreach ($jpg in $jpgFiles) {
            $originalSize = $jpg.Length
            
            # Compress JPEG
            Write-Host "    Compressing: $($jpg.Name)..." -ForegroundColor Gray
            npx @squoosh/cli --mozjpeg '{"quality":85}' -d $folder $jpg.FullName 2>$null
            
            # Check new size
            $newFile = Get-Item $jpg.FullName
            $newSize = $newFile.Length
            $saved = $originalSize - $newSize
            $totalSaved += $saved
            $processedCount++
            
            $savedPercent = [math]::Round(($saved / $originalSize) * 100, 1)
            $originalMB = [math]::Round($originalSize / 1MB, 2)
            $newMB = [math]::Round($newSize / 1MB, 2)
            
            Write-Host "      $($jpg.Name): $originalMB MB → $newMB MB (saved $savedPercent%)" -ForegroundColor Green
        }
    }
    
    Write-Host ""
}

Write-Host ""
Write-Host "[5/5] Compression Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
$totalSavedMB = [math]::Round($totalSaved / 1MB, 2)
Write-Host "Total files processed: $processedCount" -ForegroundColor White
Write-Host "Total space saved: $totalSavedMB MB" -ForegroundColor Green
Write-Host "Backup location: $backupFolder" -ForegroundColor White
Write-Host ""
Write-Host "✅ PNG files: Transparency PRESERVED" -ForegroundColor Green
Write-Host "✅ JPEG files: Compressed at 85% quality" -ForegroundColor Green
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Build your project: npm run build" -ForegroundColor White
Write-Host "2. Deploy: vercel --prod (or firebase deploy)" -ForegroundColor White
Write-Host "3. If images look wrong, restore from: $backupFolder" -ForegroundColor White
Write-Host ""
Write-Host "Compression complete! 🚀" -ForegroundColor Green
Write-Host ""
pause
