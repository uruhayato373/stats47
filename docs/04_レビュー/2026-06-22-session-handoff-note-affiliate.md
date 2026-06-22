---
type: session-handoff
date: 2026-06-22
status: in-progress
---

# ハンドオフ: note アフィリエイトバナー挿入バッチ

## 目的

koumuin-claude-code (24記事) + koumuin-estat-claude-code (12記事) = 計36記事に、
AI Agent Camp (a8.net) のアフィリエイトブロックを挿入して再公開する。

- **挿入内容**: 5段落PR文 + バナー画像 (`ai_agent_camp.png`) + a8リンク
- **挿入位置**: `## まとめ` の直前（まとめが無い記事は別途対応）
- **バナーURL**: `https://px.a8.net/svt/ejp?a8mat=4B3RUY+AG9Z3M+5VRC+5YZ75`

---

## 現状（2026-06-22 作業中断時点）

### ✅ 完了（挿入 + 公開済み）

| # | slug | vertical | paid |
|---|---|---|---|
| 02 | 02-internal-network-workarounds | koumuin-claude-code | false |
| 03 | 03-it-dept-security-doc | koumuin-claude-code | true |
| 04 | 04-meeting-minutes-30min-to-5min | koumuin-claude-code | false |
| 05 | 05-assembly-answer-prompts | koumuin-claude-code | true |

※ 05は一度二重挿入が発生→DOM操作で削除→再公開済み。

### ⚠️ 挿入済みドラフト・未公開（publish_update のみ必要）

| # | slug | noteId | 状況 |
|---|---|---|---|
| 06 | 06-ordinance-revision-review | ne23e18ce9289 | 前バッチがkillされた時点でinsert_affiliateは完了済み、publish_updateが未実行 |

**対処**: `publish_update "06-ordinance-revision-review"` を単独実行すればOK。

### ❌ 失敗・未処理（再試行が必要）

| # | slug | noteId | 状況 |
|---|---|---|---|
| 00 | 00-claude-code-intro-for-public-servants | n455ec72c5d62 | editor not loaded（前回バッチ起動直後に連続失敗。かつエディタドラフトに画像破損あり） |
| 01 | 01-claude-code-setup-complete | nc5126820c00d | editor not loaded（同上） |

### ⏳ 未処理（07以降全て）

koumuin-claude-code: 07〜21, 31, 32
koumuin-estat-claude-code: 00〜11

---

## スクリプト構成

### メインスクリプト
```
.claude/scripts/note/affiliate-incremental.sh
```
- `insert_affiliate <noteId> <slug>`: まとめ直前にPR文+バナー+a8リンクを増分挿入
- `publish_update <slug>`: 公開に進む→更新する（無料/有料自動判定）
- **冪等性**: a8リンク OR "申し込んでいただく" テキストが既にあればSKIP
- **ロード待機**: BU open後10秒 + 最大30秒リトライ（editor not loaded 対策）

### バッチドライバ
```
/tmp/note-batch.sh   ← /tmp なので再起動後は消える可能性あり
```
引数: 処理するslugをスペース区切りで（省略時は全TSV）

### ターゲットリスト
```
/tmp/note-update-targets.tsv
```
形式: `slug\tnoteId\tvertical\tisPaid`  ← /tmp なので要注意

---

## 再開手順

```bash
cd /Users/minamidaisuke/stats47
export PATH="$HOME/.browser-use-env/bin:$PATH"
source .claude/scripts/note/affiliate-incremental.sh

# Step 1: 06のドラフトを公開（insert不要・publish_updateのみ）
pub_out=$(publish_update "06-ordinance-revision-review" 2>&1)
echo "$pub_out"

# Step 2: 07以降を実行（バッチファイルが消えていれば再作成が必要）
bash /tmp/note-batch.sh \
  07-official-doc-skills 08-proposal-doc-checklist-20 09-assembly-question-points \
  10-ai-without-personal-info 11-hooks-personal-info-masking 12-audit-ready-settings \
  13-ollama-offline-local-llm 14-excel-budget-aggregation 15-data-preprocessing-intro \
  16-subsidy-doc-consistency 17-year-on-year-analysis 18-pr-magazine-rewrite \
  19-faq-auto-generation 20-complaint-reply-patterns 21-disaster-sns-multilang \
  31-claude-code-how-to-ask 32-claude-skills-getting-started \
  00-estat-claude-code-intro 01-estat-api-key-setup 02-search-estat-statsdataid \
  03-fetch-prefecture-ranking 04-excel-download-and-parse 05-pandas-duckdb-derived-metrics \
  06-prefecture-code-and-merge 07-year-on-year-diff 08-benchmark-table-5min \
  09-assembly-chart-generation 10-claude-skills-routinize 11-mcp-sqlite-search

# Step 3: 00・01は個別対応
# browser-use --headed --profile "Profile 5" open "https://editor.note.com/notes/n455ec72c5d62/edit"
# → ロード確認後に insert_affiliate "n455ec72c5d62" "00-claude-code-intro-for-public-servants"
```

---

## 既知の問題・注意事項

### 00/01 の "editor not loaded" 問題
- バッチ起動直後の最初2記事が連続失敗する現象（3件目以降は正常）
- 原因不明（browser-useウォームアップ? note.com のセッション遷移?）
- **回避策**: バッチの前に適当な記事を1件手動でopenしてウォームアップしてから実行
- 00は追加でエディタドラフトに画像破損問題あり（ライブ記事は正常）

### まとめ無しの記事（NO_ANCHOR）
estat系の多くの記事は `## まとめ` がない。
`_position_before_anchor` は「関連記事」「次に読む」もフォールバックで探すが、
それも無い場合は `no-anchor` を返しスキップする。
→ 対象: koumuin-estat-claude-code の 03〜11 あたり（要確認）

### 二重挿入の予防
冪等チェック（修正済み）: a8リンク OR "申し込んでいただく" テキストを検出→SKIP
ただしSKIP後にpublish_updateが走らないため、「ドラフトのみ挿入済み・未公開」の
記事はSKIP扱いになって公開されない（06のケース）。

### バナーのリンク設定の確認
note.com エディタの画像リンクは `aria-label=リンク` ボタン → textarea(placeholder=https://) → 適用ボタン。
「リンクを設定」（テキスト選択時）とは別UI。

---

## ファイル一覧

| ファイル | 内容 |
|---|---|
| `.claude/scripts/note/affiliate-incremental.sh` | メイン処理スクリプト（git管理） |
| `.claude/assets/affiliate-banners/ai_agent_camp.png` | バナー画像（git管理） |
| `/tmp/note-batch.sh` | バッチドライバ（/tmp = 要再作成） |
| `/tmp/note-update-targets.tsv` | 36記事のnoteIdリスト（/tmp = 要再作成） |
| `/tmp/note-batch-result.tsv` | 実行結果ログ（/tmp） |
| `/tmp/note-batch.log` | 詳細ログ（/tmp） |
