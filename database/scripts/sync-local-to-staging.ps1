# database/scripts/sync-local-to-staging.ps1
# ローカルD1データベースからステージング環境への同期（PowerShell版）

$ErrorActionPreference = "Stop"

# プロジェクトルートに移動
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Join-Path $scriptPath "..\.."
Set-Location $projectRoot

# バックアップディレクトリの作成
$backupDir = "database\backups\$(Get-Date -Format 'yyyy-MM-dd')"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
$backupFile = Join-Path $backupDir "staging_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

Write-Host "[INFO] ローカルD1からステージング環境への同期を開始します..." -ForegroundColor Green

# 1. ステージング環境のバックアップ（念のため）
Write-Host "[INFO] ステージング環境のバックアップを取得中..." -ForegroundColor Green
try {
    npx wrangler d1 export stats47_staging --env staging --remote --output="$backupFile" 2>&1 | Out-Null
    Write-Host "[INFO] バックアップファイル: $backupFile" -ForegroundColor Green
} catch {
    Write-Host "[WARN] ステージング環境のバックアップ取得に失敗しましたが、続行します" -ForegroundColor Yellow
}

# 2. ローカルD1のエクスポート
Write-Host "[INFO] ローカルD1のエクスポート中..." -ForegroundColor Green
$localDumpFile = Join-Path $backupDir "local_dump_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

# ローカルD1ファイルの存在確認
$localDbFile = ".wrangler\state\v3\d1\miniflare-D1DatabaseObject\b3c084603f7be30f18c6a887d294217e3e6b2010e83e9d09910eae3515a26884.sqlite"
if (-not (Test-Path $localDbFile)) {
    Write-Host "[ERROR] ローカルD1データベースファイルが見つかりません: $localDbFile" -ForegroundColor Red
    Write-Host "[INFO] まず、ローカルD1を初期化してください: npm run db:init:local" -ForegroundColor Yellow
    exit 1
}

try {
    npx wrangler d1 export stats47 --local --output="$localDumpFile" 2>&1 | Out-Null
    Write-Host "[INFO] エクスポートファイル: $localDumpFile" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] ローカルD1のエクスポートに失敗しました" -ForegroundColor Red
    exit 1
}

# 3. ステージング環境へのマイグレーション適用（念のため）
Write-Host "[INFO] ステージング環境のマイグレーションを確認中..." -ForegroundColor Green
try {
    npx wrangler d1 migrations apply stats47_staging --env staging --remote 2>&1 | Out-Null
    Write-Host "[INFO] マイグレーションの適用が完了しました" -ForegroundColor Green
} catch {
    Write-Host "[WARN] マイグレーションの適用に問題がありましたが、続行します" -ForegroundColor Yellow
}

# 4. ステージング環境へのインポート
Write-Host "[INFO] ステージング環境にローカルD1のデータをインポート中..." -ForegroundColor Green
try {
    npx wrangler d1 execute stats47_staging --env staging --remote --file="$localDumpFile" 2>&1 | Out-Null
    Write-Host "[INFO] データのインポートが完了しました" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] ステージング環境へのインポートに失敗しました" -ForegroundColor Red
    Write-Host "[INFO] バックアップからリストアする場合: npx wrangler d1 execute stats47_staging --env staging --remote --file=$backupFile" -ForegroundColor Yellow
    exit 1
}

# 5. 同期結果の確認
Write-Host "[INFO] 同期結果を確認中..." -ForegroundColor Green
try {
    npx wrangler d1 execute stats47_staging --env staging --remote --command @"
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'ranking_groups', COUNT(*) FROM ranking_groups
UNION ALL
SELECT 'estat_metainfo', COUNT(*) FROM estat_metainfo
UNION ALL
SELECT 'articles', COUNT(*) FROM articles
"@ 2>&1 | Out-Null
    Write-Host "[INFO] データ確認が完了しました" -ForegroundColor Green
} catch {
    Write-Host "[WARN] データ確認に失敗しましたが、同期は完了しています" -ForegroundColor Yellow
}

Write-Host "[INFO] 同期が完了しました！" -ForegroundColor Green
Write-Host "[INFO] バックアップファイル: $backupFile" -ForegroundColor Green
Write-Host "[INFO] エクスポートファイル: $localDumpFile" -ForegroundColor Green
Write-Host ""
Write-Host "[INFO] 次のステップ:" -ForegroundColor Green
Write-Host "  1. ステージング環境で動作確認: https://staging.stats47.pages.dev" -ForegroundColor Yellow
Write-Host "  2. 問題がある場合はバックアップからリストア可能" -ForegroundColor Yellow

