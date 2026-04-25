---
name: adsense-improvement
description: Google AdSense の広告収益・RPM・CTR・ビューアビリティを GitHub Issues で追跡し、週次 snapshot と施策の効果判定を記録する。Use when user says "AdSense改善", "広告収益改善", "RPM改善", "AdSense記録".
---

AdSense の週次メトリクス（Earnings / Page RPM / CTR / Impressions / Active View）を **GitHub Issues で時系列追跡**し、打った施策と効果を記録するスキル。

広告配置・フォーマット変更・コンテンツ追加の効果は 1〜4 週間で現れるため、「何をいつしたか」「数値がどう動いたか」「次の候補は何か」を Issue に記録する。

## データの保管場所

| データ | 保管先 | 理由 |
|---|---|---|
| 生メトリクス CSV | git: `reference/snapshots/YYYY-Www/` | immutable、diff 比較、オフライン可 |
| 目標しきい値設定 | git: `reference/budgets.json` | プロジェクト設定 |
| 施策（1 施策 1 Issue） | GitHub Issues ラベル `adsense-improvement` | タイムライン・PR リンク・通知・検索 |
| 週次スナップショット（議論用） | GitHub Issues ラベル `adsense-snapshot` | 施策 Issue との相互参照、Web UI |
| 観測値の時系列・効果判定 | 各施策 Issue へのコメント + `effect/*` ラベル切替 | 自然なスレッド構造 |

## ラベル体系

- **分類**: `adsense-improvement` / `adsense-snapshot`
- **Tier**: `tier-1`（即効）/ `tier-2`（戦略）/ `tier-3`（要調査）
- **対象メトリクス**: `metric/adsense-revenue` / `metric/adsense-rpm` / `metric/adsense-ctr` / `metric/adsense-impressions` / `metric/adsense-clicks` / `metric/adsense-viewability`
- **効果判定**: `effect/pending` → `effect/full` / `effect/partial` / `effect/none` / `effect/adverse`

## 引数

```
$ARGUMENTS — [mode]
             mode:
               - status  (デフォルト) : 直近スナップショット + 進行中施策を要約
               - observe : 新 snapshot Issue 作成 + 目標判定 + 施策効果追記
               - action  : 新しい施策 Issue を作成
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
2. gh issue list --label adsense-snapshot --state open --limit 3 で直近スナップショット Issue
3. gh issue list --label adsense-improvement --state open で進行中施策一覧
4. gh issue list --label adsense-improvement --label "effect/pending" で効果測定待ちの施策
5. gh issue list --label adsense-improvement --label "effect/adverse" で逆効果検出済み（あれば警告強調）

出力:
- 最新 snapshot の合計収益 + 目標超過メトリクス
- 進行中施策を「デプロイ日 - 経過日数 - ターゲット - effect ラベル」形式で列挙
- 次観測予定日（最も近いもの）
```

#### mode = observe

```
1. データ取得:
   a. /fetch-adsense-data snapshot <YYYY-Www> を呼び reference/snapshots/YYYY-Www/ に CSV 保存
   b. 既に存在するなら既存 CSV を読む

2. 主要指標を抽出:
   - overview.csv: 全期間合計（earnings / page_views / rpm / impressions / clicks / ctr / viewability）
   - pages.csv: ページ別（上位 10 件を Issue 本文に、全件は CSV に）
   - units.csv: 広告ユニット別
   - devices.csv: mobile / desktop / tablet
   - daily.csv: 日次推移

3. budgets.json 判定:
   - warning_threshold <= 値 < error_threshold → WARNING
   - 値 >= error_threshold → ERROR
   - alerts 配列に記録

4. 前週 snapshot Issue を取得して前週比を計算:
   gh issue list --label adsense-snapshot --state all --limit 2 --json number,title,body

5. 当月累積の計算:
   - 当月開始日〜今週末日までの daily.csv を合算
   - 前月同時期（同日数分）と比較

6. snapshot Issue 作成:
   gh issue create --label adsense-snapshot --title "[AdSense Snapshot] YYYY-Www" \
     --body "<template 埋め>"

7. 進行中施策 Issue の効果判定（最重要）:
   gh issue list --label adsense-improvement --label "effect/pending" で対象取得。
   各 Issue に対して:
   - 経過日数 = observe 実行日 - デプロイ日
   - 実測 delta = 最新値 - デプロイ時点の値（前週 snapshot から読む）
   - 判定:
     * 経過 < 14 日 → effect/pending 維持
     * 経過 ≥ 14 かつ |実測/想定| ≥ 80% → effect/full
     * 経過 ≥ 14 かつ 20-80% → effect/partial
     * 経過 ≥ 14 かつ < 20% → effect/none
     * 逆方向 → effect/adverse
   - 判定結果を施策 Issue にコメントとして追記:
     ```
     ## 📊 効果観測 (YYYY-MM-DD)
     - 経過日数: N 日
     - snapshot: #XX (参照)
     - 想定 delta: RPM +20%
     - 実測 delta: RPM +18%
     - 判定: **effect/full** ✅
     ```
   - ラベル差し替え: gh issue edit $ISSUE --remove-label "effect/pending" --add-label "effect/XXX"

8. 前週 snapshot Issue のクローズ判定:
   - 前週 Issue 本体の「次のアクション」が全て完了 or 関連施策 Issue が全て effect/pending を脱している
     → gh issue close <prev-number> --comment "次週 snapshot #NNN で継続追跡"
   - 未完了アクションがある場合は open のまま残す

9. 出力:
   - 目標超過アラートを先頭で強調
   - 判定変化（pending → full/partial/none/adverse）した施策をハイライト
   - adverse があれば注意喚起（ポリシー違反や収益急減は即対応）
```

#### mode = action

```
1. 必須フィールド確認（欠落時は追加質問）:
   - 施策 ID: `T{Tier}-{Category}-{連番}` 形式
     - Tier: T1 / T2 / T3
     - Category: PLACEMENT / FORMAT / RPM / CTR / VIEWABILITY / POLICY / AUTO-ADS / EXPERIMENT
   - ターゲット指標（複数可）
   - 対象ページ / スロット
   - 想定効果値（デプロイ前に明文化、後付けバイアス防止）
   - デプロイ日 / PR 番号 / コミット hash
   - 変更内容サマリ / 変更ファイル
   - ポリシーチェック（配置・ラベリング・Auto ads との矛盾）

2. .github/ISSUE_TEMPLATE/adsense-improvement.md を雛形として gh issue create 実行:
   gh issue create \
     --title "[T{Tier}-{Cat}-{NN}] 施策名" \
     --label "adsense-improvement,tier-{N},metric/adsense-{kind},effect/pending" \
     --body "<template 埋め>"

3. 作成した Issue 番号を返す。
   最新 snapshot Issue に「アクティブな施策」として追記（gh issue edit --body）。

4. 次の観測日（デプロイ + 14 / 28 日）を計算して提示
```

#### mode = next

```
gh issue list --label adsense-improvement --state open --json number,title,labels の中で
effect/pending を除いた（=未着手提案）枠 + 現状分析から次の改善候補を提示。

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

- **Issue は append-only** — 編集ではなくコメント追記で履歴を残す
- **snapshots/YYYY-Www/ も append-only** — 過去の CSV は改変しない
- **日付は絶対日付** — 「今週」「先週」は使わない
- **数値はソース明示** — "snapshot #XX" or "snapshots/2026-W17/overview.csv"
- **施策は 1 PR 1 Issue** — 複数目的の PR は分割
- **想定効果値はデプロイ前に Issue 本文に書く** — 後付けバイアス防止
- **ポリシー遵守の確認は必須** — 配置変更時は AdSense ポリシーに抵触しないこと
- **週次 /weekly-review から observe モードが自動呼び出し** される想定

## GitHub Issues 参照パターン

```bash
# 直近スナップショット
gh issue list --label adsense-snapshot --state all --limit 6

# 効果測定待ちの施策
gh issue list --label adsense-improvement --label "effect/pending"

# 逆効果検出済み（要対処）
gh issue list --label adsense-improvement --label "effect/adverse"

# 特定メトリクスの施策
gh issue list --label "metric/adsense-rpm"

# クロージング済みを含む Tier 1 施策
gh issue list --label adsense-improvement --label tier-1 --state all
```

## 実証チェックリスト（effect/* ラベルを付ける前に必須）

参照: `.claude/rules/evidence-based-judgment.md`

- [ ] 検証コマンドを実行したか:
  - AdSense 実測: `/fetch-adsense-data last28d` で RPM / impressions / clicks を取得
  - 広告枠単位の比較: ad_unit dimension で配置別 RPM 差を確認
- [ ] AdSense 仕様（CLS 影響・自動広告挙動）を主張するなら公式ドキュメント URL を引用したか（`support.google.com/adsense/...`）
- [ ] 比較対象（before / after / baseline）が明確か
- [ ] NG ワード（「のはず」「と思われる」「兆候」「浸透待ち」）を使っていないか
- [ ] 効果が想定の 80% 未満なら、`[仮説] 〜 / 検証コマンド: 〜 / 検証期日: YYYY-MM-DD / 期日後の判定: 〜` の 4 点セットを書いたか
- [ ] **CLS 対策と RPM 改善の因果は PSI 実測 + AdSense 比較の両方で確認したか**（片方だけでは判定不能）

このチェック未満なら effect/full / effect/partial を付けない。effect/pending のままにすること。

## 関連スキル

- `/fetch-adsense-data` — AdSense Management API から生データを取得（本 skill の入力ソース）
- `/gsc-improvement` — GSC（検索）
- `/ga4-improvement` — GA4（行動分析）
- `/cloudflare-cost-improvement` — Cloudflare コスト
- `/performance-report` — Lighthouse + Core Web Vitals（CLS 対策と連携）
- `/knowledge` — 恒久的な教訓を記録

## 前提

- `.github/ISSUE_TEMPLATE/adsense-snapshot.md` と `adsense-improvement.md` が存在
- ラベル体系（`adsense-improvement` / `adsense-snapshot` / `tier-1/2/3` / `metric/adsense-*` / `effect/*`）が作成済
- `reference/budgets.json` / `reference/snapshots/` 初期化済
- AdSense Management API の OAuth 設定済（`.env.local` に CLIENT_ID / SECRET / REFRESH_TOKEN / ACCOUNT_ID）
- Publisher ID: `ca-pub-7995274743017484`
- 本番 URL: `https://stats47.jp`
