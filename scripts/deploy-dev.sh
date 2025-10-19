#!/bin/bash
# 開発環境デプロイスクリプト

echo "🚀 Deploying to development environment..."

# 環境変数の確認
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "❌ CLOUDFLARE_API_TOKEN is not set"
  echo "Please set your Cloudflare API token:"
  echo "export CLOUDFLARE_API_TOKEN=your_token_here"
  exit 1
fi

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo "❌ CLOUDFLARE_ACCOUNT_ID is not set"
  echo "Please set your Cloudflare Account ID:"
  echo "export CLOUDFLARE_ACCOUNT_ID=your_account_id_here"
  exit 1
fi

# ビルド
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

# デプロイ
echo "☁️ Deploying to Cloudflare Pages..."
npx wrangler pages deploy .next --project-name=stats47-dev

if [ $? -eq 0 ]; then
  echo "✅ Deployment completed!"
  echo "🌐 Development URL: https://dev.stats47.com"
  echo "📊 Cloudflare Pages Dashboard: https://dash.cloudflare.com/pages"
else
  echo "❌ Deployment failed"
  exit 1
fi
