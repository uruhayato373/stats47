---
name: ga4-improvement
description: Google Analytics 4 のアクセス指標（PV/ユーザー/流入経路/直帰率）を継続的に追跡・改善する。Use when user says "GA4改善", "PV改善", "流入改善", "GA4記録". ベースライン→対応履歴→観測ログ→次アクションを reference/improvement-log.md で管理.
---

Google Analytics 4 (GA4) のアクセス指標を**時系列で追跡**し、打った施策と効果を記録するスキル。

コンテンツ追加・UI 改善・SEO 施策・流入経路最適化の効果は 1〜4 週間遅延するため、「何をいつしたか」「数値がどう動いたか」「次の候補は何か」を忘れないように improvement-log.md で管理する。

## 用途

- `/fetch-ga4-data snapshot` が保存した週次 CSV から主要指標を読み込んで件数を記録したい
- Phase ごとに打った対応（新記事公開、CTA 改善、流入施策、サイト構造変更 等）を履歴として残したい
- 翌週以降の効果測定で「どの施策が効いたか」を判断したい
- 次に着手すべき改善候補を参照したい
- 新しい Claude Code セッションで過去の経緯を即座に把握したい

## 管理ファイル

**`reference/improvement-log.md`** — この skill のメイン成果物。以下の 4 セクションで構成される:

1. **Baseline** — 最初に記録した GA4 の状態（overview / channels の初期スナップショット）
2. **Action Log** — Phase ごとに実施した対応の一覧（変更ファイル / コミット / デプロイ日）
3. **Observation Log** — 日付付きの観測スナップショット + 気づき（1 行でも OK）
4. **Next Actions** — 未着手の改善候補

## 引数

```
$ARGUMENTS — [mode]
             mode:
               - status  (デフォルト) : improvement-log.md を読んで現状を要約する
               - observe : 最新の snapshots/<YYYY-Www>/ の CSV から Observation Log に追記する
               - action  : 新しい対応を実施したので Action Log にエントリ追加する
               - next    : Next Actions から次に着手すべき候補を提示する
```

## 手順

### Step 1: データソースの特定

ユーザーから最新 GA4 データが得られる形は以下:

1. **`reference/snapshots/<YYYY-Www>/` ディレクトリ** — `/fetch-ga4-data snapshot <YYYY-Www>` が保存した週次 CSV
   - `overview.csv` — PV / ユーザー / セッション / 直帰率 / 新規ユーザー / 平均セッション時間
   - `pages.csv` — ページ別（全件）
   - `channels.csv` — 流入経路（Organic / Direct / Social / Referral 等）
   - `devices.csv` — デバイス別
   - `daily.csv` — 日次推移
2. **`/fetch-ga4-data` ad hoc モード** — 一時的な深掘り分析用（本 skill では使用しない、/weekly-review が snapshot モードを呼ぶ）

### Step 2: mode 別の処理

#### mode = status（デフォルト）

```
reference/improvement-log.md を Read し、以下を要約して返す:
- 最新 Observation 日付と数値
- Phase 1/2/... の完了状況
- 次に提示すべき Next Action 候補（最大 3 件）
- snapshots/ 配下の最新 YYYY-Www ディレクトリから overview.csv の主要指標を添える
```

#### mode = observe

```
1. reference/snapshots/ 配下で ISO 週番号が最も大きいディレクトリを特定
2. overview.csv / channels.csv / pages.csv を Read して主要指標を抽出:
   - overview: PV, activeUsers, sessions, bounceRate, newUsers, averageSessionDuration
   - channels: Organic Search / Direct / Social / Referral のセッション数
   - pages: 上位 10 件のパス + PV
3. improvement-log.md の Observation Log セクションに「日付 + 件数テーブル + 気づき」を追記
4. Baseline または直前の Observation との差分を計算して要約を返す
   （例: PV が 3,200 → 3,980 で +24% 改善、Organic +300 sessions）
```

#### mode = action

```
1. ユーザーから「どの Phase / 変更内容 / コミット hash / 想定効果」を確認
2. improvement-log.md の Action Log にエントリ追加:
   - 日付
   - Phase ラベル
   - 対応内容サマリ
   - 変更ファイルリスト
   - コミット hash
   - 想定効果（どの GA4 指標に効くか）
```

#### mode = next

```
improvement-log.md の Next Actions セクションを Read し、優先度上位 3 件を提示。
```

### Step 3: 共通ルール

- **ログは append-only** — 過去のエントリは改変しない（履歴性を保つ）
- **日付は必ず絶対日付** (`2026-04-14` 形式)
- **数値は必ずソース明示** — 「GA4 2026-04-15 取得 / snapshots/2026-W16/overview.csv」等
- **施策とコミット hash をペアで残す**
- **snapshot ディレクトリは improvement-log.md と一緒にコミット**する（PR レビューで施策 → 数値変化が一目で追える）

## 関連スキル

- `/fetch-ga4-data snapshot <YYYY-Www>` — GA4 API から全件 CSV を取得（本 skill の入力ソース）
- `/gsc-improvement` — SEO（検索）側の改善記録
- `/weekly-review` — 週次レビュー時に本 skill の observe モードを呼ぶ
- `/knowledge` — 恒久的な教訓を記録（本 skill は「進行中」、knowledge は「確定した学び」）

## 前提

- `.claude/skills/analytics/ga4-improvement/reference/improvement-log.md` が存在する
- GA4 プロパティ ID: `463218070`
- 本番 URL: `https://stats47.jp`
