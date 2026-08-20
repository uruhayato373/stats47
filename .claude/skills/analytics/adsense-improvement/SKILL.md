---
name: adsense-improvement
description: Google AdSense の広告収益・RPM・CTR・ビューアビリティを .claude/todo/improvements.md で追跡し、週次 snapshot と施策の効果判定を記録する。Use when user says "AdSense改善", "広告収益改善", "RPM改善", "AdSense記録".
primary_agent: adsense-analyst
---

AdSense の週次メトリクス（Earnings / Page RPM / CTR / Impressions / Active View）を snapshot と詳細ログで時系列追跡し、active 施策だけを `.claude/todo/improvements.md` で管理するスキル。

広告配置・フォーマット変更・コンテンツ追加の効果は 1〜4 週間で現れる。履歴と根拠は append-only の詳細ログ、次に行うことは active-only のTODOへ分離する。

## データの保管場所

| データ | 保管先 | 理由 |
|---|---|---|
| 生メトリクス CSV | git: `reference/snapshots/YYYY-Www/` | immutable、diff 比較、オフライン可 |
| 目標しきい値設定 | git: `reference/budgets.json` | プロジェクト設定 |
| 施策（1施策1行、人間向け要約） | `.claude/todo/improvements.md` | active 施策を優先度・期日で絞り込み可能 |
| 詳細ログ（agent 用、検証コマンド・仮説） | `reference/improvement-log.md` | append-only、agent が深掘り参照 |
| 週次推移サマリ | `.claude/state/metrics/adsense/LATEST.md` / `history.csv` | GitHub Actions が自動更新 |
| **広告ユニット別推移** | `.claude/state/metrics/adsense/history-units.csv` | ユニット単位の最適化を効果測定するための時系列。`match_status` (matched / legacy-name-matched / unmanaged / orphan) で突き合わせ可否を明示する。legacy-name-matched は後方互換で、削除条件は `adsense-report-contract.mjs` の match_status 定義を参照 |
| **AdSense ユニット inventory** | `reference/snapshots/YYYY-Www/ad-units.csv` | `unit_id` (= レポートの `AD_UNIT_ID`) と `slot_id` (adCode の `data-ad-slot`) の対応。コード側 `constants.ts` との突き合わせキー |

→ **責務分離**: `.claude/todo/improvements.md` はactive一覧、agent 用詳細は `.claude/skills/analytics/adsense-improvement/reference/improvement-log.md`。

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

AdSense メトリクス取得の優先順:

1. **`/fetch-adsense-data` スキル** — AdSense Management API 経由で `reference/snapshots/YYYY-Www/` に CSV を保存
2. **`reference/snapshots/` 配下の既存 CSV** — 既に取得済みの週次データ

### Step 2: mode 別の処理

#### mode = status（デフォルト）

```
以下を並列に実行して要約:
1. reference/snapshots/ 配下の最新 YYYY-Www ディレクトリの CSV を Read
2. .claude/todo/improvements.md の6列表から active 行を抽出
3. reference/improvement-log.md を Read し未判定の検証コマンド一覧を抽出
4. .claude/state/metrics/adsense/LATEST.md を Read し週次推移を取得

出力:
- 最新 snapshot の合計収益 + 目標超過メトリクス
- 進行中施策を「デプロイ日 - 経過日数 - ターゲット - status」形式で列挙
- 次観測予定日（最も近いもの）
```

#### mode = observe

```
1. データ取得:
   a. /fetch-adsense-data snapshot <YYYY-Www> を呼び reference/snapshots/YYYY-Www/ に CSV 保存
   b. 既に存在するなら既存 CSV を読む

2. 主要指標を抽出:
   - overview.csv: 全期間合計（earnings / page_views / rpm / impressions / clicks / ctr / viewability）
   - pages.csv: ページ別（上位 10 件 + 全件 CSV）
   - units.csv: 広告ユニット別
   - ad-units.csv: ユニット inventory (unit_id ↔ slot_id ↔ display_name)
   - devices.csv: mobile / desktop / tablet
   - daily.csv: 日次推移

3. budgets.json 判定:
   - warning_threshold <= 値 < error_threshold → WARNING
   - 値 >= error_threshold → ERROR
   - alerts 配列に記録

4. 前週 snapshot との前週比を計算:
   - reference/snapshots/ の直近 2 週分を比較
   - .claude/state/metrics/adsense/history.csv から取得しても可

5. 当月累積の計算:
   - 当月開始日〜今週末日までの daily.csv を合算
   - 前月同時期（同日数分）と比較

6. 進行中施策の効果判定（最重要）:
   .claude/todo/improvements.md のAdSense対象行を抽出。
   各施策に対して:
   - 経過日数 = observe 実行日 - deployed_at
   - 実測 delta = 最新値 - デプロイ時点の値（前週 snapshot から読む）
   - 期日前または証拠不足なら active 行を維持し、必要なら Due と次アクションを更新する。
   - 判定可能なら full / partial / none / adverse を実測値・snapshot・判定日とともに
     reference/improvement-log.md へ追記し、TODOから該当行を削除する。
   - adverse の是正は別IDで追加し、確定済み行を履歴として残さない。

7. 出力:
   - 目標超過アラートを先頭で強調
   - 効果判定を確定してTODOから削除した施策をハイライト
   - adverse があれば注意喚起（ポリシー違反や収益急減は即対応）
```

#### mode = action

```
1. 必須フィールド確認（欠落時は追加質問）:
   - 施策タイトル
   - tier: 1 (即効) / 2 (戦略) / 3 (要調査)
   - target_metric: adsense-revenue / adsense-rpm / adsense-ctr / adsense-impressions / adsense-clicks / adsense-viewability
   - 対象ページ / スロット
   - 想定効果値（デプロイ前に明文化、後付けバイアス防止）
   - deployed_at / PR 番号 / コミット hash
   - 変更内容サマリ / 変更ファイル
   - ポリシーチェック（配置・ラベリング・Auto ads との矛盾）
   - verification_command（copy-pasteable な fetch-adsense-data / API 呼び出し）

2. .claude/todo/improvements.md の該当Tierの表に1行だけ追加:

   ```markdown
   | ADSENSE-NN | <次アクションを含む短い要約> | pending | YYYY-MM-DD | <owner> | adsense |
   ```

3. front-matter の `updated:` を本日日付に更新。
4. target metric、対象、baseline、想定効果、deployed_at、PR、ポリシー確認、
   検証コマンドは reference/improvement-log.md に appendする。
5. 次の観測日（デプロイ + 14 / 28 日）を計算して提示。
```

#### mode = next

```
1. .claude/todo/improvements.md のactive行と、reference/improvement-log.md の過去判定から派生候補を抽出
2. reference/improvement-log.md の「次の候補」「仮説」セクションから未着手を拾う
3. 最新 snapshot の「次のアクション」候補も合わせる

優先度: tier-1 > tier-2 > tier-3
同 tier 内は想定効果額の大きい順。

AdSense 特有の改善パターン:
- 広告配置最適化（First Viewable Impression を意識）
- Auto ads ON/OFF 実験
- フォーマット変更（ディスプレイ → インフィード / 関連コンテンツ）
- ページ速度改善（Core Web Vitals との相乗効果）
- CLS 対策（AdSense は CLS の主要因になりがち）
```

### Step 3: 共通ルール

- **.claude/todo/improvements.md は active-only** — 未完了施策の追加・status 更新に限定する。effect 確定後は詳細を improvement-log に残し、行を削除する
- **snapshots/YYYY-Www/ も append-only** — 過去の CSV は改変しない
- **日付は絶対日付** — 「今週」「先週」は使わない
- **数値はソース明示** — "snapshots/2026-W17/overview.csv" のような相対パス
- **施策は 1 PR 1 ID** — 複数目的の PR は分割
- **想定効果値はデプロイ前に書く** — 後付けバイアス防止
- **ポリシー遵守の確認は必須** — 配置変更時は AdSense ポリシーに抵触しないこと
- **週次 /weekly-review から observe モードが自動呼び出し** される想定
- **責務を分離する** — `.claude/todo/improvements.md` はactive一覧、reference/improvement-log.md は判定履歴

## 参照パターン

```bash
# 直近スナップショット
ls -t .claude/skills/analytics/adsense-improvement/reference/snapshots/ | head -3
cat .claude/state/metrics/adsense/LATEST.md

# 進行中施策
node .claude/scripts/lib/scan-pending-improvements.mjs --format markdown

# 効果測定済み施策・詳細ログ
cat .claude/skills/analytics/adsense-improvement/reference/improvement-log.md
```

## 実証チェックリスト（効果判定を確定してTODO行を削除する前に必須）

参照: `.claude/rules/evidence-based-judgment.md`

- [ ] 検証コマンドを実行したか:
  - AdSense 実測: `/fetch-adsense-data last28d` で RPM / impressions / clicks を取得
  - 広告枠単位の比較: ad_unit dimension で配置別 RPM 差を確認
- [ ] AdSense 仕様（CLS 影響・自動広告挙動）を主張するなら公式ドキュメント URL を引用したか（`support.google.com/adsense/...`）
- [ ] 比較対象（before / after / baseline）が明確か
- [ ] NG ワード（「のはず」「と思われる」「兆候」「浸透待ち」）を使っていないか
- [ ] 効果が想定の 80% 未満なら、`[仮説] 〜 / 検証コマンド: 〜 / 検証期日: YYYY-MM-DD / 期日後の判定: 〜` の 4 点セットを書いたか
- [ ] **CLS 対策と RPM 改善の因果は PSI 実測 + AdSense 比較の両方で確認したか**（片方だけでは判定不能）

このチェック未満なら効果を確定せず、active 行を維持すること。

## 関連スキル

- `/fetch-adsense-data` — AdSense Management API から生データを取得（本 skill の入力ソース）
- `/gsc-improvement` — GSC（検索）
- `/ga4-improvement` — GA4（行動分析）
- `/cloudflare-cost-improvement` — Cloudflare コスト
- `/performance-report` — Lighthouse + Core Web Vitals（CLS 対策と連携）
- `/knowledge` — 恒久的な教訓を記録

## 前提

- `.claude/todo/improvements.md` が存在すること（施策 ID は `ADSENSE-*` または `AFF-*`）
- `reference/budgets.json` / `reference/snapshots/` / `reference/improvement-log.md` 初期化済
- AdSense Management API の OAuth 設定済。**CI 専任** — `GOOGLE_ADSENSE_CLIENT_ID` /
  `GOOGLE_ADSENSE_ACCOUNT_ID` は GitHub Repository Variables、
  `GOOGLE_ADSENSE_CLIENT_SECRET` / `GOOGLE_ADSENSE_REFRESH_TOKEN` は GitHub Secrets に置き、
  `.env.local` には置かない。
  そのため **snapshot 取得と unit inventory はローカルで実行できない** — `fetch-metrics-weekly.yml`
  が生成して develop に commit-back したものを読む
- Publisher ID: `ca-pub-7995274743017484`
- 本番 URL: `https://stats47.jp`
