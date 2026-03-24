#!/bin/bash

# Pre-commitチェックスクリプト
# このスクリプトは.husky/pre-commitから呼び出されます

set -e

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# エラーカウント
ERROR_COUNT=0

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# 1. TypeScript型チェック（一時的に無効化）
# echo -e "${GREEN}📐 TypeScript型チェック...${NC}"
# if ! (cd "$WEB_DIR" && npm run type-check > /dev/null 2>&1); then
#   echo -e "${RED}❌ TypeScriptの型エラーが検出されました。${NC}"
#   echo -e "${YELLOW}💡 詳細を確認: npm run type-check${NC}"
#   ERROR_COUNT=$((ERROR_COUNT + 1))
# else
#   echo -e "${GREEN}✅ 型チェック成功${NC}"
# fi
echo -e "${YELLOW}⚠️  TypeScript型チェックは一時的に無効化されています${NC}"

# 2. 一時ファイル自動クリーンアップ
echo -e "${GREEN}🗑️  一時ファイルチェック...${NC}"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# プロジェクトルート直下の一時ファイルパターン
TMP_PATTERNS=(
  "tmp_*"
  "tmp-*"
  "*.db"
  "*.db-shm"
  "*.db-wal"
)

CLEANED=0
for pattern in "${TMP_PATTERNS[@]}"; do
  for f in "$PROJECT_ROOT"/$pattern; do
    if [ -f "$f" ]; then
      # .local/ 配下は除外
      case "$f" in */.local/*) continue;; esac
      fname=$(basename "$f")
      echo -e "${YELLOW}  🗑️  削除: $fname${NC}"
      rm -f "$f"
      # ステージングからも除外
      git reset HEAD "$fname" 2>/dev/null || true
      CLEANED=$((CLEANED + 1))
    fi
  done
done

if [ $CLEANED -gt 0 ]; then
  echo -e "${YELLOW}⚠️  一時ファイル ${CLEANED} 件を自動削除しました${NC}"
else
  echo -e "${GREEN}✅ 一時ファイルチェック成功${NC}"
fi

# 3. ファイルサイズチェック
echo -e "${GREEN}📏 ファイルサイズチェック...${NC}"
MAX_FILE_SIZE=1048576 # 1MB
LARGE_FILES=$(git diff --cached --name-only --diff-filter=ACM | while read file; do
  if [ -f "$file" ]; then
    # macOSとLinuxの両方に対応
    if [[ "$OSTYPE" == "darwin"* ]]; then
      size=$(stat -f%z "$file" 2>/dev/null || echo 0)
    else
      size=$(stat -c%s "$file" 2>/dev/null || echo 0)
    fi
    if [ "$size" -gt "$MAX_FILE_SIZE" ]; then
      # サイズを人間が読みやすい形式に変換
      if command -v numfmt >/dev/null 2>&1; then
        size_human=$(numfmt --to=iec-i --suffix=B $size)
      else
        # numfmtが使えない場合は手動計算
        if [ "$size" -gt 1048576 ]; then
          size_mb=$((size / 1048576))
          size_human="${size_mb}MB"
        elif [ "$size" -gt 1024 ]; then
          size_kb=$((size / 1024))
          size_human="${size_kb}KB"
        else
          size_human="${size} bytes"
        fi
      fi
      echo "$file ($size_human)"
    fi
  fi
done)

if [ -n "$LARGE_FILES" ]; then
  echo -e "${YELLOW}⚠️  大きなファイルが検出されました:${NC}"
  echo "$LARGE_FILES"
  echo -e "${YELLOW}💡 1MB以上のファイルはリポジトリに含めないことを推奨します。${NC}"
  # 警告のみで続行
else
  echo -e "${GREEN}✅ ファイルサイズチェック成功${NC}"
fi

# 3. 命名規則チェック
echo -e "${GREEN}📝 命名規則チェック...${NC}"
INVALID_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '.*[A-Z].*\.(ts|tsx|js|jsx)$' | grep -v node_modules || true)

if [ -n "$INVALID_FILES" ]; then
  echo -e "${YELLOW}⚠️  大文字を含むファイル名が検出されました:${NC}"
  echo "$INVALID_FILES"
  echo -e "${YELLOW}💡 ファイル名は小文字とハイフンを使用することを推奨します。${NC}"
  # 警告のみで続行
else
  echo -e "${GREEN}✅ 命名規則チェック成功${NC}"
fi

# 4. セキュリティチェック - 依存関係の脆弱性
echo -e "${GREEN}🔒 依存関係の脆弱性チェック...${NC}"
if (cd "$WEB_DIR" && npm audit --audit-level=moderate > /dev/null 2>&1); then
  echo -e "${GREEN}✅ 脆弱性チェック成功${NC}"
else
  echo -e "${YELLOW}⚠️  中程度以上の脆弱性が検出されました。${NC}"
  echo -e "${YELLOW}💡 詳細を確認: npm audit${NC}"
  echo -e "${YELLOW}💡 修正: npm audit fix${NC}"
  # 警告のみで続行（エラーで止めない）
fi

# 5. シークレット漏洩チェック（簡易版）
echo -e "${GREEN}🔐 シークレット漏洩チェック...${NC}"
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)
SECRET_PATTERNS=(
  "password\s*=\s*['\"][^'\"]+['\"]"
  "api[_-]?key\s*=\s*['\"][^'\"]+['\"]"
  "secret\s*=\s*['\"][^'\"]+['\"]"
  "token\s*=\s*['\"][^'\"]+['\"]"
  "CLOUDFLARE_API_TOKEN"
  "NEXT_PUBLIC.*SECRET"
)

# 除外するファイルパターン（環境変数名のみを含むファイル）
EXCLUDE_PATTERNS=(
  ".*/database/actions/restore\.ts"  # 環境変数名のみを含むファイル
)

FOUND_SECRETS=false
for file in $STAGED_FILES; do
  # 除外パターンをチェック
  EXCLUDED=false
  for exclude_pattern in "${EXCLUDE_PATTERNS[@]}"; do
    if echo "$file" | grep -qE "$exclude_pattern"; then
      EXCLUDED=true
      break
    fi
  done
  
  if [ "$EXCLUDED" = true ]; then
    continue
  fi
  
  if [ -f "$file" ] && [[ "$file" != *.md ]] && [[ "$file" != *.json ]]; then
    for pattern in "${SECRET_PATTERNS[@]}"; do
      # 環境変数名のパターンを除外（process.env.XXXやCLOUDFLARE_R2_XXXなど）
      if grep -qiE "$pattern" "$file" 2>/dev/null; then
        # 環境変数名のパターンを除外
        if grep -qiE "(process\.env\.|CLOUDFLARE_R2_ACCESS_KEY_ID|CLOUDFLARE_R2_SECRET_ACCESS_KEY)" "$file" 2>/dev/null; then
          # 環境変数名の場合はスキップ
          continue
        fi
        
        if [ "$FOUND_SECRETS" = false ]; then
          echo -e "${YELLOW}⚠️  シークレットの可能性がある文字列が検出されました:${NC}"
          FOUND_SECRETS=true
        fi
        echo -e "${YELLOW}  - $file${NC}"
        # 警告のみで続行
      fi
    done
  fi
done

if [ "$FOUND_SECRETS" = false ]; then
  echo -e "${GREEN}✅ シークレットチェック成功${NC}"
fi

# 6. テストカバレッジチェック（オプション - 変更されたファイルに関連するテストのみ）
echo -e "${GREEN}🧪 テストカバレッジチェック（オプション）...${NC}"
STAGED_TS_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' | grep -v '\.test\.' | grep -v '\.stories\.' || true)

if [ -n "$STAGED_TS_FILES" ]; then
  echo -e "${YELLOW}💡 変更されたファイル: $(echo "$STAGED_TS_FILES" | wc -l | tr -d ' ')件${NC}"
  echo -e "${YELLOW}💡 テストカバレッジの確認を推奨: npm run test:coverage${NC}"
  # 警告のみで続行（テストは時間がかかるため、pre-commitではスキップ）
else
  echo -e "${GREEN}✅ TypeScriptファイルの変更なし${NC}"
fi

# エラーがある場合はコミットを拒否
if [ $ERROR_COUNT -gt 0 ]; then
  echo ""
  echo -e "${RED}❌ エラーが検出されました。コミットを中止します。${NC}"
  echo -e "${YELLOW}💡 エラーを修正してから再度コミットしてください。${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ すべてのチェックが成功しました！${NC}"
exit 0

