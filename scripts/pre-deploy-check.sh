#!/bin/bash

echo "🔍 デプロイ前チェックを開始..."

# 1. ビルドサイズの確認
echo "📊 ビルドサイズ:"
du -sh .next/

# 2. モックデータの除外確認
echo "🚫 モックデータ除外確認:"
if find .next -name "*.json" | grep -E "(metainfo|statsdata|statslist)" > /dev/null; then
  echo "❌ モックデータがビルドに含まれています"
  exit 1
else
  echo "✅ モックデータは正しく除外されています"
fi

# 3. 環境変数の確認
echo "🔧 環境変数確認:"
if [ "$NODE_ENV" = "production" ]; then
  echo "✅ 本番環境設定"
else
  echo "⚠️  開発環境設定"
fi

echo "🎉 デプロイ前チェック完了"
