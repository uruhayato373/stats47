---
name: triage-improvement-log
description: 改善バックログ全施策を Tier × 期日マトリクスで可視化 + 自動アクション提案 + CSV エクスポート (triage-matrix.mjs の高度ラッパー)。Use when user says "改善ログ triage", "施策の優先順位", "triage-improvement-log".
primary_agent: improvement-triage
---

# triage-improvement-log

`.claude/todo/04_改善バックログ.md` の pending / in-progress 施策を、**Tier × 期日カテゴリ** のマトリクスで一望し、人間が「次にどれを潰すか」を判定するための UX レイヤースキル。

`triage-matrix.mjs` (原始抽出) の上に、weekly triage 用の表示モード (markdown / csv / matrix) と自動アクション提案を追加する。

## いつ使うか

- 週次 triage Issue (`.github/workflows/improvement-log-reminder-weekly.yml`) のレビュー時
- weekly-plan で「今週どの改善施策に着手するか」決める前
- effect 判定が遅延している施策の一括棚卸し
- CSV に書き出して Notion / スプレッドシートで管理したいとき

## 実行コマンド

```bash
# Markdown 素通し (Tier 順 table)
node .claude/scripts/lib/triage-matrix.mjs --format markdown

# CSV エクスポート (Notion / スプレッドシート向け)
node .claude/scripts/lib/triage-matrix.mjs --format csv > /tmp/triage.csv

# Tier × 期日マトリクス + 自動アクション提案 (推奨)
node .claude/scripts/lib/triage-matrix.mjs --format matrix

# 基準週を指定 (ISO 8601, 過去週の triage を再現するため)
node .claude/scripts/lib/triage-matrix.mjs --format matrix --week 2026-W21
```

## 引数

| 引数 | 値 | デフォルト | 説明 |
|---|---|---|---|
| `--format` | `markdown` \| `csv` \| `matrix` | `markdown` | 出力形式 |
| `--week` | `YYYY-Www` (ISO 8601) | 今週 | matrix モードの基準週 (この週の日曜を「今週日曜」とする) |

## 出力モード詳細

### markdown

Tier 順 table + 詳細リンク。

### csv

1 行ヘッダー + データ行の CSV:

```
tier,status,id,title,deployed_at,due,overdue_days,owner,metric
2,pending,BLOG-CTR-02,"SEO タイトル改修, 上位 50 記事",2026-05-17,,1,,gsc
1,in-progress,T0-DECAY-01,旧記事 410 化バッチ,2026-05-10,2026-05-24,8,claude,gsc
```

title 内のカンマは `"..."` でエスケープ。`"` 自体は `""` でエスケープ。

### matrix

Tier × 期日カテゴリの集計マトリクス。

```
### Tier × 期日マトリクス (基準: 今日=2026-05-18, 今週日曜=2026-05-24)

| Tier | 今週 | 来週 | 来来週 | 超過 | 未定 |
|---|---|---|---|---|---|
| 1 | 2 | 1 | 0 | 3 | 1 |
| 2 | 1 | 0 | 0 | 1 | 2 |
| 3 | 0 | 0 | 0 | 0 | 1 |

### 自動アクション提案

- **EXP-005** (gsc, tier 1, deployed 2026-04-20, 28d): 期限切れ警告: 検証コマンド実行 or due 延長 → .claude/todo/04_改善バックログ.md#exp-005
- **T2-CLEAN-03** (ga4, tier 2, due 2026-05-10): effect 判定実施を本週内に → .claude/todo/04_改善バックログ.md#t2-clean-03
```

期日カテゴリ判定 (今日基準):

| カテゴリ | 条件 |
|---|---|
| 今週 | `due ≤ 今週日曜` |
| 来週 | `今週日曜 < due ≤ 来週日曜` |
| 来来週 | `来週日曜 < due ≤ 来来週日曜` |
| 超過 | `deployed_at から 14 日以上経過 & status=pending` (due 無関係) |
| 未定 | `due` が null (または 3 週超先) |

`tier=null` または `tier >= 4` は tier 3 にまとめて表示。

自動アクション提案 2 種:

1. **期限切れ警告** — `status=pending` で `deployed_at から 14 日以上` 経過した施策。「検証コマンド実行 or due 延長」を促す
2. **effect 判定催促** — `status=in-progress` で `due` が今日より過去の施策。「effect 判定実施を本週内に」を促す

## 典型ワークフロー

### 週次 triage Issue 起票時

```bash
# 1. matrix で全体感を把握
node .claude/scripts/lib/triage-matrix.mjs --format matrix

# 2. 「超過」列に注目し、各施策の検証コマンドを実行
# 3. 必要なら csv に書き出して Notion に貼る
node .claude/scripts/lib/triage-matrix.mjs --format csv > /tmp/triage-$(date +%Y-W%V).csv
```

### weekly-plan で着手対象を決めるとき

```bash
# 今週日曜までに due の施策のみ抽出 (markdown 素通し)
node .claude/scripts/lib/triage-matrix.mjs --format markdown
# → Tier 1 の「今週」列の施策を週次計画に転記
```

## 関連

- `.claude/scripts/lib/triage-matrix.mjs` — 本スキルの実装
- `.github/workflows/improvement-log-reminder-weekly.yml` — 週次 triage Issue 起票 (本スキルの主要呼び出し元)
- `.claude/todo/04_改善バックログ.md` — 改善バックログ全体 (TODO 真実源)
- `.claude/rules/docs-vs-issues.md` — 改善施策の置き場所
- `.claude/rules/evidence-based-judgment.md` — effect 判定の実証ベース原則

## 制約・注意

- 本スキルは `.claude/todo/04_改善バックログ.md` を直接書き換えない (read-only)
- 集計対象は triage-matrix.mjs の対象と同じ (status: pending | in-progress)
- TEMPLATE section (`-XXX` で終わる ID 等) は自動除外
- マトリクスの集計は今日 (UTC) を基準。timezone shift は意図的に行わない
