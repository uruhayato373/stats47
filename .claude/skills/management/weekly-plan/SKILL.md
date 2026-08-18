---
name: weekly-plan
description: 週次計画を生成する（決定的な並列収集→戦略分析→批判的レビュー→計画出力）。Use when user says "週次計画", "今週の計画", "来週の予定". KPIベースで優先順位を決定する。
primary_agent: strategy-advisor
---

プロジェクトの現状を多角的に調査し、戦略的な週次計画を生成する。

## 引数

```
/weekly-plan [YYYY-Www]
```

- 週番号（任意）: ISO 8601 週番号（例: `2026-W11`）。省略時は今週。

## 概要

5つの観点から tool / snapshot を並列に読み（開発状況・コンテンツ・パフォーマンス・計画課題・トレンド）、KPI に照らして優先順位を決定し、実行可能な週次計画を出力する。

## 手順

### Phase 1: コンテキスト収集（同一セッションの並列 tool call）

5つの観点を同一セッションで収集する。数回の read / shell call で終わるため subagent は起動しない。

#### Track A: 開発状況

```
調査項目:
- git log --oneline -20（直近の開発活動）
- git branch -a（作業中ブランチ）
- git diff --stat（未コミット変更）
- 型チェックエラーの有無（npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | tail -5）

出力形式: 箇条書きで「今週何が開発されたか」「未完了の作業」「技術的負債」をまとめる
```

#### Track B: コンテンツパイプライン

```
調査項目:
- 投稿台帳 `.claude/state/sns/posts.json` からステータス別集計 (完全DBレス。旧 D1 sns_posts は廃止):
  ```bash
  node -e 'const s=require("./.claude/scripts/lib/sns-posts-store.cjs");const by={};for(const p of s.loadAll()){const k=(p.domain||"?")+"/"+(p.platform||"?")+"/"+(p.status||"?");by[k]=(by[k]||0)+1}console.log(JSON.stringify(by,null,2))'
  ```
- .local/r2/blog/ 配下の記事数（公開済み / 下書き）
- ブログ記事の未実行企画（`ls docs/22_YouTube企画/backlog/ docs/30_note記事企画/backlog/ 2>/dev/null | head -20` 件数）

出力形式: 「投稿可能なコンテンツ数」「記事パイプラインの状態」「ボトルネック」
```

#### Track C: アクセス・パフォーマンス

```
調査項目:
（完全DBレス。本番アプリは R2 snapshot / git TS のみ読む。旧 D1/miniflare は廃止）

- 公開記事数（R2 blog snapshot から。export-blog-snapshot は published のみ出力）
  ```bash
  curl -s "https://storage.stats47.jp/app/blog/all.json" | jq '.articles | length'
  ```

- SNS 投稿実績（投稿台帳 `.claude/state/sns/posts.json` から集計。旧 D1 sns_posts は廃止）
  ```bash
  node -e 'const s=require("./.claude/scripts/lib/sns-posts-store.cjs");const by={};for(const p of s.loadAll()){const k=(p.platform||"?")+"/"+(p.status||"?");by[k]=(by[k]||0)+1}console.log(JSON.stringify(by,null,2))'
  ```
  - **SNS 週次運用の入口は `/sns-weekly-plan`**（先週計測→題材→IG/X 生成予約→消化チェック）。正典 `.claude/rules/sns-content-standards.md`

- SNS パフォーマンス
  - **最新値**: 投稿台帳 posts.json の impressions/likes/replies キャッシュから集計（`/update-sns-metrics` 実行後に更新済み）
    ```bash
    node -e 'const s=require("./.claude/scripts/lib/sns-posts-store.cjs");const acc={};for(const p of s.query(x=>x.status==="posted")){const a=acc[p.platform]||={posted:0,impressions:0,likes:0,replies:0};a.posted++;a.impressions+=p.impressions||0;a.likes+=p.likes||0;a.replies+=p.replies||0}console.log(JSON.stringify(acc,null,2))'
    ```
  - **時系列履歴**: `.claude/skills/analytics/sns-metrics-improvement/snapshots/YYYY-MM-DD/metrics.csv`（`sns-metrics-store.cjs` の `readByRange` で集約）

- GA4/GSC メトリクス
  → KPI・WoW・フェーズゲートは`.claude/skills/management/nsm-experiment/reference/weekly-snapshots/YYYY-Www.json`の
    `finalized7d`と、その直前で重複しない`previous7d`を参照する
  → `.claude/skills/analytics/{ga4,gsc}-improvement/reference/snapshots/YYYY-Www/`の28日
    overview/pages/queries/devicesは機会発見にだけ使い、前回snapshotとの差をWoWと呼ばない
  → GA4 KPIはJapan-only clean slice。rawはpollution監視に限定する
  → snapshot が存在しない場合は「計測データなし」と報告

- NSM 実験進捗（`.claude/state/experiments.json` から active 実験を取得）
  ```bash
  node .claude/scripts/lib/experiments-state.mjs active
  node .claude/scripts/lib/experiments-state.mjs pending
  ```
  → running / measuring 中の実験と、pending_user_actions を把握
  → 次週の計画に「continue 実験」「measure 実行予定」を組み込む準備

- NSM 週次 snapshot JSON（`.claude/skills/management/nsm-experiment/reference/weekly-snapshots/YYYY-Www.json`）
  → weekly-review の Phase 0 で生成されたサマリ。engagedSessions / clicks / position 等の前週比

- SEO カバレッジ指標（完全DBレス。旧 D1 `seo_tracking` / `seo_actions` テーブルは廃止）
  → GSCカバレッジ推移: `.claude/state/gsc/LATEST.md`
  → `.claude/state/metrics/gsc/history.csv`はローリング28日系列（列名`*_rolling28d`・機会発見用）。
    週次ゲートは`history-finalized7d.csv`と`LATEST.md`上段の確定7日KPIを使う
    （`.claude/skills/analytics/search-growth/reference/weekly-cycle-contract.md`）
  → 未完了 SEO 施策: `.claude/todo/04_改善バックログ.md`（status != done の行）
  → トレンド（改善中 / 悪化中 / 横ばい）を判定し計画に反映

出力形式: 「直近のパフォーマンス概況」「成長/停滞の兆候」
注: API 呼び出しは行わない（`/weekly-review` が取得済みのデータを参照する）。
```

#### Track D: 計画・課題

```
調査項目:
- **今月の月次計画（重点テーマ）**: `.claude/todo/02_今月の重点.md` の frontmatter `focus_themes` と「構成タスク」を Read
  ```bash
  cat .claude/todo/02_今月の重点.md 2>/dev/null || echo "月次計画なし → /monthly-plan の実行を Should で提案"
  ```
  → 今週の Must は**今月の重点テーマの構成タスクから優先的に選ぶ**。重点外のタスクを Must に入れる場合は理由を明記。月次計画が無い場合は `/monthly-plan` 実行を提案。
- docs/02_実装計画/00_INDEX.md の現在地と、`.claude/todo/04`〜`06` の未完了タスク
- 未着手の Issue 一覧（`gh issue list --state open --label enhancement`、PR で close される機能改修）+ .claude/todo/05_機能バックログ.md の section ごとの `tier:` で優先度判定

- 改善バックログ pending 一覧（**真実源**: `.claude/todo/04_改善バックログ.md`）
  ```bash
  # Tier 1/2 の pending / in-progress を表示
  grep -E "^\| (AFF|INDEXING|SEO|BLOG|ADSENSE|GA4|PSI|CWV|P0|Q-|CTR|CONTENT|AICONTENT)" \
    .claude/todo/04_改善バックログ.md
  ```
  → Tier 1 は Must 優先、Tier 2 は Should 候補として計画に組み込む
  → due が今週以内のエントリを最優先

- 検索成長candidate（候補生成は決定的、採用は人間判断）
  ```bash
  npm run search-growth:status
  npm run search-growth:triage      # レビュー対象の最大3件 (technical/content/measurement 各1)
  # 人間承認済み (status=approved) の一覧 — weekly-plan が採用してよいのはここだけ
  jq '[.candidates[] | select(.status=="approved")]' .claude/state/search-growth/candidates.json
  ```
  → weekly-reviewで証拠確認・人間承認（`npm run search-growth:approve -- --candidate <ID>`で機械記録。
    週2件・全active WIP≤5をCLIが機械強制）された`status=approved`の候補だけを対象にする。
    未承認候補を`.claude/todo/04_改善バックログ.md`へ自動追加しない。
  → 採用は最大1〜2件（technical/blockerとacquisition/contentを原則各1件）。全active施策のWIPは5以下。
  → CTR候補はpage×query・現行title/content・past effectを確認し、一括title書換えを計画しない。
  → 効果判定日は`npm run search-growth:measure -- --candidate <ID>`（14/28/56日）。

- AdSense収益密度candidate（`.claude/state/metrics/adsense/candidates-latest.json`・運用正典 `/adsense-improvement`）
  → 週次レビューで審査した最大3件のうち、**人間承認済みを最大1件/週だけ**採用する。AdSense active WIP≤2。
  → 1実験1レバー（lazy-load・slot・Auto ads・formatを同時に変えない）。rollback・guardrail
    （収益/GA4 sessions/viewability/LCP/CLS）・14/28日判定日を計画に明記する。
  → 計測が不完全な間（measurement-gap候補が出ている間）は広告枠を増やさない。

- ブログ品質是正キュー（**既存記事を計画的に順次品質向上**・真実源: `.claude/state/blog/remediation-queue.json`）
  ```bash
  # 最新化 (audit fresh + GSC マージ、状態保持の upsert) → 次の 3 件を取り出す
  node .claude/scripts/blog/build-remediation-queue.mjs
  node .claude/scripts/blog/build-remediation-queue.mjs --next 3
  ```
  → pending 上位 3 件を「**ブログ品質是正 3 本**」として Phase 3 の **Must** に転載する (must-fix レーン優先)。
  → 実行は `/brushup-blog --target queue --next 3` (article-writer が archetype + 図あたり字数で是正 → blog-critic PASS → publish)。
  → これは毎週の**定常 Must**。少しずつ消化しキュー pending を減らす。仕組み: `.claude/rules/blog-remediation-loop.md`。

- ブログ新規記事キュー（**新規記事を継続拡充**・真実源: `.claude/state/blog/topic-queue.json`）
  ```bash
  # 週次 cron (fetch-metrics-weekly.yml) で再生成済だが、当日最新化して次の 4-5 件を取り出す
  node .claude/scripts/blog/build-topic-queue.mjs
  node .claude/scripts/blog/build-topic-queue.mjs --next 5
  ```
  → must-write レーン上位を「**新規記事 N 本**」として Phase 3 の **Must** に転載する（型ミックスを整える:
    月次目標 B5/D2 4/A3-4/F3/G1-2、`.claude/agents/blog-seo-strategist.md` §戦略コンテキスト）。
  → 実行は `/draft-from-trend --from queue`（1 本ずつ）→ generate-article-charts → **blog-critic PASS** → publish。
  → A/D2型は実query需要があるdirect-intentを優先する。元ranking URLのimpressionsを新記事需要へ流用しない。
  → ⚠️ **B 型は決定的フィルタ（`lib/topic-queue-spurious-core.mjs`: 自己/派生・同義・規模ペア・
    同一 category・年度乖離・欠測）で疑似相関を除外済**だが、機序の書けないペアは残りうる。
    相関テーマ自体のpage×query需要と「見かけの相関 vs 真因」を説明できる機序があるか人手で吟味してから採用する
    （キューは候補生成であり最終決定ではない）。
  → これも毎週の**定常 Must**。是正キュー（既存改善）と新規キュー（新規拡充）の両輪で回す。
    仕組み: `.claude/skills/blog/plan-article-queue/SKILL.md`。

- レビュー由来の未完了策
  `.claude/todo/{04_改善バックログ,05_機能バックログ}.md` のIDを確認し、同じ原因の重複タスクを統合

- 前週のレビュー + 現在計画の残タスク自動抽出
  cat .claude/todo/03_今週の計画.md 2>/dev/null
  ls -t .claude/skills/management/weekly-review/reference/reviews/*.md 2>/dev/null | head -1
  → 上書き前の current-week と前週レビューを取得
  → 計画 vs 実績の差分と「来週への申し送り」を抽出
  → **前週計画の `- [ ] xxx` (未チェック) を抽出** し、Phase 3 の「前週からの持ち越し」セクションに自動転載:
    ```bash
    grep -E "^- \[ \]" .claude/todo/03_今週の計画.md 2>/dev/null || true
    ```
  → 持ち越しが 3 件以上なら Phase 4 で「工数見積もりが楽観的すぎないか」を厳しく検証

出力形式: 「ロードマップ上の現在地」「未解決の課題」「前週の振り返り」「繰り返しパターン」「改善ログ pending 一覧」「前週からの持ち越し」
```

#### Track E: トレンド・検索需要

軽量なトレンドチェックを行い、今週のコンテンツ優先度に影響するシグナルを収集する。

```
調査項目:
- はてなブックマーク Hot Entry（RSS: https://b.hatena.ne.jp/hotentry/social.rss）
  → タイトルに「都道府県」「ランキング」「統計」「地域」等が含まれるエントリを抽出
- Google News RSS（https://news.google.com/rss/search?q=都道府県+統計&hl=ja&gl=JP&ceid=JP:ja）
  → 直近のニュースで stats47 のデータと関連しそうなテーマを抽出
- Yahoo!ニュース トピックス RSS（https://news.yahoo.co.jp/rss/topics/domestic.xml）
  → 地方・地域・ランキング関連のニュースを抽出

各ソースから最大5件ずつ、合計最大15件を取得する。
取得したトレンドについて、stats47 の DB（ranking_items, ranking_tags）とマッチングし、
既存データで記事化・SNS投稿できるものを「トレンド機会」として報告する。

出力形式:
- 「今週のトレンド機会」（stats47 データとマッチするもの）
- 「要調査」（マッチ不明だが需要がありそうなもの → `/discover-trends --source all` の実行を提案）
- 「関連なし」はスキップ

注: フルスキャン（6ソース統合）が必要な場合は、
計画タスクとして「/discover-trends --source all 実行」を Should/Could に提案する。
```

### Phase 2: 戦略分析

5エージェントの結果を統合し、以下を分析する:

1. **KPI との距離**: ロードマップの目標（PV、記事数、収益）に対する現在地
2. **ギャップ**: 計画と実行の乖離。特に繰り返し未達のタスク
3. **機会**: Track E のトレンド機会を評価。stats47 データとマッチするトレンドがあれば記事化・SNS投稿の優先度を上げる
4. **リスク**: 放置すると悪化すること（技術的負債、トークン失効、コンテンツ枯渇）
5. **タイミング**: 今週でなければ意味がないこと（季節性、ニュース連動）

### Phase 2.5: NSM 実験候補の提案

`/nsm-experiment propose` を呼んで、現状メトリクスから新規実験候補 3-5 件を rubric 付きで取得する。

- 入力: `.claude/skills/management/nsm-experiment/reference/weekly-snapshots/YYYY-Www.json` + `.claude/skills/management/nsm-experiment/references/playbook.md`
- 出力: 候補リスト（impact / effort / learning / certainty の加重合計順）
- 候補は Phase 3 の Must / Should の選択肢として検討する

active な実験が既に 2 件以上あれば、新規候補の採用は抑制する（rubric 原則）。
continue 中の実験の measure 実行予定は Must 候補に加える。

### Phase 3: 優先度提案

以下の分類でタスクを提案する:

#### Must（必ずやる: 2-3件）
- 未達の繰り返しタスク or 収益直結 or 期限付き
- 各タスクに: 理由, 成功基準, 推定工数(S/M/L), 該当スキル

#### Should（できればやる: 2-3件）
- 中期的に重要 or コンテンツ蓄積
- 各タスクに同上

#### Could（余力があれば: 1-2件）
- 改善・実験・新規探索
- 各タスクに同上

### Phase 4: 批判的レビュー（セルフレビュー）

Phase 3 の提案を以下の3つの視点で攻撃する:

1. **「技術的に楽しいだけでは？」**
   - `/critical-review` の精神を継承
   - 収益・PV に直結しないタスクが Must に入っていないか
   - 「自動化」「リファクタ」が手段の目的化になっていないか

2. **「先週と同じ失敗を繰り返してないか？」**
   - 上書き前の `.claude/todo/03_今週の計画.md` と前週レビューを照合
   - 毎週 Must に入りながら未達のタスクは、分割するか優先度を上げる
   - 工数見積もりが楽観的でないか

3. **「今週やらないと機会損失になるものは？」**
   - タイミング依存のタスクが Could に埋もれていないか
   - 「いつでもやれる」タスクが Must を圧迫していないか

レビュー結果に基づいて Phase 3 の分類を調整する。

### Phase 5: 出力

Write tool で `.claude/todo/03_今週の計画.md` を上書きする。frontmatter を必ず含めること。

```yaml
---
type: weekly-plan
week: 2026-Www
date: 2026-MM-DD
status: active
tags: []
---
```

作成後、ファイルパスを報告する。前週のskill referenceレビューから引用した場合は、本文に対象週を明記する。

## 出力フォーマット（ファイル本文）

```markdown
---
type: weekly-plan
week: YYYY-Www
date: YYYY-MM-DD
status: active
tags: []
---

# Weekly Plan YYYY-Www

## 週
- **ISO Week**: YYYY-Www
- **期間**: YYYY-MM-DD 〜 YYYY-MM-DD
- **Sprint**: Sprint N (Week X/Y)

## 前週の申し送り
<!-- skill referenceの前週レビュー「来週への申し送り」から引用 -->

## 今月の重点（月次計画より）
<!-- `02_今月の重点.md` の focus_themes を参照。今週の Must はこの重点から優先選択する。 -->
- **重点テーマ**: <テーマ1> / <テーマ2>（→ `02_今月の重点.md`）
- **今週この重点で進めること**: <構成タスクのうち今週分>

## 前週の振り返り (W-1)

| タスク | 分類 | 状態 | メモ |
|---|---|---|---|
| ... | Must | 完了/未達/一部 | ... |

**パターン分析**: （繰り返し未達のパターンがあれば指摘）

## 現状サマリー

| 指標 | 現在値 | 目標 |
|---|---|---|
| 公開記事数 | N | Sprint目標 |
| SNS 投稿済み | N 件 | — |
| 直近14日 imp (X) | N | — |

## トレンド機会

| トレンド | ソース | stats47 データ | アクション |
|---|---|---|---|
| ... | はてな/News/Yahoo | マッチする ranking_key or なし | 記事化 / SNS 投稿 / 要調査 |

## 前週からの持ち越し

<!-- Track D が抽出した前週計画の未チェック `- [ ]` を転載。元 task の優先度に応じて
     今週 Must/Should/Could に再分類する場合は、ここに残しつつ下記タスク欄にも追加して二重リンク。 -->
- [ ] **持ち越しタスク名** — 元: 前週レビュー [元 Must/Should/Could]

## 改善ログ pending (今週着手対象)

<!-- .claude/todo/04_改善バックログ.md から今週着手する Tier 1/2 エントリを転載。
     真実源は 04_改善バックログ.md、当週ビューは週次計画。 -->
| Tier | Metric | ID | Status | Due | Owner |
|---|---|---|---|---|---|
| 1 | gsc | T0-DECAY-01 | in-progress | 2026-06-14 | claude |

## 今週のタスク

### Must（絶対達成、2-3 件）
- [ ] **タスク名** [S/M/L] — 理由 / 成功基準 / 使用スキル `/skill-name`

### Should（できればやる、2-4 件）
- [ ] **タスク名** [S/M/L] — 理由 / 成功基準 / 使用スキル

### Could（余力あれば、1-3 件）
- [ ] **タスク名** [S/M/L] — 理由 / 成功基準 / 使用スキル

## 批判的レビュー

<!-- Phase 4 の結果を引用形式で記載 -->
<!-- 関連するレビュー由来TODOがあればIDで参照 -->

## 関連ドキュメント・施策

<!-- 改善/機能backlog ID、Pre-Mortem、NSM実験、snapshot期間を列挙 -->
- 前週レビュー: `.claude/skills/management/weekly-review/reference/reviews/YYYY-W(n-1).md`
- 前月Pre-Mortem由来のTODO ID（該当時）
- 関連改善施策: `SEARCH-GROWTH-CYCLE-01`（該当ID）

## 次週への申し送り候補

<!-- この週の review ドキュメントで追記される -->
```

## 運用ルール

- **毎週月曜に実行**する想定。ユーザーが `/weekly-plan` を実行するだけで完結
- 前週レビューが存在する場合、その申し送りを現在計画と照合する
- 前週の計画で未達のタスクは、自動的に今週の Must 候補に昇格させて検討する
- 計画ドキュメントのタスク状態（完了/未達）は、**週中にユーザーが checkbox を docs ファイルで編集**して更新する（Edit tool or エディタ）
- 計画ドキュメントは蓄積せず毎週上書きする。過去の結果は週次レビューと git 履歴に残す

## 保存先

- 本スキル出力: `.claude/todo/03_今週の計画.md`
- ペアの週次レビュー: `.claude/skills/management/weekly-review/reference/reviews/YYYY-Www.md`
- Phase 4 では `.claude/todo/` のレビュー由来項目と対象SSOTのGit履歴を参照する

## 参照

- `docs/02_実装計画/00_INDEX.md` — 実装計画の現在地
- `docs/00_プロジェクト管理/02_収益化戦略.md` — NSM・収益レーン・意思決定ゲート
- `gh issue list --state open --label enhancement` — 未解決の機能改善 Issue（残存ラベル）
- `.claude/todo/03_今週の計画.md` / `.claude/skills/management/weekly-review/reference/reviews/` — 現在計画と過去レビュー
- 投稿台帳 `.claude/state/sns/posts.json`（`sns-posts-store.cjs` 経由）+ `.claude/skills/analytics/sns-metrics-improvement/snapshots/` — SNS コンテンツ状況・メトリクス
- `.claude/skills/management/critical-review/SKILL.md` — 批判的レビューの精神
- `.claude/skills/blog/discover-trends/SKILL.md` — フルトレンドスキャン（Track E で不足時に提案、`--source all` で全 6 ソース統合）
