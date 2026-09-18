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

# ステージ済みパスは一度取得し、一時ファイルの掃除で index が変わった場合だけ再取得する。
refresh_staged_paths() {
PRECOMMIT_PATHS_0=$(git diff --cached --name-only --diff-filter=ACM)
PRECOMMIT_PATHS_1=$(git diff --cached --name-only)
PRECOMMIT_PATHS_2=$(git diff --cached --name-only --diff-filter=ACMRD)
}
refresh_staged_paths

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# 1. TypeScript型チェック
# 通常commitでは実行しない。web全体を読むため単一ファイル変更でも約1分かかり、
# 編集の反復を止める。main PRの必須CIと週次full suiteが全体を検査する。
# ローカルで明示確認したい場合だけ PRECOMMIT_FULL_TYPECHECK=1 を付ける。
echo -e "${GREEN}📐 TypeScript型チェック...${NC}"
STAGED_WEB_TSFILES=$(printf '%s\n' "$PRECOMMIT_PATHS_0" | grep -E '^apps/web/.*\.(ts|tsx)$' | grep -v '^apps/web/scripts/' || true)
if [ -n "$STAGED_WEB_TSFILES" ] && [ "${PRECOMMIT_FULL_TYPECHECK:-0}" = "1" ]; then
  if ! (cd "$WEB_DIR" && npm run type-check > /dev/null 2>&1); then
    echo -e "${RED}❌ TypeScriptの型エラーが検出されました。${NC}"
    echo -e "${YELLOW}💡 詳細を確認: npm run type-check${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  else
    echo -e "${GREEN}✅ 型チェック成功${NC}"
  fi
elif [ -n "$STAGED_WEB_TSFILES" ]; then
  echo -e "${GREEN}✅ 全体型チェックは高速commitではskip（PR CI・週次CIで実行）${NC}"
  echo -e "${YELLOW}💡 明示実行: PRECOMMIT_FULL_TYPECHECK=1 git commit ...${NC}"
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
STAGED_SCRIPT_TSFILES=$(printf '%s\n' "$PRECOMMIT_PATHS_0" \
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

# Common static gates: shared with preflight, at most two processes at once.
GUARD_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# 2.2 sync-snapshots の task ドリフト (2026-08-05 の calculated-stats 書き忘れの再発防止)
# run.sh に task を足しても動くので CI は緑のまま、task の存在と実行順を人と agent が
# 読む面 (SKILL.md の task 表) だけが欠落する。両者を 1:1 に保つ。
if printf '%s\n' "$PRECOMMIT_PATHS_1" | grep -q "^.claude/skills/db/sync-snapshots/"; then
  echo -e "${GREEN}🔁 sync-snapshots task ドリフト...${NC}"
  if ! node "$GUARD_ROOT/.claude/scripts/lib/check-sync-snapshots-tasks.cjs"; then
    echo -e "${RED}❌ run.sh の TASKS と SKILL.md の task 表がずれています。${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
fi

# 2.1b ドキュメントガバナンス
# 文書の固定構成、frontmatter、TODO ID、実装計画INDEX、Claude/Codex共通SSOT、
# 削除・移動後の参照悪化を、文書関連差分があるcommitだけ検査する。
STAGED_DOCS=$(printf '%s\n' "$PRECOMMIT_PATHS_0"RD | grep -E \
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
STAGED_JS=$(printf '%s\n' "$PRECOMMIT_PATHS_0" | grep -E \
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
STAGED_DISPATCH=$(printf '%s\n' "$PRECOMMIT_PATHS_0" | grep -E \
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
STAGED_ANY=$(printf '%s\n' "$PRECOMMIT_PATHS_0" || true)
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
STAGED_IMAGE_PIPELINE=$(printf '%s\n' "$PRECOMMIT_PATHS_0" | grep -E \
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

# 2.3 ESLint (staged の apps/web TS/TSX) — CI の next lint と同基準で import/order 等を事前に弾く
# 背景: import/order は CI (Code Quality Check) でのみ検出され、ローカルで気付けず CI を1サイクル無駄にしていた
# (2026-06-23 deploy 時に発生)。staged ファイルだけを next lint にかけて高速に事前検出する。
echo -e "${GREEN}🧹 ESLint (staged ファイル)...${NC}"
STAGED_WEB_TS=$(printf '%s\n' "$PRECOMMIT_PATHS_0" | grep -E '^apps/web/src/.*\.(ts|tsx)$' || true)
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
      PRECOMMIT_INDEX_CHANGED=1
      CLEANED=$((CLEANED + 1))
    fi
  done
done

if [ $CLEANED -gt 0 ]; then
  echo -e "${YELLOW}⚠️  一時ファイル ${CLEANED} 件を自動削除しました${NC}"
else
  echo -e "${GREEN}✅ 一時ファイルチェック成功${NC}"
fi

# 4. ファイルサイズチェック
if [ "${PRECOMMIT_INDEX_CHANGED:-0}" = 1 ]; then refresh_staged_paths; fi
if ! node "$GUARD_ROOT/.claude/scripts/lib/preflight-commit.mjs" --commit-static; then
  ERROR_COUNT=$((ERROR_COUNT + 1))
fi
echo -e "${GREEN}📏 ファイルサイズチェック...${NC}"
MAX_FILE_SIZE=1048576 # 1MB
LARGE_FILES=$(printf '%s\n' "$PRECOMMIT_PATHS_0" | while read file; do
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
INVALID_FILES=$(printf '%s\n' "$PRECOMMIT_PATHS_0" | grep -E '.*[A-Z].*\.(ts|tsx|js|jsx)$' | grep -v node_modules || true)

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
if ! printf '%s\n' "$PRECOMMIT_PATHS_2" | grep -Eq '(^|/)(package(-lock)?\.json|npm-shrinkwrap\.json)$'; then
  echo -e "${GREEN}✅ 依存関係変更なし。脆弱性検査はCI・定期検査で実行${NC}"
elif (cd "$WEB_DIR" && npm audit --audit-level=moderate > /dev/null 2>&1); then
  echo -e "${GREEN}✅ 脆弱性チェック成功${NC}"
else
  echo -e "${YELLOW}⚠️  中程度以上の脆弱性が検出されました。${NC}"
  echo -e "${YELLOW}💡 詳細を確認: npm audit${NC}"
  echo -e "${YELLOW}💡 修正: npm audit fix${NC}"
  # 警告のみで続行（エラーで止めない）
fi

# 7. シークレット漏洩チェック（簡易版）
echo -e "${GREEN}🔐 シークレット漏洩チェック...${NC}"
STAGED_FILES=$(printf '%s\n' "$PRECOMMIT_PATHS_0")
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
STAGED_ARTICLES=$(printf '%s\n' "$PRECOMMIT_PATHS_0" | grep -E "^docs/21_ブログ記事原稿/[^/]+/article\.md$" || true)

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

# 6.45〜6.6b (2026-09-18 に pre-commit から外した / CI-SPEED-PRECOMMIT-TRIM-01)
#   単位セマンティクス鏡・metric years/config/SEO meta/polarity・topic catalog・theme catalog・
#   runtime metric summaries・ranking prominence・area databook の `npx tsx` 直列 6〜10 本。
#   それぞれが 2,000 件超の metric registry を読み、metric config を 1 件 staged しただけで
#   数分 (Windows PC で 12 分の記録) かかっていた。同じコマンドを
#     - push 前: `npm run preflight:pr` (並列・実測 20 秒)
#     - develop 着地: develop-quality-gate.yml の catalog-gates job (同じ preflight:pr)
#     - main PR: pr-quality-check.yml の Catalog Gates job
#   が走らせるので、commit ごとに直列で払わない。commit 前に手元で確かめたいときは preflight:pr。
STAGED_CATALOG_HINT=$(printf '%s\n' "$PRECOMMIT_PATHS_0" | grep -E "^packages/data-configs/src/(metrics|topics|theme-catalog|area-databook|unit)/|^packages/types/src/indicator-sets/|^apps/web/scripts/data/page-components/(theme|area)/" || true)
if [ -n "$STAGED_CATALOG_HINT" ]; then
  echo -e "${GREEN}📚 catalog / metric config の整合チェックは commit では走らせない${NC}"
  echo -e "${YELLOW}💡 push 前に: npm run preflight:pr (develop 着地時と main PR の CI でも同じ検査が走る)${NC}"
fi

# 6.7 アフィリエイト広告のサイズ規約チェック (.claude/rules/affiliate-ads-standards.md §サイズ)
#     affiliate-ads-data.ts が staged のとき、canonical/legacy 以外のサイズ混入を弾く。
STAGED_AFFILIATE=$(printf '%s\n' "$PRECOMMIT_PATHS_0" | grep -E "^apps/web/scripts/affiliate-ads-data\.ts$" || true)

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
STAGED_DIRECT_AFFILIATE=$(printf '%s\n' "$PRECOMMIT_PATHS_0" | grep -E "^apps/web/scripts/affiliate-direct-placements-data\.ts$" || true)

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
STAGED_TS_FILES=$(printf '%s\n' "$PRECOMMIT_PATHS_0" | grep -E '\.(ts|tsx)$' | grep -v '\.test\.' | grep -v '\.stories\.' || true)

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
