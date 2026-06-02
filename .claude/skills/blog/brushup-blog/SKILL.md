---
name: brushup-blog
description: ブログ記事の brushup (改善優先度キュー生成 / 1 記事リライト / ユーザー指示時の一括リライト)。--target priority で GSC × D1 から brushup-queue.md 生成、--target article <slug> でリライト (default focus=CTR-reframe、エキスパート視点追加 focus 時のみ nlm cross query で白書補強)、--target batch で優先度上位を一括リライト。Use when user says "ブログ改善優先度", "どの記事を直す", "ブログをブラッシュアップ", "記事を補強", "一括リライト", "brushup".
argument-hint: --target priority | --target article <slug> [--focus CTR-reframe|エキスパート視点追加|最新データ更新|CTA強化] | --target batch [--count 5] [--dry-run]
primary_agent: article-writer
---

# /brushup-blog — ブログ記事 brushup (優先度キュー生成 + 1 記事リライト + 一括リライト)

旧 `/brushup-blog-priority` (キュー生成)・`/brushup-blog-article` (1 記事リライト)・`/auto-brushup-batch` (一括 rewrite) を統合した skill。 `--target` で 3 モードを切り替える。 **リライトの実行エンジンは `--target article` に一本化**され、`--target batch` はそのエンジンをユーザー指示時に複数記事へループ適用する (cron 自律実行はしない)。

## 引数

```
/brushup-blog --target <priority|article|batch> [<slug>] [--focus <観点>] [--count N] [--dry-run]
```

| 引数 | 必須 | 説明 |
|---|---|---|
| `--target` | Yes | `priority` (キュー生成) / `article` (1 記事リライト) / `batch` (一括リライト、ユーザー指示時のみ) |
| `<slug>` | `--target article` 時のみ Yes | 記事スラグ (例: `household-income-tokyo-okinawa`) |
| `--focus` | `--target article` の時 Optional | リライト観点 (省略時 `CTR-reframe`): `CTR-reframe` / `エキスパート視点追加` / `最新データ更新` / `CTA強化` |
| `--count` | `--target batch` の時 Optional | 処理件数 (default 5、最大 5 にクランプ) |
| `--dry-run` | `--target batch` の時 Optional | 候補選定 + framing スコア report のみ (書込・commit なし) |

---

## --target priority: ブログ改善優先度キュー生成

GSC の impressions × CTR と D1 の article メタデータを掛け合わせて、改善効果が最も高い記事を特定し `brushup-queue.md` に出力する。

### データソース

| データ | 場所 |
|---|---|
| GSC ページ別週次 | `.claude/skills/analytics/gsc-improvement/reference/snapshots/<最新週>/pages.csv` |
| D1 articles テーブル | sqlite MCP (`.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe5...sqlite`) |

### 実行フロー (priority)

#### Step 1: 最新 GSC ページデータ読み込み

```bash
# 最新週を特定
ls .claude/skills/analytics/gsc-improvement/reference/snapshots/ | sort | tail -1
```

`.claude/skills/analytics/gsc-improvement/reference/snapshots/<最新週>/pages.csv` を Read する。
`/blog/` を含む行のみを抽出し、 slug を `https://stats47.jp/blog/` 以降の文字列として取得する。

#### Step 2: D1 から記事メタデータ取得

sqlite MCP で以下をクエリ:

```sql
SELECT slug, title, published_at, updated_at
FROM articles
WHERE slug IS NOT NULL
ORDER BY updated_at ASC;
```

#### Step 3: スコアリング

| 指標 | 計算式 | 意味 |
|---|---|---|
| CTR ギャップ | `全記事平均 CTR - ページ CTR` | 大きいほど「見つかっているが読まれない」 |
| インプレッション | `impressions` 数値そのまま | 大きいほど改善効果が広い |
| スコア | `CTR ギャップ × log10(impressions + 1)` | 両指標の積 (log スケール) |

スコア降順でソートし上位 20 本を選定する。
GSC データは実測値。 D1 の `articles` テーブルの `updated_at` が古い記事はボーナス +0.2 を加算。

#### Step 4: brushup-queue.md 出力

`docs/20_ブログ記事企画/brushup-queue.md` に以下の形式で書き出す:

```markdown
# ブログ改善優先度キュー

生成日: YYYY-MM-DD / GSC 参照週: YYYY-Www

| 優先度 | slug | タイトル | impressions | CTR | 平均比 | スコア |
|---|---|---|---|---|---|---|
| 1 | household-income-tokyo-okinawa | ... | 1,177 | 4.4% | -1.8% | 2.31 |
...
```

### Step 5: 次のアクション案内

キュー上位を `/brushup-blog --target article <slug>` で実際に改善するよう案内。

---

## --target article: 1 記事リライト (唯一のリライトエンジン)

ブログ記事を 1 本リライトする。**`--target batch` もこのエンジンを内部で呼ぶ**。`--focus` でリライト観点を切り替える (省略時 `CTR-reframe`)。

### focus 別の動作

| focus | 編集範囲 | NotebookLM | 主目的 |
|---|---|---|---|
| `CTR-reframe` (default) | 全文 reframe (seoTitle / description / 本文) | ❌ 使わない | CTR 改善 (curiosity gap タイトル + 構造的発見) |
| `エキスパート視点追加` | 1-2 セクションのみ部分補強 | ✅ `nlm cross query` (**対話実行限定**) | 白書引用・政策背景 |
| `最新データ更新` | データ説明部分のみ | ❌ | 最新年度値へ差し替え |
| `CTA強化` | 記事末尾の関連リンク | ❌ | 回遊性 |

> **NotebookLM ガード (重要)**: `エキスパート視点追加` focus は `notebooklm` CLI が対話 OAuth 前提でヘッドレス非対応のため、**人間が起動する単記事実行時のみ**選べる。`--target batch` から内部呼び出しされた場合はこの focus を**強制的に拒否し `CTR-reframe` に倒す** (OAuth 失効でループが詰まる事故を防ぐ)。

### 絶対遵守 (2026-05-25 追加, 全 focus 共通)

**rule**: リライトで追加・変更する数値 / rank はすべて data ファイルから copy-paste。 memory や類推で書かない。

補強完了後、 必ず factual cross-check を通す:

```bash
node .claude/scripts/lib/article-factual-check.mjs \
  ".local/r2/app/blog/<slug>/article.md" \
  ".local/r2/app/blog/<slug>/data"
```

exit 1 なら修正 → 再 check して pass するまで繰り返す。 詳細: `.claude/skills/blog/SHARED-failure-cases.md`

### 共通 Step A: 記事読込・診断 + ground-truth 確認 (全 focus)

1. `.local/r2/app/blog/<slug>/article.md` を Read (frontmatter + 本文 + H2 構成 + callout/chart 数を把握)
2. 「何が不足しているか」を診断し focus を確定 (引数で明示されていれば従う):
   - **CTR が低い (タイトルに curiosity gap なし)** → `CTR-reframe`
   - **エキスパート視点なし** (白書引用・政策的背景が薄い) → `エキスパート視点追加` ※単記事・対話実行時のみ
   - **最新データなし** (`publishedAt` が 12 ヶ月以上前) → `最新データ更新`
   - **CTA 弱い** (末尾の関連リンク・ランキング誘導が貧弱) → `CTA強化`
3. **ground-truth 確認 (必須)**: `ls .local/r2/app/blog/<slug>/data/` → 各 JSON を Read し、本文で言及する都道府県の `{rank, value, label}` を確認。本文に書く数値・rank はこの値のみ使う (derive 計算は過程を明示)。

### focus=CTR-reframe のフロー (default)

全文 reframe で CTR を改善する。タイトルの curiosity gap が CTR の主因 (`.claude/rules/blog-quality-standards.md` の実証)。

#### C-1. 関連 metrics 探索 (面白い対比探し)

D1 で同カテゴリの関連 metric を 3-5 個ピックアップ:

```bash
sqlite3 ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite" \
  "SELECT key, title FROM metrics WHERE category_key='<カテゴリ>' AND is_active=1 LIMIT 20;"
```

「面積 vs 効率」「平均 vs 中央値」「総量 vs 比率」「TOP1 単独 vs TOP10 集中度」等の **対比軸** を 1-2 個発見する。

#### C-2. 5 案 framing 生成 → 4 軸採点 → best 選択

1 記事に対し **必ず 5 つの framing 案**を内的に生成し、各案を 4 軸で 0-10 点採点:

| 評価軸 | 内容 | 重み |
|---|---|---|
| practical_value | 読者が明日使える知識か | 30% |
| structural_finding | データから読み解ける構造的発見か | 30% |
| data_grounding | データを正確に反映しているか (誇張なし) | 25% |
| non_sensational | 扇情的でなく curiosity gap が本質的か | 15% |

**合計 30 点以上**の案がなければこの記事を skip (batch 時は次候補へ)。`rice-harvest` の「X倍格差」失敗事例 (本質的価値ゼロの数値倍率) を再発させない。

#### C-3. best framing で全文 reframe

best 案で seoTitle / description / 本文を再構成する。構成テンプレ (`.claude/rules/blog-quality-standards.md` 準拠):

1. 冒頭 (緊張感セットアップ + 中核質問)
2. データ概要
3. 構造的発見 1 (主要) / 4. 構造的発見 2 (対比)
5. 対立軸 or 限界 / 6. まとめ + 政策含意・実用 take-away
7. データの位置づけ (古いデータは基準年フレーミング) / 8. 出典 + ライセンス
9. 関連ランキング・記事 (内部リンク 6+ 個)

必須要素: callout 3-4 個 (`[!NOTE]`/`[!WARNING]`/`[!TIP]` ミックス) / chart 1-2 個 (SVG、TOP10 + 対比) / 内部リンク 6+ 個。`<source-link href="/ranking/...">` は対応する図の直下にインライン配置 (末尾集約禁止)。

### focus=エキスパート視点追加 のフロー (対話実行限定・1-2 節のみ)

**全文書き直し禁止。編集は 1-2 セクションのみ。** `--target batch` からは選べない (NotebookLM ガード)。

#### 前提条件

```bash
nlm --version  # 0.6.5 以上 (/Users/minamidaisuke/.local/bin/nlm)
```

#### ノートブック × テーマ マッピング (エキスパート視点追加 focus 用)

記事スラグのキーワードから適切なノートブックを自動選択する:

| キーワード例 | 使用ノートブック |
|---|---|
| income, wage, salary, tax, fiscal, gdp | 経済財政白書 |
| medical, hospital, nurse, care, nursing, birth, fertility, child, suicide | 厚生労働白書 |
| road, infrastructure, port, housing, construction, traffic | 国土交通白書 |
| energy, electricity, solar, renewable, carbon | エネルギー白書,第６次エネルギー基本計画 |
| environment, recycling, waste, pollution, climate | 環境白書 |
| ict, telework, digital, smartphone, internet | 情報通信白書 |
| traffic-accident, transport, logistics, travel | 交通政策白書 |
| manufacturing, industry, productivity, factory | ものづくり白書 |
| small-business, entrepreneur, startup | 中小企業白書 |
| child, education, school, kindergarten, childcare, fertility | こども白書 |
| population, aging, migration, solo-living | 経済財政白書,厚生労働白書 |

複数ノートブックを `--notebooks "白書A,白書B"` でカンマ結合して渡す。

#### nlm cross query で白書調査

```bash
nlm cross query --notebooks "<ノートブック名>" \
  "「<記事テーマ>」について、 背景・政策的意義・最新トレンド・都道府県間格差の要因を教えてください。 引用根拠付きで回答してください。"
```

クエリ結果を整理する ([背景・政策] / [最新データ] / [専門的観点] / [引用元] `<ノートブック名>` より)。

#### 差分のみ article.md に反映

各 H2 の散文導入 or 考察セクションに白書引用・政策背景・専門的解説を 2-3 文追加する。Edit ツールで最小限の変更を適用する (全文書き直し禁止)。

### focus=最新データ更新 / CTA強化 のフロー (部分編集)

| focus | 反映先 | 内容 |
|---|---|---|
| 最新データ更新 | データ説明部分 | data/*.json・D1 の最新年度値に差し替え |
| CTA強化 (関連ランキング誘導) | **対応する図・データを扱う H2 セクション内** (SVG 図の直下等) | そのセクションが言及するランキングへ `<source-link href="/ranking/...">` を**インライン配置**。**記事末尾に集約しない** (回遊性・文脈性を損なう)。ナビ目的の `/category/` `/themes/` への `<source-link>` は末尾の関連セクションで可。検査: `node .claude/scripts/blog/audit-article-structure.mjs` |

### 共通 Step B: bold+括弧レンダリングバグ検出・修正 (必須, 全 focus)

```bash
node .claude/scripts/blog/lint-article.cjs <slug>
```

exit 1 (問題あり) の場合は、 検出行を Edit ツールで修正する。

修正パターン:
- `**text（内側）**` → `**text**（内側）` (括弧をボールドの外へ移動)
- `**text（内側）**:` → `**text**（内側）:` (コロン前も同様)

修正後に再度 lint を実行して exit 0 を確認してから次へ進む。

### 共通 Step C: quality-gate + 完了レポート (全 focus)

リライト確定前に factual + 形式の防壁を通す:

```bash
node .claude/scripts/blog/quality-gate.mjs <slug>
# exit 0 → 確定 / exit 1 → blocker を修正して再実行 (batch では revert + skip)
```

quality-gate は内部で `article-factual-check.mjs` を呼び、rank/値の data 突合・callout/内部リンク/H2・**prose 文字数の床 (1600)**・NG ワード・**truncated 表**を一括検証する。

> **★公開記事は blog-critic レビュー (review.md verdict: PASS) が必須**: `published:true` の記事は
> `docs/21_ブログ記事原稿/<slug>/review.md` (別 agent `blog-critic` が `/blog-review --mode expert` で生成、
> verdict: PASS) が無いと quality-gate が blocker で止める。**リライトした本人が自己採点しない** ——
> 必ず別コンテキストの blog-critic に意味レビュー (冗長・図表重複・水増し・CTA過多・読者価値) を依頼し、
> REVISE 指摘を反映してから PASS を得る。文字数の量的十分性も critic が判断する (高い文字数床で水増しを誘発しない)。
> 詳細: `.claude/rules/blog-quality-standards.md`「品質の3層モデルと critic 必須」。

#### 共通 Step B2: 表現の正典化 (全 brushup で必ず適用・2026-06-02)

リライト時、記事 markdown を `.claude/rules/blog-quality-standards.md`「記事 markdown の正典テンプレート」に揃える。
以下は **quality-gate が blocker 化**しているので必ず是正する (棚卸し: `audit-published-blog.mjs`):

1. **チャート**: `<chart-placeholder ... data="X"/>` と インライン `<svg>` を **生成画像 `![](data/X.svg)`** に統一。
   - data/*.json があれば `node .claude/scripts/blog/generate-article-charts.mjs --slug <slug>` で **上位5+下位5** SVG を生成し placeholder を自動置換。data が無ければ `fetch-article-data.mjs` で ranking から取得してから生成。
2. **記事内『関連ランキング/関連記事』セクション削除**: ページ側 (`RelatedRankingsSection`/`BlogRelatedArticlesSection`) が正典。`## 関連ランキング` `### 関連記事` 見出しごと markdown から除去 (二重表示の解消)。
3. **source-link を各図直下にインライン配置**: 末尾集約をやめ、対応する図の直下へ分散。
4. **truncated 表 / 上下非対称表の除去**: 全件表 or SVG 化 (上下対称)。

```
=== /brushup-blog --target article: <slug> 完了 ===
focus: <CTR-reframe | エキスパート視点追加 | 最新データ更新 | CTA強化>
採用 framing: <CTR-reframe 時、best 案 + 採点。それ以外は「-」>
参照ノートブック: <エキスパート視点追加 時のみ。それ以外は「-」>
変更内容: <1-2 行で要約>
factual-check: ✅ exit 0 / quality-gate: ✅ exit 0 / bold lint: ✅ exit 0
```

---

## --target batch: 一括リライト (ユーザー指示時のみ)

GSC で改善余地の大きい blog 記事を優先度順に選び、`--target article` エンジン (CTR-reframe focus 固定) でまとめてリライトする。**ユーザーが「一括リライト」等を明示した時のみ実行**。cron 自律実行・PR auto-merge はしない (旧 `/auto-brushup-batch` から移植、自動化部分は除外)。

### 安全装置

- **1 回最大 5 記事** (`--count` > 5 は 5 にクランプ)
- **全件 skip 日は commit せず終了**
- **90 日以内に brushup した記事は dedup** (`.claude/state/blog/auto-brushup-history.json`)
- **NotebookLM 不使用** (バッチは CTR-reframe focus 固定。エキスパート視点追加は対話実行のみ)

### Step 1: 候補選定

```bash
node .claude/scripts/blog/select-brushup-candidates.mjs --count 5 > /tmp/candidates.jsonl
```

候補が 0 件なら終了。(注: 旧 30 日 plan `auto-brushup-plan.json` / `generate-brushup-plan.mjs` は cron 廃止に伴い**参照しない** — deprecated)

### Step 2: 各候補を 1 件ずつリライト

各候補 slug に対し `--target article <slug> --focus CTR-reframe` のフロー (共通 Step A → C-1〜C-3 → 共通 Step B/C) を実行する。

- リライト前に `cp .local/r2/app/blog/<slug>/article.md /tmp/brushup-backup-<slug>.md`
- 5 案採点で合計 30 点未満なら skip
- `node .claude/scripts/blog/quality-gate.mjs <slug>` が exit 1 なら revert (`cp /tmp/brushup-backup-<slug>.md .local/r2/app/blog/<slug>/article.md`) + skip-log

`--dry-run` の場合はここで停止し、候補一覧 + 各 framing スコアを report 出力 (書込・commit なし)。

### Step 3: sync + commit + PR (通過 ≥ 1 件時のみ)

```bash
npm run articles:sync-from-r2 --workspace=packages/database
bash .claude/skills/db/sync-snapshots/run.sh --only blog

git checkout -b feature/brushup-batch-YYYY-MM-DD develop
git add .
git commit -m "brushup-batch: N 記事 rewrite (slugs: ...)"
git checkout develop
git merge --no-ff feature/brushup-batch-YYYY-MM-DD -m "Merge brushup-batch YYYY-MM-DD"
git push origin develop

gh pr create --base main --head develop \
  --title "brushup-batch YYYY-MM-DD (N 記事)" \
  --body "$(cat /tmp/brushup-report.md)"
```

**ここで停止する。`gh pr merge --auto` は付けない** — CI green 確認後に人間がマージする (`.claude/rules/branch-workflow.md` の develop→main ゲート)。

### Step 4: history 更新

`.claude/state/blog/auto-brushup-history.json` に通過記事を追記:

```jsonc
{ "date": "YYYY-MM-DD", "wave_id": "YYYY-MM-DD-auto", "slug": "...", "framing": "...", "expectedLift": N }
```

- `wave_id` は `YYYY-MM-DD-auto`。同日再実行は `-2`, `-3` と連番化し、既存 `2026-05-25-auto` 等と衝突させない (`.claude/rules/blog-data-schema.md` の wave 命名規則)。
- skip した記事は `.claude/state/blog/auto-brushup-skipped.log` に記録 (週次レビューで prompt 改善の手がかり)。

---

## 参照

- **記事品質の正典: `.claude/rules/blog-quality-standards.md`** (curiosity gap / callout / 内部リンク / source-link 配置の単一ソース)
- 優先度キュー: `docs/20_ブログ記事企画/brushup-queue.md` (`--target priority` で生成)
- 品質確認: `/blog-review --mode proofread` で最終チェック
- factual + 形式の防壁: `node .claude/scripts/blog/quality-gate.mjs <slug>` (内部で `article-factual-check.mjs` を呼ぶ)
- 失敗事例 ledger: `.claude/skills/blog/SHARED-failure-cases.md`
- nlm ヘルプ: `nlm cross --help` (エキスパート視点追加 focus 用)

## 移行ステータス

本 skill は旧 `/brushup-blog-priority` (キュー生成)・旧 `/brushup-blog-article` (1 記事補強)・旧 `/auto-brushup-batch` (一括 rewrite) を統合したもの。 旧 skill はすべて削除済み。 リライトの実行ロジックは `--target article` に一本化され、`--target batch` はそれをループ適用する薄い orchestrator。cron 自律実行は廃止 (ユーザー指示時のみ実行)。
