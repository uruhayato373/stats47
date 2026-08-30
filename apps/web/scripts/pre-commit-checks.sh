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

# 1. TypeScript型チェック（staged に apps/web の .ts/.tsx が含まれる場合のみ実行）
echo -e "${GREEN}📐 TypeScript型チェック...${NC}"
STAGED_WEB_TSFILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '^apps/web/.*\.(ts|tsx)$' || true)
if [ -n "$STAGED_WEB_TSFILES" ]; then
  if ! (cd "$WEB_DIR" && npm run type-check > /dev/null 2>&1); then
    echo -e "${RED}❌ TypeScriptの型エラーが検出されました。${NC}"
    echo -e "${YELLOW}💡 詳細を確認: npm run type-check${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  else
    echo -e "${GREEN}✅ 型チェック成功${NC}"
  fi
else
  echo -e "${GREEN}✅ apps/web の .ts/.tsx 変更なし、型チェック skip${NC}"
fi

# 1.5 scripts 配下の型チェック
#     ★上の block は apps/web/tsconfig.json を使うが、そこは include が src だけで
#       exclude に scripts/**/* を持つため **scripts 配下を一切見ない**。
#       sync-rakuten-catalog.ts の import 漏れが 9 日間見つからなかったのがこれ
#       (2026-08-13 是正)。対象ディレクトリの正典は package.json の type-check:scripts。
echo -e "${GREEN}📐 scripts の型チェック...${NC}"
REPO_ROOT_FOR_SCRIPTS="$(cd "$SCRIPT_DIR/../../.." && pwd)"
STAGED_SCRIPT_TSFILES=$(git diff --cached --name-only --diff-filter=ACM \
  | grep -E '(^|/)scripts/.*\.(ts|mts|tsx)$' || true)
if [ -n "$STAGED_SCRIPT_TSFILES" ]; then
  if ! (cd "$REPO_ROOT_FOR_SCRIPTS" && npm run type-check:scripts > /dev/null 2>&1); then
    echo -e "${RED}❌ scripts の型エラーが検出されました。${NC}"
    echo -e "${YELLOW}💡 詳細を確認: npm run type-check:scripts${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  else
    echo -e "${GREEN}✅ scripts 型チェック成功${NC}"
  fi
else
  echo -e "${GREEN}✅ scripts の .ts 変更なし、型チェック skip${NC}"
fi

# 2. デザインシステムガード
echo -e "${GREEN}🎨 デザインシステムチェック...${NC}"
if ! (cd "$WEB_DIR" && npm run design-system:check > /dev/null 2>&1); then
  echo -e "${RED}❌ デザインシステム違反が検出されました。${NC}"
  echo -e "${YELLOW}💡 詳細を確認: npm run design-system:check${NC}"
  ERROR_COUNT=$((ERROR_COUNT + 1))
else
  echo -e "${GREEN}✅ デザインシステムチェック成功${NC}"
fi

# 2.1 R2 依存 route の SSG ガード (2026-06-22 障害の再発防止)
# ranking/areas/cities は generateStaticParams を持つと ● SSG 化 → build 時 R2 不可 →
# notFound 永久固着。ƒ (オンデマンド ISR) を維持しているか検証する。
echo -e "${GREEN}🛡️  R2 依存 route SSG ガード...${NC}"
GUARD_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
if ! node "$GUARD_ROOT/.claude/scripts/lib/check-r2-route-ssg.cjs"; then
  echo -e "${RED}❌ R2 依存 route に generateStaticParams が混入しています。${NC}"
  echo -e "${YELLOW}💡 .claude/rules/nextjs-ssg-preservation.md §generateStaticParams 固着${NC}"
  ERROR_COUNT=$((ERROR_COUNT + 1))
fi

# 2.1a private参考文献のローカル残存・利用契約ガード
# repo内cacheを拒否し、全profileのmanifest・active利用仕様・非公開派生物契約・解決台帳100%を照合する。
echo -e "${GREEN}📚 参考文献source vaultチェック...${NC}"
if ! (cd "$GUARD_ROOT" && npm run source-vault:check > /dev/null 2>&1); then
  echo -e "${RED}❌ 参考文献のrepo内残存、manifest、active利用仕様、または非公開派生物契約に違反があります。${NC}"
  echo -e "${YELLOW}💡 詳細: npm run source-vault:check${NC}"
  ERROR_COUNT=$((ERROR_COUNT + 1))
else
  echo -e "${GREEN}✅ 参考文献source vault契約に適合${NC}"
fi

# 2.2 sync-snapshots の task ドリフト (2026-08-05 の calculated-stats 書き忘れの再発防止)
# run.sh に task を足しても動くので CI は緑のまま、task の存在と実行順を人と agent が
# 読む面 (SKILL.md の task 表) だけが欠落する。両者を 1:1 に保つ。
if git diff --cached --name-only | grep -q "^.claude/skills/db/sync-snapshots/"; then
  echo -e "${GREEN}🔁 sync-snapshots task ドリフト...${NC}"
  if ! node "$GUARD_ROOT/.claude/scripts/lib/check-sync-snapshots-tasks.cjs"; then
    echo -e "${RED}❌ run.sh の TASKS と SKILL.md の task 表がずれています。${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
fi

# 2.1b ドキュメントガバナンス
# 文書の固定構成、frontmatter、TODO ID、実装計画INDEX、Claude/Codex共通SSOT、
# 削除・移動後の参照悪化を、文書関連差分があるcommitだけ検査する。
STAGED_DOCS=$(git diff --cached --name-only --diff-filter=ACMRD | grep -E \
  '^(docs/|\.claude/todo/|CLAUDE\.md$|AGENTS\.md$|\.claude/(config/docs-governance\.json|rules/docs-vs-issues\.md|skills/management/maintain-docs/|scripts/lib/check-docs-(governance|links)\.cjs|scripts/lib/__tests__/check-docs-(governance|links)\.test\.cjs)|package\.json$)' || true)
if [ -n "$STAGED_DOCS" ]; then
  echo -e "${GREEN}📚 ドキュメントガバナンスチェック...${NC}"
  if ! (cd "$GUARD_ROOT" && npm run docs:check); then
    echo -e "${RED}❌ 文書の配置・構造・INDEX・リンク規約に違反しています。${NC}"
    echo -e "${YELLOW}💡 自動同期: npm run docs:fix / 詳細: npm run docs:report${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  else
    echo -e "${GREEN}✅ ドキュメントガバナンスチェック成功${NC}"
  fi
fi

# 2.1c file:// URL の文字列連結ガード
# `file://${process.argv[1]}` は Windows で必ず不一致になり、ESM のエントリポイント
# 判定なら main() が呼ばれないまま exit 0 で終わる (失敗ではなく無言の no-op)。
STAGED_JS=$(git diff --cached --name-only --diff-filter=ACM | grep -E \
  '^(\.claude/scripts/|apps/|packages/|scripts/).*\.(js|cjs|mjs|ts|tsx|mts|cts)$' || true)
if [ -n "$STAGED_JS" ]; then
  echo -e "${GREEN}🔗 file:// URL ガード...${NC}"
  if ! node "$GUARD_ROOT/.claude/scripts/lib/check-file-url-guard.cjs"; then
    echo -e "${RED}❌ file:// URL を文字列連結しています。pathToFileURL / new URL を使ってください。${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  else
    echo -e "${GREEN}✅ file:// URL ガード成功${NC}"
  fi
fi

# 2.1d dispatch request の main 反映順ガード
# sync-snapshots の sync job は `ref: main` を checkout する。develop で config を直しただけの
# 状態で dispatch すると **main の古い config で再生成され、しかも成功する** (R2 の
# generatedAt も更新されるので失敗に見えない)。2026-08-17 に婚姻率・離婚率の seoTitle で
# 実際に踏み、2026-07-14 と同じ事故を繰り返した。正典: .claude/skills/db/sync-snapshots/SKILL.md
STAGED_DISPATCH=$(git diff --cached --name-only --diff-filter=ACM | grep -E \
  '^data/workflow-dispatch-requests\.json$' || true)
if [ -n "$STAGED_DISPATCH" ]; then
  echo -e "${GREEN}🚦 dispatch request の main 反映順...${NC}"
  if ! node "$GUARD_ROOT/.claude/scripts/lib/check-dispatch-freshness.cjs"; then
    echo -e "${RED}❌ main 未反映のまま main pinned な workflow へ dispatch しようとしています。${NC}"
    echo -e "${YELLOW}💡 先に develop→main をデプロイする / 読まないと確信できるなら request に acknowledgedMainLag を書く${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  else
    echo -e "${GREEN}✅ dispatch request の main 反映順チェック成功${NC}"
  fi
fi

# 2.1e import.meta.dirname ガード
# .ts は tsx が CJS 解決するため import.meta.dirname は undefined になる
# (repo の package.json はどれも "type": "module" を持たない)。フォールバック無しだと
# path.resolve が ERR_INVALID_ARG_TYPE で落ちる。2026-08-16 に purge-worker-cache.ts が
# これで blog-auto-publish と楽天同期の Workers Cache purge を失敗させていた。
if [ -n "$STAGED_JS" ]; then
  echo -e "${GREEN}📁 import.meta.dirname ガード...${NC}"
  if ! node "$GUARD_ROOT/.claude/scripts/lib/check-import-meta-dirname-guard.cjs"; then
    echo -e "${RED}❌ bare な import.meta.dirname です。'import.meta.dirname ?? __dirname' と書いてください。${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  else
    echo -e "${GREEN}✅ import.meta.dirname ガード成功${NC}"
  fi
fi

# 2.0.1 CI の Static Gates と同じ 3 ゲートを先行実行する (2026-08-12 追加)
#
# ★なぜ足したか: この 3 つは CI (Static Gates) にだけあって pre-commit に無く、
#   ローカルで pre-commit を全部通したのに CI で 3 回連続で落ちた
#   (DUPLICATE_IMAGE → ENV_UNREGISTERED → UNBOUNDED_LEGACY)。
#   1 往復あたり CI が十数分かかるので、合計 3.7 秒 (実測 0.7 + 1.4 + 1.6) をここで払う方が安い。
#   いずれも baseline 方式で既存違反は素通りし、新規混入だけを止める。
#   ★root は GUARD_ROOT を使う (PROJECT_ROOT はこのブロックより後で定義されるので空になり、
#     存在しないパスを叩いて 3 つとも「失敗」になる)。
STAGED_ANY=$(git diff --cached --name-only --diff-filter=ACM || true)
if [ -n "$STAGED_ANY" ]; then
  echo -e "${GREEN}🔐 環境変数レジストリ・資産ポリシー・保守負債ガード...${NC}"
  if ! node "$GUARD_ROOT/.claude/scripts/lib/check-env-registry.cjs"; then
    echo -e "${RED}❌ 未登録の環境変数があります。.claude/config/env-registry.json に登録してください。${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
  if ! node "$GUARD_ROOT/.claude/scripts/lib/check-asset-policy.cjs" --baseline; then
    echo -e "${RED}❌ 画像資産ポリシー違反 (重複画像・寸法・容量など)。${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
  if ! node "$GUARD_ROOT/.claude/scripts/lib/check-maintenance-debt.cjs" --baseline; then
    # ★判定は行単位。legacy / deprecated と同じ行に削除条件を書く (別行だと素通りしない)
    echo -e "${RED}❌ 無根拠な TODO/legacy/deprecated。削除条件を legacy と同じ行に書いてください。${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
fi

# 2.1.1 画像生成差分/publish policy ガード
# workflow / planner / manifest / publisher の変更時だけ、CI と同じ fail-closed policy を先行実行する。
STAGED_IMAGE_PIPELINE=$(git diff --cached --name-only --diff-filter=ACM | grep -E \
  '^(\.github/workflows/.*\.ya?ml|\.claude/scripts/(lib/(audit-workflow-policy\.cjs|__tests__/audit-workflow-policy\.test\.cjs)|sns/(prepare-buzz-map-batch\.ts|lib/buzz-map-batch-core\.mjs))|apps/web/scripts/(generate-(ogp-images|blog-thumbnails(-cloud)?|category-images)\.ts|manage-blog-codex-backgrounds\.ts|data/(image-generator-registry|blog-(ogp-visual|codex-background)-catalog)\.ts|lib/(image-generation-manifest|image-generation-r2-inspector|blog-image-generation|blog-image-render|blog-ogp-visual|blog-thumbnail-render|blog-codex-background-workflow|ranking-(ogp-fallback|thumbnail)-render|satori-image-render|gemini-image-client)\.ts|lib/__tests__/(image-generation-manifest|image-pipeline-source-policy|blog-ogp-visual|blog-codex-background-catalog|gemini-image-client)\.test\.ts|lib/assets/(ogp-bg-brand-(dark|light)\.jpg|blog-codex-backgrounds/.*\.jpg))|packages/(r2-storage/src/(image-pipeline\.ts|scripts/(push-(generated-image-set|exact-r2-assets(-core)?)\.ts|__tests__/push-(generated-image-set|exact-r2-assets)\.test\.ts))|types/src/(image-generation-manifest\.ts|index\.ts))|package\.json)$' || true)
if [ -n "$STAGED_IMAGE_PIPELINE" ]; then
  echo -e "${GREEN}🖼️  画像生成 pipeline policy チェック...${NC}"
  if ! node "$GUARD_ROOT/.claude/scripts/lib/audit-workflow-policy.cjs" --strict; then
    echo -e "${RED}❌ 画像の全件強制生成・prefix push・best-effort write が検出されました。${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
  if ! (cd "$GUARD_ROOT" && npm run test:image-pipeline); then
    echo -e "${RED}❌ 画像fingerprint / exact publisherの契約テストが失敗しました。${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
  if ! (cd "$GUARD_ROOT" && npm run type-check:image-pipeline); then
    echo -e "${RED}❌ 画像generator / publisherの型チェックが失敗しました。${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
fi

# 2.2 カード系コンポーネントの増殖ガード (Phase 0-5 / スパゲッティ化の止血)
# *Card のベースライン超過を弾く。新規カードは既存共有カードで表現できないか先に検討する。
echo -e "${GREEN}🃏 カード census ガード...${NC}"
if ! node "$GUARD_ROOT/.claude/scripts/lib/check-card-census.cjs"; then
  echo -e "${RED}❌ ベースライン外の新規 *Card が追加されています。${NC}"
  echo -e "${YELLOW}💡 docs/01_技術設計/04_デザインシステム.md / .claude/rules/ui-components.md${NC}"
  ERROR_COUNT=$((ERROR_COUNT + 1))
fi

# 2.2.1 広告配置・右レール契約ガード (2026-07-29 / 2026-08-02 の再発防止)
# 広告の隣接・rail 部品誤用・生 AdSenseAd・右レール独立scroll/テキストPR・死んだ slot 定数を弾く。
echo -e "${GREEN}📢 広告配置ガード...${NC}"
if ! node "$GUARD_ROOT/.claude/scripts/lib/check-ad-placement.cjs"; then
  echo -e "${RED}❌ 広告の配置規約に違反しています。${NC}"
  echo -e "${YELLOW}💡 docs/01_技術設計/04_デザインシステム.md / .claude/rules/ui-components.md${NC}"
  ERROR_COUNT=$((ERROR_COUNT + 1))
fi

# 2.3 ESLint (staged の apps/web TS/TSX) — CI の next lint と同基準で import/order 等を事前に弾く
# 背景: import/order は CI (Code Quality Check) でのみ検出され、ローカルで気付けず CI を1サイクル無駄にしていた
# (2026-06-23 deploy 時に発生)。staged ファイルだけを next lint にかけて高速に事前検出する。
echo -e "${GREEN}🧹 ESLint (staged ファイル)...${NC}"
STAGED_WEB_TS=$(git diff --cached --name-only --diff-filter=ACM | grep -E '^apps/web/src/.*\.(ts|tsx)$' || true)
if [ -n "$STAGED_WEB_TS" ]; then
  LINT_ARGS=$(echo "$STAGED_WEB_TS" | sed 's#^apps/web/#--file #' | tr '\n' ' ')
  if ! (cd "$WEB_DIR" && npx next lint $LINT_ARGS > /tmp/precommit-lint.out 2>&1); then
    echo -e "${RED}❌ ESLint エラー (import/order 等) が検出されました。${NC}"
    grep -E "Error:|\.tsx?$" /tmp/precommit-lint.out | head -20
    echo -e "${YELLOW}💡 自動修正: cd apps/web && npx next lint --fix${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  else
    echo -e "${GREEN}✅ ESLint 成功${NC}"
  fi
else
  echo -e "${GREEN}✅ 対象 staged ファイルなし${NC}"
fi

# 3. 一時ファイル自動クリーンアップ
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

# 3.1 tracked/staged リポジトリ衛生ガード
# 既存findingはbaselineで許容し、新規悪化だけをブロックする。
# 全tracked pathを見ることで staged path と既存pathの case/Unicode衝突も検出する。
echo -e "${GREEN}🧹 リポジトリ衛生回帰チェック...${NC}"
if ! node "$PROJECT_ROOT/.claude/scripts/lib/check-repo-hygiene.cjs" --baseline; then
  echo -e "${RED}❌ 新規の一時出力・大容量ファイル・path衝突が検出されました。${NC}"
  ERROR_COUNT=$((ERROR_COUNT + 1))
fi

# 3.2 観測値の桁揃えガード
# 共有規約 (@stats47/utils の resolveValuePrecision + formatValueWithPrecision) の迂回を検出。
# maximumFractionDigits の単独指定・素の toLocaleString は同じ図の中で「60.4」と「44」を
# 混在させる (2026-07-31 実発生)。既存違反は baseline で許容し、新規混入だけをブロックする。
echo -e "${GREEN}🔢 数値整形（桁揃え）チェック...${NC}"
if ! node "$PROJECT_ROOT/.claude/scripts/lib/check-value-format.cjs" --baseline; then
  echo -e "${RED}❌ 観測値の桁揃えが共有規約を迂回しています。${NC}"
  ERROR_COUNT=$((ERROR_COUNT + 1))
fi

# 4. ファイルサイズチェック
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

# 5. 命名規則チェック
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

# 6. セキュリティチェック - 依存関係の脆弱性
echo -e "${GREEN}🔒 依存関係の脆弱性チェック...${NC}"
if (cd "$WEB_DIR" && npm audit --audit-level=moderate > /dev/null 2>&1); then
  echo -e "${GREEN}✅ 脆弱性チェック成功${NC}"
else
  echo -e "${YELLOW}⚠️  中程度以上の脆弱性が検出されました。${NC}"
  echo -e "${YELLOW}💡 詳細を確認: npm audit${NC}"
  echo -e "${YELLOW}💡 修正: npm audit fix${NC}"
  # 警告のみで続行（エラーで止めない）
fi

# 7. シークレット漏洩チェック（簡易版）
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

# 8. ブログ記事の Factual cross-check (2026-05-25 追加)
echo -e "${GREEN}📊 ブログ記事 factual cross-check...${NC}"
STAGED_ARTICLES=$(git diff --cached --name-only --diff-filter=ACM | grep -E "^docs/21_ブログ記事原稿/[^/]+/article\.md$" || true)

if [ -n "$STAGED_ARTICLES" ]; then
  FACTUAL_FAILED=0
  while IFS= read -r article; do
    if [ -z "$article" ]; then continue; fi
    # data dir は <article-dir>/data/
    article_dir=$(dirname "$PROJECT_ROOT/$article")
    data_dir="$article_dir/data"
    if [ ! -d "$data_dir" ]; then
      echo -e "${YELLOW}  ⚠️  $article: data/ なし、cross-check スキップ${NC}"
      continue
    fi
    # cross-check 実行
    if ! node "$PROJECT_ROOT/.claude/scripts/lib/article-factual-check.mjs" \
         "$PROJECT_ROOT/$article" "$data_dir" > /tmp/factual-check.json 2>&1; then
      FACTUAL_FAILED=$((FACTUAL_FAILED + 1))
      echo -e "${RED}  ❌ $article: factual cross-check FAIL${NC}"
      # blockers を抽出して表示
      cat /tmp/factual-check.json | node -e "
        let d=''; process.stdin.on('data',c=>d+=c).on('end',()=>{
          try { const j=JSON.parse(d); (j.blockers||[]).forEach(b=>console.error('     ' + b)); }
          catch(e) {}
        });
      " 2>&1 || true
    else
      echo -e "${GREEN}  ✅ $article${NC}"
    fi
  done <<< "$STAGED_ARTICLES"

  if [ "$FACTUAL_FAILED" -gt 0 ]; then
    echo -e "${RED}❌ ブログ記事 $FACTUAL_FAILED 件で factual error 検出。コミット中止。${NC}"
    echo -e "${YELLOW}💡 詳細: node .claude/scripts/lib/article-factual-check.mjs <article> <data-dir>${NC}"
    echo -e "${YELLOW}💡 失敗パターン: .claude/skills/blog/SHARED-failure-cases.md${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  else
    echo -e "${GREEN}✅ factual cross-check 全件 pass${NC}"
  fi

  # 6.1 構造品質ゲート (2026-06-02 追加)
  # published: true のドラフトだけを対象に quality-gate.mjs を適用する。
  # 薄い記事 (charCount<3000 / internalLinks<3 / H2<4 / データ出典欠落 / NG word 等) を
  # public 公開前にコミット段階で止める。published: false の作業中ドラフトは対象外。
  # 経緯: GSC高インプレ10記事を published: true の薄い状態で投入した再発防止 (factual gate のみで素通りした)。
  echo -e "${GREEN}🧱 ブログ記事 構造品質ゲート (published のみ)...${NC}"
  QUALITY_FAILED=0
  QUALITY_CHECKED=0
  while IFS= read -r article; do
    if [ -z "$article" ]; then continue; fi
    # frontmatter が published: true のものだけゲートをかける
    if ! grep -qE "^published:[[:space:]]*true[[:space:]]*$" "$PROJECT_ROOT/$article" 2>/dev/null; then
      echo -e "${YELLOW}  ⏭️  $article: published: true ではない (作業中ドラフト扱い)、構造ゲート skip${NC}"
      continue
    fi
    QUALITY_CHECKED=$((QUALITY_CHECKED + 1))
    if ! node "$PROJECT_ROOT/.claude/scripts/blog/quality-gate.mjs" \
         "$PROJECT_ROOT/$article" > /tmp/quality-gate.json 2>&1; then
      QUALITY_FAILED=$((QUALITY_FAILED + 1))
      echo -e "${RED}  ❌ $article: 構造品質ゲート FAIL${NC}"
      cat /tmp/quality-gate.json | node -e "
        let d=''; process.stdin.on('data',c=>d+=c).on('end',()=>{
          try { const j=JSON.parse(d); (j.blockers||[]).forEach(b=>console.error('     ' + b)); }
          catch(e) { console.error('     (gate 実行エラー — /tmp/quality-gate.json 参照)'); }
        });
      " 2>&1 || true
    else
      echo -e "${GREEN}  ✅ $article${NC}"
    fi
  done <<< "$STAGED_ARTICLES"

  if [ "$QUALITY_FAILED" -gt 0 ]; then
    echo -e "${RED}❌ ブログ記事 $QUALITY_FAILED 件が構造品質ゲート未達 (published: true)。コミット中止。${NC}"
    echo -e "${YELLOW}💡 基準: .claude/rules/blog-quality-standards.md / 確認: node .claude/scripts/blog/quality-gate.mjs <article.md>${NC}"
    echo -e "${YELLOW}💡 公開前提でなければ frontmatter を published: false に戻して再コミット${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  elif [ "$QUALITY_CHECKED" -gt 0 ]; then
    echo -e "${GREEN}✅ 構造品質ゲート 全件 pass ($QUALITY_CHECKED 件)${NC}"
  else
    echo -e "${GREEN}✅ published: true のブログ記事なし、構造ゲート対象外${NC}"
  fi
else
  echo -e "${GREEN}✅ ブログ記事の変更なし${NC}"
fi

# 6.45 単位セマンティクスの鏡ドリフト検査 (2026-08-12 追加 / .claude/rules/unit-semantics-standards.md)
# 正典 packages/data-configs/src/unit/unit-semantics.ts から
# .claude/scripts/lib/unit-semantics.mjs を自動生成している (.claude/scripts/** は素の node 実行で
# TS を import できない)。手写しの二重実装はドリフトする — それが単位解釈 44 箇所の独立実装を生み、
# 「千円 SSOT × 円 本文」の桁ずれ誤検出を招いた。どちらかだけの変更を止める。
STAGED_UNIT=$(git diff --cached --name-only --diff-filter=ACM | grep -E "^(packages/data-configs/src/unit/|\.claude/scripts/lib/unit-semantics\.mjs)" || true)

if [ -n "$STAGED_UNIT" ]; then
  echo -e "${GREEN}📏 単位セマンティクスの鏡チェック...${NC}"
  if (cd "$PROJECT_ROOT" && npx tsx packages/data-configs/scripts/generate-unit-semantics-mirror.ts --check > /tmp/unit-mirror.log 2>&1); then
    echo -e "${GREEN}✅ 鏡は正典と一致${NC}"
  else
    cat /tmp/unit-mirror.log
    echo -e "${RED}❌ 単位セマンティクスの鏡が正典とずれています${NC}"
    echo -e "${YELLOW}💡 再生成: npx tsx packages/data-configs/scripts/generate-unit-semantics-mirror.ts${NC}"
    exit 1
  fi
fi

# 6.5 metric config の year 正規化チェック (2026-05-29 追加 / .claude/rules/estat-api.md「年の正規化」)
echo -e "${GREEN}📅 metric years 正規化チェック...${NC}"
STAGED_METRICS=$(git diff --cached --name-only --diff-filter=ACM | grep -E "^packages/data-configs/src/metrics/.+\.ts$" | grep -v "index.ts" || true)

if [ -n "$STAGED_METRICS" ]; then
  if (cd "$PROJECT_ROOT" && npx tsx packages/data-configs/scripts/validate-metric-years.ts > /tmp/validate-years.log 2>&1); then
    echo -e "${GREEN}✅ years 正規化チェック成功 (4桁年)${NC}"
  else
    echo -e "${RED}❌ years にフルタイムコード/不正年が混入しています。${NC}"
    grep -E "^  |混入" /tmp/validate-years.log | head -10 || true
    echo -e "${YELLOW}💡 config.years は 4桁年 (例 2009)。フルコード (2009100000) 禁止。${NC}"
    echo -e "${YELLOW}💡 規約: .claude/rules/estat-api.md / 確認: npm run validate:years --workspace=@stats47/data-configs${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi

  # metric config の構造規約チェック (category 無効キー等。.claude/rules/metric-config-standards.md)
  if (cd "$PROJECT_ROOT" && npx tsx packages/data-configs/scripts/validate-metric-config.ts > /tmp/validate-config.log 2>&1); then
    echo -e "${GREEN}✅ metric-config 構造チェック成功${NC}"
    grep -E "warn 内訳" /tmp/validate-config.log || true
  else
    echo -e "${RED}❌ metric config に無効な category 等の error があります。${NC}"
    grep -E "^   |❌" /tmp/validate-config.log | head -10 || true
    echo -e "${YELLOW}💡 規約: .claude/rules/metric-config-standards.md / 確認: npm run validate:config --workspace=@stats47/data-configs${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi

  # SEO 文字列の事実照合 (.claude/todo/backlog.md SEO-META-FACTUAL-GATE-01)
  #
  # seoTitle / seoDescription は <title> と <meta name="description"> としてそのまま
  # 配信される。実データと突合していなかったため 5.2% が 1 位県・値・倍率・年を
  # 取り違えていた (2026-08-17 全数走査)。
  #
  # ★staged 分だけを見る。全 2,008 件だと R2 を 2,000 回読むので pre-commit には重い
  #   (全数走査は CI の SEO Meta Factual Gate が担う)。R2 を読めない環境では黙って
  #   判定不能になるので、ここでは落とさず警告に留める (CI が権威)。
  SEO_KEYS=$(echo "$STAGED_METRICS" | sed 's|.*/||;s|\.ts$||' | paste -sd, -)
  if [ -n "$SEO_KEYS" ]; then
    if (cd "$PROJECT_ROOT" && npx tsx packages/data-configs/scripts/audit-seo-meta-facts.ts --only "$SEO_KEYS" > /tmp/seo-meta-facts.log 2>&1); then
      if grep -qE "不一致のある metric : 0" /tmp/seo-meta-facts.log; then
        echo -e "${GREEN}✅ SEO 文字列の事実照合 成功${NC}"
      else
        echo -e "${YELLOW}⚠️  seoTitle/seoDescription が実データと食い違います${NC}"
        grep -E "^    \[" /tmp/seo-meta-facts.log | head -10 || true
        echo -e "${YELLOW}💡 確認: npx tsx packages/data-configs/scripts/audit-seo-meta-facts.ts --only <key>${NC}"
      fi
    fi
  fi

  # 配色の決定規則 + 極性 SSOT (.claude/rules/blog-svg-chart-standards.md §3)
  if (cd "$PROJECT_ROOT" && npx tsx packages/data-configs/scripts/validate-polarity.ts > /tmp/validate-polarity.log 2>&1); then
    echo -e "${GREEN}✅ 配色・極性チェック成功${NC}"
    grep -E "配色の決定内訳" /tmp/validate-polarity.log || true
  else
    echo -e "${RED}❌ 極性カタログ / 配色決定規則に error があります。${NC}"
    grep -E "^  ✗" /tmp/validate-polarity.log | head -10 || true
    echo -e "${YELLOW}💡 規約: .claude/rules/blog-svg-chart-standards.md §3 / 確認: npm run validate:polarity --workspace=@stats47/data-configs${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
else
  echo -e "${GREEN}✅ metric config の変更なし${NC}"
fi

# 6.5b topic カタログ (カテゴリ内グループ分類 SSOT) の整合
#      (packages/data-configs/src/topics/README.md)。カタログ TS が staged のとき発火。
STAGED_TOPICS=$(git diff --cached --name-only --diff-filter=ACM | grep -E "^packages/data-configs/src/topics/.+[.]ts$" || true)

if [ -n "$STAGED_TOPICS" ]; then
  echo -e "${GREEN}topic カタログ整合チェック...${NC}"
  if (cd "$PROJECT_ROOT" && npx tsx packages/data-configs/scripts/validate-topic-catalog.ts > /tmp/validate-topics.log 2>&1); then
    echo -e "${GREEN}OK topic カタログ整合チェック成功${NC}"
    grep -E "warn 内訳" /tmp/validate-topics.log || true
  else
    echo -e "${RED}NG topic カタログに整合 error があります。${NC}"
    grep -E "^   " /tmp/validate-topics.log | head -10 || true
    echo -e "${YELLOW}規約: packages/data-configs/src/topics/README.md / 確認: npm run validate:topics --workspace=@stats47/data-configs${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
fi

# 6.6 theme-catalog (指標×チャート SSOT) の整合 + 生成物鮮度チェック
#     (.claude/rules/theme-catalog-standards.md)。カタログ TS または生成物が staged のとき発火。
STAGED_CATALOG=$(git diff --cached --name-only --diff-filter=ACM | grep -E "^packages/data-configs/src/theme-catalog/.+\.ts$|^packages/types/src/indicator-sets/.+\.ts$|^apps/web/scripts/data/page-components/theme/.+\.json$" || true)

if [ -n "$STAGED_CATALOG" ]; then
  echo -e "${GREEN}📚 theme-catalog 整合チェック...${NC}"
  if (cd "$PROJECT_ROOT" && npx tsx packages/data-configs/scripts/validate-theme-catalog.ts > /tmp/validate-catalog.log 2>&1); then
    echo -e "${GREEN}✅ theme-catalog 整合チェック成功${NC}"
    grep -E "warn 内訳" /tmp/validate-catalog.log || true
  else
    echo -e "${RED}❌ theme-catalog に整合 error があります。${NC}"
    grep -E "^   |❌" /tmp/validate-catalog.log | head -10 || true
    echo -e "${YELLOW}💡 規約: .claude/rules/theme-catalog-standards.md / 確認: npm run validate:catalog --workspace=@stats47/data-configs${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
  # 生成物 (IndicatorSet TS / page-components JSON) が SSOT カタログと一致しているか
  if (cd "$PROJECT_ROOT" && npx tsx packages/data-configs/scripts/generate-theme-catalog.ts --check > /tmp/catalog-check.log 2>&1); then
    echo -e "${GREEN}✅ theme-catalog 生成物は最新${NC}"
  else
    echo -e "${RED}❌ theme-catalog 生成物が古い/手編集されています。${NC}"
    grep -E "^   |❌" /tmp/catalog-check.log | head -10 || true
    echo -e "${YELLOW}💡 再生成: npm run generate:catalog --workspace=@stats47/data-configs${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
fi

# 6.6a2 runtime metric summaries (Header / home ポータル / 楽天品目語) の生成物鮮度チェック
#       metric config か生成物が staged のとき発火。生成物を挟む理由は
#       「共通 Header 経由で METRICS_REGISTRY が全 route の dev bundle に入るのを防ぐ」
#       (apps/web/scripts/generate-runtime-metric-summaries.ts)。
STAGED_RUNTIME_SUMMARY=$(git diff --cached --name-only --diff-filter=ACM | grep -E "^packages/data-configs/src/(metrics/.+|categories)\.ts$|^apps/web/src/config/runtime-metric-summaries\.generated\.ts$" || true)
if [ -n "$STAGED_RUNTIME_SUMMARY" ]; then
  echo ""
  echo -e "${GREEN}🧾 runtime metric summaries 鮮度チェック...${NC}"
  if (cd "$PROJECT_ROOT/apps/web" && npx tsx scripts/generate-runtime-metric-summaries.ts --check > /tmp/runtime-summaries-check.log 2>&1); then
    echo -e "${GREEN}✅ runtime metric summaries は最新${NC}"
  else
    echo -e "${RED}❌ runtime metric summaries が古い/手編集されています。${NC}"
    grep -E "^   |❌|\[runtime-summaries\]" /tmp/runtime-summaries-check.log | head -10 || true
    echo -e "${YELLOW}💡 再生成: npm run generate:runtime-summaries --workspace apps/web${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
fi

# 6.6a3 ranking prominence (索引代表 / ホーム注目 / 問いかけコピー) の生成物鮮度チェック
#       metric config・導出規則・GSC snapshot・生成物 のいずれかが staged のとき発火。
#       この生成物を挟む理由は「/ranking を R2 非依存の純静的 SSG のまま保つ」ため
#       (apps/web/scripts/generate-ranking-prominence.ts)。
STAGED_PROMINENCE=$(git diff --cached --name-only --diff-filter=ACM | grep -E "^packages/data-configs/src/(metrics/.+|categories)\.ts$|^packages/data-configs/src/prominence/.+\.ts$|^\.claude/skills/analytics/gsc-improvement/reference/snapshots/.+/pages\.csv$" || true)
if [ -n "$STAGED_PROMINENCE" ]; then
  echo ""
  echo -e "${GREEN}🏅 ranking prominence 鮮度チェック...${NC}"
  if (cd "$PROJECT_ROOT/apps/web" && npx tsx scripts/generate-ranking-prominence.ts --check > /tmp/ranking-prominence-check.log 2>&1); then
    echo -e "${GREEN}✅ ranking prominence は最新${NC}"
  else
    echo -e "${RED}❌ ranking prominence が古い/手編集されています。${NC}"
    grep -E "^   |❌|\[ranking-prominence\]" /tmp/ranking-prominence-check.log | head -10 || true
    echo -e "${YELLOW}💡 再生成: npm run generate:ranking-prominence --workspace apps/web${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
fi

# 6.6b area-databook (県データブック SSOT) の整合 + 生成物鮮度チェック
#      (.claude/rules/area-databook-standards.md)。テンプレ/editorial または生成物が staged のとき発火。
STAGED_DATABOOK=$(git diff --cached --name-only --diff-filter=ACM | grep -E "^packages/data-configs/src/area-databook/.+\.ts$|^apps/web/scripts/data/page-components/area/.+\.json$" || true)

if [ -n "$STAGED_DATABOOK" ]; then
  echo -e "${GREEN}🗾 area-databook 整合チェック...${NC}"
  if (cd "$PROJECT_ROOT" && npx tsx packages/data-configs/scripts/validate-area-databook.ts > /tmp/validate-area-databook.log 2>&1); then
    echo -e "${GREEN}✅ area-databook 整合チェック成功${NC}"
  else
    echo -e "${RED}❌ area-databook に整合 error があります。${NC}"
    grep -E "^   |❌" /tmp/validate-area-databook.log | head -10 || true
    echo -e "${YELLOW}💡 規約: .claude/rules/area-databook-standards.md / 確認: npm run validate:area-databook --workspace=@stats47/data-configs${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
  if (cd "$PROJECT_ROOT" && npx tsx packages/data-configs/scripts/generate-area-databook.ts --check > /tmp/area-databook-check.log 2>&1); then
    echo -e "${GREEN}✅ area-databook 生成物は最新${NC}"
  else
    echo -e "${RED}❌ area-databook 生成物が古い/手編集されています。${NC}"
    grep -E "^   |❌" /tmp/area-databook-check.log | head -10 || true
    echo -e "${YELLOW}💡 再生成: npm run generate:area-databook --workspace=@stats47/data-configs${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
  if (cd "$PROJECT_ROOT" && npx tsx packages/data-configs/scripts/generate-editorial-index.ts --check > /tmp/editorial-index-check.log 2>&1); then
    echo -e "${GREEN}✅ editorial/index.ts は最新${NC}"
  else
    echo -e "${RED}❌ editorial/index.ts が古い (県別ファイル追加後の再生成漏れ)。${NC}"
    grep -E "^   |❌" /tmp/editorial-index-check.log | head -5 || true
    echo -e "${YELLOW}💡 再生成: npm run generate:editorial-index --workspace=@stats47/data-configs${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
fi

# 6.7 アフィリエイト広告のサイズ規約チェック (.claude/rules/affiliate-ads-standards.md §サイズ)
#     affiliate-ads-data.ts が staged のとき、canonical/legacy 以外のサイズ混入を弾く。
STAGED_AFFILIATE=$(git diff --cached --name-only --diff-filter=ACM | grep -E "^apps/web/scripts/affiliate-ads-data\.ts$" || true)

if [ -n "$STAGED_AFFILIATE" ]; then
  echo -e "${GREEN}📐 アフィリエイト サイズ規約チェック...${NC}"
  if (cd "$PROJECT_ROOT" && npx tsx .claude/scripts/ads/audit-affiliate-inventory.ts --json --check-size > /tmp/affiliate-size.log 2>&1); then
    echo -e "${GREEN}✅ 全 banner が canonical/legacy サイズ${NC}"
  else
    echo -e "${RED}❌ canonical(300x250/250x250/320x100)・legacy いずれにも無いサイズが混入しています。${NC}"
    grep -E "サイズ規約違反|非canonical" /tmp/affiliate-size.log | head -5 || true
    echo -e "${YELLOW}💡 300x250 素材で再取得するか isActive:false に。規約: .claude/rules/affiliate-ads-standards.md${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
fi

# 6.8 直接配置アフィリエイト台帳の構造チェック (/audit-affiliate-compliance)
#     affiliate-direct-placements-data.ts が staged のとき、ID 重複・URL scheme・配置形式の
#     構造 error を弾く (ネットワーク不要。本文突合は週次 CI が --live で実行)。
STAGED_DIRECT_AFFILIATE=$(git diff --cached --name-only --diff-filter=ACM | grep -E "^apps/web/scripts/affiliate-direct-placements-data\.ts$" || true)

if [ -n "$STAGED_DIRECT_AFFILIATE" ]; then
  echo -e "${GREEN}📐 直接配置アフィリエイト 構造チェック...${NC}"
  if (cd "$PROJECT_ROOT" && npx tsx .claude/scripts/ads/audit-affiliate-compliance.ts --check > /tmp/affiliate-direct.log 2>&1); then
    echo -e "${GREEN}✅ 直接配置台帳の構造 OK${NC}"
  else
    echo -e "${RED}❌ 直接配置台帳に構造 error があります。${NC}"
    grep -E "error|❌" /tmp/affiliate-direct.log | head -5 || true
    echo -e "${YELLOW}💡 skill: /audit-affiliate-compliance / SSOT: apps/web/scripts/affiliate-direct-placements-data.ts${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
fi

# 7. テストカバレッジチェック（オプション - 変更されたファイルに関連するテストのみ）
echo -e "${GREEN}🧪 テストカバレッジチェック（オプション）...${NC}"
STAGED_TS_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' | grep -v '\.test\.' | grep -v '\.stories\.' || true)

if [ -n "$STAGED_TS_FILES" ]; then
  echo -e "${YELLOW}💡 変更されたファイル: $(echo "$STAGED_TS_FILES" | wc -l | tr -d ' ')件${NC}"
  echo -e "${YELLOW}💡 テストカバレッジの確認を推奨: npm run test:coverage${NC}"
  # 警告のみで続行（テストは時間がかかるため、pre-commitではスキップ）
else
  echo -e "${GREEN}✅ TypeScriptファイルの変更なし${NC}"
fi

# ── backlog カードの鮮度リマインダ (blocker ではない) ─────────────────────────
# 変更したファイルを名指ししているカードがあれば知らせる。カードが古いまま残ると
# 別 PC が解決済みの問題に着手する (2026-08-21 に同一セッションで 2 回やった)。
# 止めない — カードを触る必要が無いこともあるため。
node "$PROJECT_ROOT/.claude/scripts/lib/check-card-freshness.cjs" 2>/dev/null || true

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
