---
name: gsc-improvement
description: Google Search Console のインデックス問題（404/ソフト404/5xx/クロール予算）を継続的に追跡・改善する。Use when user says "GSC改善", "GSC記録", "インデックス改善", "SEO課題記録", or when analyzing gcsエラー/ CSV files. 各カテゴリのベースライン→対応履歴→観測ログ→次アクションを reference/improvement-log.md で管理.
---

Google Search Console（GSC）のインデックス系問題を**時系列で追跡**し、打った施策と効果を記録するスキル。

施策の効果は 2〜4 週間遅延するため、「何をいつしたか」「数値がどう動いたか」「次の候補は何か」を忘れないように improvement-log.md で管理する。

## 用途

- GSC から最新の「ページインデックス登録」レポートを取得して件数を記録したい
- Phase ごとに打った対応（middleware 修正、noindex 追加、sitemap 削減 等）を履歴として残したい
- 2〜4 週間後の効果測定で「どの施策が効いたか」を判断したい
- 次に着手すべき Tier を参照したい
- 新しい Claude Code セッションで過去の経緯を即座に把握したい

## 管理ファイル

**`reference/improvement-log.md`** — この skill のメイン成果物。以下の 4 セクションで構成される:

1. **Baseline** — 最初に記録した GSC の状態（全カテゴリの件数スナップショット）
2. **Action Log** — Phase ごとに実施した対応の一覧（変更ファイル / コミット / デプロイ日）
3. **Observation Log** — 日付付きの観測スナップショット + 気づき（1 行でも OK）
4. **Next Actions** — 未着手の Tier / 判断待ち項目

## 引数

```
$ARGUMENTS — [mode]
             mode:
               - status  (デフォルト) : improvement-log.md を読んで現状を要約する
               - observe : 最新の gcsエラー/ CSV または GSC の数値を Observation Log に追記する
               - action  : 新しい対応を実施したので Action Log にエントリ追加する
               - next    : Next Actions セクションから次に着手すべき候補を提示する
```

## 手順

### Step 1: データソースの特定

ユーザーから最新 GSC データが共有される形は複数ある:

1. **`reference/snapshots/<YYYY-Www>/` ディレクトリ** — `/fetch-gsc-data snapshot <YYYY-Www>` が保存した週次 CSV
   - `queries.csv` / `pages.csv` / `devices.csv` / `countries.csv` / `daily.csv` — API 経由の全件データ
   - `index-coverage.csv` — 手動エクスポート（`gcsエラー/重大な問題.csv` のコピー）
   - `index-trend.csv` — 手動エクスポート（`gcsエラー/平均読み込み時間のチャート.csv` のコピー）
2. **`gcsエラー/` ディレクトリ** (プロジェクトルート) — GSC 画面から手動エクスポートした CSV の置き場（snapshot モード実行時に上記 snapshots 配下へコピーされる）
   - `重大な問題.csv` — 各カテゴリの件数（集計）
   - `重大ではない問題.csv` — 補助カテゴリ
   - `平均読み込み時間のチャート.csv` — 登録済み vs 未登録の日次トレンド
   - `表.csv` — URL 単位のサンプル（GSC レポート画面右上「エクスポート」から取得）
3. **`/fetch-gsc-data` ad hoc モード** — 一時的な深掘り分析用
4. **Cloudflare Workers Logs** — 5xx 発生の URL pattern 特定用

### Step 2: mode 別の処理

#### mode = status（デフォルト）

```
reference/improvement-log.md を Read し、以下を要約して返す:
- 最新 Observation 日付と数値
- Phase 1/2/... の完了状況
- 次に提示すべき Next Action 候補（最大 3 件）
- reference/snapshots/ 配下の最新 YYYY-Www ディレクトリから queries.csv 上位 5 件と index-coverage.csv サマリーを添える（存在すれば）
```

#### mode = observe

```
1. データソースを以下の優先順で探索:
   a. reference/snapshots/ 配下で最も新しい YYYY-Www ディレクトリ → index-coverage.csv を Read
   b. a. が無ければ gcsエラー/ 配下の手動エクスポート CSV を Read
   c. どちらも無ければユーザーに「最新の数値を提供してください」と促す
2. 件数を抽出（必須カラム、欠損時は (未取得) と明記）:
   404 / 5xx / ソフト 404 / クロール済み未登録 / 検出未登録 / リダイレクト / 登録済み / 未登録
3. 同じディレクトリの queries.csv / pages.csv からも主要指標（合計クリック、合計表示、平均順位）を抽出
4. Observation Log テーブルに 1 行追記。備考欄には以下のラベルを付与:
   - **MID**: 直近の Action Log エントリから 14 日未満（SEO 効果未到達期間）→ 小幅悪化も異常扱いしない
   - **FINAL**: 14 日以上経過し効果が測定可能 → 施策の成否判定に使える
5. アラート閾値を前週 Observation と比較して判定（超過時は備考に ⚠️ ALERT 付与）:
   - 登録済みページ ≤ -10% → 緊急（Cloudflare / sitemap / noindex 確認）
   - 404 ≥ +5% → Tier 1 施策検討（middleware 410 追加等）
   - 5xx ≥ +20% → Workers Logs で pattern 特定
6. Baseline または直前の Observation との差分を要約して返す
   例: 404 が 5,661 → 5,120 で -541 改善、Organic クリック +300
```

#### mode = action

```
1. ユーザーから「どの Phase / Tier / 変更内容 / コミット hash」を確認
2. improvement-log.md の Action Log にエントリ追加:
   - 日付（デプロイ日）
   - Phase ラベル
   - 対応内容サマリ
   - 変更ファイルリスト
   - コミット hash
   - 想定効果（どの GSC カテゴリに効くか）
   - **想定観測日**: デプロイ日 + 14 日（SEO 効果の測定可能日）
3. 以後、同日以降の Observation Log エントリは MID（14 日未満）/ FINAL（14 日以上）ラベルを付与する基準として参照される
```

#### mode = next

```
improvement-log.md の Next Actions セクションを Read し、優先度上位 3 件を提示。
Tier 区分（Tier 1=即効、Tier 2=戦略、Tier 3=要調査）に従う。
```

### Step 3: 共通ルール

- **ログは append-only** — 過去のエントリは改変しない（履歴性を保つ）
- **日付は必ず絶対日付** (`2026-04-14` 形式)。相対日付（「先週」「昨日」）は使わない
- **数値は必ずソース明示** — 「GSC 2026-04-15 取得 / `reference/snapshots/2026-W16/index-coverage.csv`」等
- **施策とコミット hash をペアで残す** — 後から原因特定できるように
- **長文レビューは月 1 回まで** — 週次は 1 行追記のみで十分。更新コストを抑える
- **snapshot ディレクトリは improvement-log.md と一緒にコミット**する — PR レビューで施策 → 数値変化が一目で追えるように

## 関連スキル

- `/fetch-gsc-data` — GSC API から生データを取得（本 skill の入力ソース）
- `/seo-audit` — サイト全体の SEO 監査（本 skill と連動して原因分析）
- `/performance-report` — Lighthouse + Core Web Vitals 監査
- `/knowledge` — 恒久的な教訓を記録（本 skill は「進行中」、knowledge は「確定した学び」）

## 前提

- `.claude/skills/analytics/gsc-improvement/reference/improvement-log.md` が存在する（初回起動時に作成済み）
- GSC のプロパティ: `sc-domain:stats47.jp`
- 本番 URL: `https://stats47.jp`
