---
name: ga4-improvement
description: Google Analytics 4 のアクセス指標（Users / Sessions / Engagement / Bounce / Key Events）を .claude/todo/improvements.md で追跡し、週次 snapshot と施策の効果判定を記録する。Use when user says "GA4改善", "PV改善", "流入改善", "GA4記録".
primary_agent: ga4-analyst
---

GA4 の週次メトリクス（Active Users / Sessions / Engagement / Bounce Rate / Key Events）を snapshot と詳細ログで時系列追跡し、active 施策だけを `.claude/todo/improvements.md` で管理するスキル。

コンテンツ追加・UI 改善・流入施策・サイト構造変更の効果は 1〜4 週間遅延する。履歴と根拠は append-only の詳細ログ、次に行うことは active-only のTODOへ分離する。

## データの保管場所

| データ | 保管先 | 理由 |
|---|---|---|
| 生メトリクス CSV | git: `reference/snapshots/YYYY-Www/` | immutable、diff 比較、オフライン可 |
| 目標しきい値設定 | git: `reference/budgets.json` | プロジェクト設定 |
| 施策（1施策1行、人間向け要約） | `.claude/todo/improvements.md` | active 施策を優先度・期日で絞り込み可能 |
| 詳細ログ（agent 用、検証コマンド・仮説） | `reference/improvement-log.md` | append-only、agent が深掘り参照 |
| 週次推移サマリ | `.claude/state/metrics/ga4/LATEST.md` / `history.csv` | GitHub Actions が自動更新 |

→ **責務分離**: `.claude/todo/improvements.md` はactive一覧、agent 用詳細は `.claude/skills/analytics/ga4-improvement/reference/improvement-log.md`。

## TODO行の契約

`.claude/todo/improvements.md` の6列
`ID | タイトル | Status | Due | Owner | Metric` を使う。baseline、deployed_at、
検証コマンド、判定根拠は `reference/improvement-log.md` に置き、TODOへ複製しない。

## 引数

```
$ARGUMENTS — [mode]
             mode:
               - status  (デフォルト) : 直近スナップショット + 進行中施策を要約
               - observe : 新 snapshot + 目標判定 + 施策効果追記
               - action  : 新しい施策行を追加
               - next    : 次に着手すべき改善候補を提示
```

## 手順

### Step 1: データソースの特定

GA4 メトリクス取得の優先順:

1. **`/fetch-ga4-data` スキル** — Data API 経由で `reference/snapshots/YYYY-Www/` に CSV を保存
2. **`reference/snapshots/` 配下の既存 CSV** — 既に取得済みの週次データ

### Step 2: mode 別の処理

#### mode = status（デフォルト）

```
以下を並列に実行して要約:
1. reference/snapshots/ 配下の最新 YYYY-Www ディレクトリの CSV を Read
2. .claude/todo/improvements.md の6列表から active 行を抽出
3. reference/improvement-log.md を Read し未判定の検証コマンド一覧を抽出
4. .claude/state/metrics/ga4/LATEST.md を Read し週次推移を取得

出力:
- 最新 snapshot の主要指標 + 目標超過メトリクス
- 進行中施策を「デプロイ日 - 経過日数 - ターゲット - status」形式で列挙
- 次観測予定日（最も近いもの）
```

#### mode = observe

```
1. データ取得:
   a. /fetch-ga4-data snapshot <YYYY-Www> を呼び reference/snapshots/YYYY-Www/ に CSV 保存
   b. 既に存在するなら既存 CSV を読む

2. 主要指標を抽出 (**raw / clean / pollution の 3 系統を併記**):
   - **raw 値** (bot 込み):
     - overview.csv: activeUsers / sessions / screenPageViews / engagementRate / averageSessionDuration / bounceRate / newUsers
     - channels.csv: Organic Search / Direct / Social / Referral 別のセッション・ユーザー
   - **clean 値** (country=Japan only, 推奨判定値):
     - overview-clean.csv: activeUsers / sessions / engagedSessions / screenPageViews / engagementRate / averageSessionDuration / bounceRate
     - channels-clean.csv: 流入経路別の Japan only セッション・engagedSessions
   - **pollution 値** (bot 推定):
     - pollution-summary.csv: overseas_sessions / overseas_engagedSessions / notSet_sessions
     - 計算: `inflation% = (raw - clean) / raw × 100`
     - **inflation > 25% なら raw 値での判定は不可** → clean 値で施策効果を判定する
   - devices.csv: mobile / desktop / tablet
   - pages.csv: 上位 10 件のパス + Users + Engagement
   - daily.csv: 日次推移

   **Issue コメント・週次レビュー本文には raw と clean を表形式で併記する**:

   | 指標 | raw (bot 込) | clean (Japan only) | inflation% |
   |---|---|---|---|
   | Sessions | 1,119 | 821 | 26.6% |
   | engagedSessions | 538 | 513 | 4.6% |
   | Bounce Rate | 46.18% | 37.5% | -18.8% |

   注: inflation が engagedSessions で軽微 (< 10%) ・Sessions で大きい場合は「bot は来訪するが engagement しない」典型パターン。判定は engagedSessions ベースで行う。

3. budgets.json 判定:
   - warning_threshold <= 値 < error_threshold → WARNING
   - 値 >= error_threshold → ERROR
   - alerts 配列に記録

4. 前週 snapshot との前週比を計算:
   - reference/snapshots/ の直近 2 週分を比較
   - .claude/state/metrics/ga4/history.csv から取得しても可

5. 進行中施策の効果判定（最重要）:
   .claude/todo/improvements.md のGA4対象行を抽出。
   各施策に対して:
   - 経過日数 = observe 実行日 - deployed_at
   - 実測 delta = 最新値 - デプロイ時点の値（前週 snapshot から読む）
   - 期日前または証拠不足なら active 行を維持し、必要なら Due と次アクションを更新する。
   - 判定可能なら full / partial / none / adverse を実測値・snapshot・判定日とともに
     reference/improvement-log.md へ追記し、TODOから該当行を削除する。
   - adverse の是正は別IDで追加し、確定済み行を履歴として残さない。

6. 出力:
   - 目標超過アラートを先頭で強調
   - 効果判定を確定してTODOから削除した施策をハイライト
   - adverse があれば注意喚起
```

#### mode = action

```
1. 必須フィールド確認（欠落時は追加質問）:
   - 施策タイトル
   - tier: 1 (即効) / 2 (戦略) / 3 (要調査)
   - target_metric: ga4-users / ga4-sessions / ga4-engagement / ga4-bounce / ga4-conversion / ga4-pageviews
   - 対象ページ / セグメント
   - 想定効果値（デプロイ前に明文化、後付けバイアス防止）
   - deployed_at / PR 番号 / コミット hash
   - 変更内容サマリ / 変更ファイル
   - verification_command（copy-pasteable な fetch-ga4-data / API 呼び出し）

2. .claude/todo/improvements.md の該当Tierの表に1行だけ追加:

   ```markdown
   | GA4-NN | <次アクションを含む短い要約> | pending | YYYY-MM-DD | <owner> | ga4 |
   ```

3. front-matter の `updated:` を本日日付に更新。
4. target metric、対象、baseline、想定効果、deployed_at、PR、検証コマンドは
   reference/improvement-log.md に appendする。
5. 次の観測日（デプロイ + 14 / 28 日）を計算して提示。
```

#### mode = next

```
1. .claude/todo/improvements.md のactive行と、reference/improvement-log.md の過去判定から派生候補を抽出
2. reference/improvement-log.md の「次の候補」「仮説」セクションから未着手を拾う
3. 最新 snapshot の「次のアクション」候補も合わせる

優先度: tier-1 > tier-2 > tier-3
同 tier 内は想定効果の大きい順。
```

### Step 3: 共通ルール

- **.claude/todo/improvements.md は active-only** — 未完了施策の追加・status 更新に限定する。effect 確定後は詳細を improvement-log に残し、行を削除する
- **snapshots/YYYY-Www/ も append-only** — 過去の CSV は改変しない
- **日付は絶対日付** — 「今週」「先週」は使わない
- **数値はソース明示** — "snapshots/2026-W17/overview.csv" のような相対パス
- **施策は 1 PR 1 ID** — 複数目的の PR は分割
- **想定効果値はデプロイ前に書く** — 後付けバイアス防止
- **週次 /weekly-review から observe モードが自動呼び出し** される想定
- **責務を分離する** — `.claude/todo/improvements.md` はactive一覧、reference/improvement-log.md は判定履歴

## 参照パターン

```bash
# 直近スナップショット
ls -t .claude/skills/analytics/ga4-improvement/reference/snapshots/ | head -3
cat .claude/state/metrics/ga4/LATEST.md

# 進行中施策
node .claude/scripts/lib/scan-pending-improvements.mjs --format markdown

# 効果測定済み施策・詳細ログ
cat .claude/skills/analytics/ga4-improvement/reference/improvement-log.md
```

## 実証チェックリスト（効果判定を確定してTODO行を削除する前に必須）

参照: `.claude/rules/evidence-based-judgment.md`

- [ ] 検証コマンドを実行したか:
  - GA4 任意 dimension の実測: `/fetch-ga4-data last28d eventName,pagePath`（または該当する dimension）
  - 比較期間取得: 同じコマンドで `last7d / last28d / last3m` を取って前期間との差分を確認
- [ ] GA4 仕様（consent mode / event 定義）を主張するなら公式ドキュメント URL を引用したか（`developers.google.com/analytics/...`）
- [ ] 比較対象（before / after / baseline）が明確か
- [ ] NG ワード（「のはず」「と思われる」「兆候」「浸透待ち」）を使っていないか
- [ ] 効果が想定の 80% 未満なら、`[仮説] 〜 / 検証コマンド: 〜 / 検証期日: YYYY-MM-DD / 期日後の判定: 〜` の 4 点セットを書いたか
- [ ] **対象指標が「event 定義変更による表面的な数値変動」ではないか**（consent mode・GTM 設定変更時は計測断絶を疑う）

このチェック未満なら効果を確定せず、active 行を維持すること。

## 関連スキル

- `/fetch-ga4-data` — GA4 Data API から生データを取得（本 skill の入力ソース）
- `/gsc-improvement` — GSC（検索）
- `/adsense-improvement` — AdSense（収益）
- `/cloudflare-cost-improvement` — Cloudflare コスト
- `/knowledge` — 恒久的な教訓を記録

## 前提

- `.claude/todo/improvements.md` が存在すること（施策 ID は `GA4-*`）
- `reference/budgets.json` / `reference/snapshots/` / `reference/improvement-log.md` 初期化済
- GA4 プロパティ ID: `463218070`
- 本番 URL: `https://stats47.jp`
