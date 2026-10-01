$ErrorActionPreference = "Stop"

Write-Host "== Al Malqa Menu bootstrap (Windows PowerShell) ==" -ForegroundColor Cyan

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "pnpm غير موجود. محاولة تفعيله عبر Corepack..." -ForegroundColor Yellow
    corepack enable
    corepack prepare pnpm@10.17.1 --activate
}

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "تم إنشاء .env من .env.example" -ForegroundColor Green
}

Write-Host "تثبيت الاعتمادات..." -ForegroundColor Cyan
pnpm install

Write-Host "فحص هيكل المشروع..." -ForegroundColor Cyan
pnpm verify:structure

Write-Host "فحص TypeScript..." -ForegroundColor Cyan
pnpm typecheck

Write-Host "اكتمل الإعداد. شغّل الآن: pnpm dev" -ForegroundColor Green
