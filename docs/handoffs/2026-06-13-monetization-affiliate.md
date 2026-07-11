---
type: session-handoff
date: 2026-06-13
status: active
topic: 転職アフィリエイト収益化 / per-ranking-key targeting / 医療職記事 / CodeQL / 是正キュー
related_strategy: docs/04_レビュー/2026-06-13-monetization-career.md
tags: [session-handoff, 収益化, affiliate, 転職, targeting, GA4, ブログ品質]
---

# セッションハンドオフ — 転職アフィリエイト収益化 (2026-06-13)

> 次セッションがこのファイルと git log だけで続行できるように記録する。
> 関連の詳細は `docs/04_レビュー/2026-06-13-monetization-career.md` (転職戦略・targeting 実装の正典)。

## 0. このセッションで完了したこと (全て本番反映済み)

| # | 領域 | 成果 |
|---|---|---|
| 1 | 戦略 | 転職アフィリエイト収益化戦略を立案 (医療専門職クラスタ主軸)。`docs/04_レビュー/2026-06-13-monetization-career.md` + `docs/00_プロジェクト管理/02_収益化戦略.md` |
| 2 | 実装 | **per-ranking-key targeting** (`targetRankingKeys`)。snapshot バナー/テキスト/固定 SidebarPromoBanner の **3 経路**で、職種年収ページへのエンジニア転職漏れを停止。本番実測で確認 |
| 3 | デプロイ | 全セッション変更を本番反映。CI 型エラー (`any→unknown` 破壊)・デプロイ 403 (R2 incremental cache token)・git race・CodeQL 誤検知を全解消 |
| 4 | 新規記事 | 医療職 **4 本** (看護師/理学療法士/介護/歯科衛生士 = 医療クラスタ完成) |
| 5 | セキュリティ | CodeQL 債務 **完全解消** (owner #471 + 私 #474: SSRF/path-injection/ReDoS/XSS) |
| 6 | 品質是正 | 是正キュー must-fix **6 本** brushup (musical-instrument/local-debt/inflow-population + train-commuters/future-burden/low-birthweight) |

全成果物: factual + quality-gate 0 blocker + blog-critic PASS の 3 層担保、本番 200 確認済み。

- 現行本番デプロイ: `origin/main` (deploy 成功)。develop は main を内包。
- 詳細: git log の `feat(ads): per-ranking-key targeting` / `content(blog): 医療職...` / `fix(security): CodeQL...` 各コミット参照。

---

## 1. ★最優先の人間タスク: GA4 custom dimension 登録 (アフィ効果判定の入口)

> 「これが稼働するとアフィ CV 計測が始まり効果判定フェーズへ」の **具体手順**。次に人間が GA4 管理画面でやる。

### 現状
- `affiliate_click` イベントは発火済み・**サービスアカウント計測で総数 8 クリック/28日は取れている** (`.claude/state/ads/ga4-affiliate-*.json`)。
- だが GA4 でカスタムディメンション未登録のため `hasCategoryBreakdown: false` = **内訳 (どの記事/配置か) が分解できない**。
- コードが送る param: `events.ts:41-50` の `trackAffiliateClick` → `affiliate_category` / `link_position` / `experiment_id` / `variant_id` / `creative_size`。
- 取得スクリプト: `.claude/scripts/ads/fetch-affiliate-ga4.cjs:62-68` がこれら custom dimension を期待 (未登録時は eventName 総数のみのフォールバック)。

### 手順 (GA4 管理画面・約10分)
GA4 → 管理 → プロパティ列「カスタム定義」→「カスタムディメンションを作成」→ **スコープ=イベント**で登録:

| ディメンション名 | イベントパラメータ (★完全一致必須) | 必須度 |
|---|---|---|
| affiliate_category | `affiliate_category` | **必須** (記事/カテゴリ別) |
| link_position | `link_position` | **必須** (配置別: sidebar/native/blog-bottom 等) |
| experiment_id | `experiment_id` | 任意 (A/B) |
| variant_id | `variant_id` | 任意 (A/B) |
| creative_size | `creative_size` | 任意 |

- **最低限 affiliate_category と link_position の 2 つ**でカテゴリ×配置別の click/CTR が出る。
- ⚠️ **遡及しない**。登録後のクリックから内訳が貯まる → 早く登録するほど早く揃う。
- (任意) GA4 → イベント → `affiliate_click` を「キーイベント」化でコンバージョン扱い。

### 検証
```bash
gh workflow run affiliate-ga4-weekly.yml   # 週次集計を手動発火
# 確認: .claude/state/ads/ga4-affiliate-*.json の "hasCategoryBreakdown": true / rows に内訳
```

### ⚠️ 「OAuth」の混同に注意
- アフィのクリック取得は **サービスアカウントで稼働済み・OAuth 不要**。
- マスタープランの「OAuth」は **AdSense** のデータ収集用 (refresh token 失効) で別系統。アフィ計測で OAuth を追わないこと。
- → **アフィ CV 計測に必要なのは (a) GA4 dimension 登録 と (b) ASP 成果接続 の 2 つだけ**。

---

## 2. ★人間タスク: ASP 成果データの接続 (¥ の本体)

- **GA4 はクリックまでしか見えない。成約 (無料登録) と報酬¥は ASP 管理画面 (A8.net 等) にしかない。**
- 方法: 各 ASP 管理画面で成果レポート (プログラム別・期間別の成約数・確定報酬額) を週次/月次でエクスポート → GA4 のクリック内訳 (記事/配置別) と期間で突き合わせ → `EPC = 確定報酬額 ÷ クリック` を記事/職種別に算出。
- ASP 提携申請リストは `docs/04_レビュー/2026-06-13-monetization-career.md §A` に用意済み (医療: 薬剤師¥10-20K/看護師¥3-5K/介護¥3-10K、IT、総合)。

→ (1) GA4 dimension + (2) ASP 成果が揃うと、記事別 click→CV→¥ が見え、`evidence-based-judgment.md` 準拠で effect/* を実証判定できる = **効果判定フェーズ**。

---

## 3. アフィ targeting の状態 (実装完了・本番稼働中)

エンジニア転職 (STRATEGY CAREER) を IT 職 ranking (`software-engineer` / `system-consultant`) のみに限定。3 経路すべて対応済み:
- ① snapshot バナー (`5ZEMP`) → `targetRankingKeys` (`affiliate-ad-snapshot.ts` の `matchesRankingTarget`)
- ② snapshot テキスト (`5YJRM`) → text 解決経路に rankingKey フィルタ
- ③ 固定 SidebarPromoBanner (`5YZ75`) → `selectPromoBannerIndexForRanking` (IT職以外は汎用 recruit バナー)

本番実測: software-engineer ページ=表示 / nurse・cook ページ=0。詳細 `docs/04_レビュー/2026-06-13-monetization-career.md §E`。

---

## 4. ブログ品質是正キュー (継続運用・次セッションで再開可)

- 真実源: `.claude/state/blog/remediation-queue.json` (GSC流入×品質blockerの統合スコア)。
- 現状: **pending 193 (must-fix 169 / opportunity 24) / done 12**。今セッションで 6 本消化。
- 再開方法 (どのセッションからでも):
  ```bash
  node .claude/scripts/blog/build-remediation-queue.mjs            # 公開R2から再構築
  node .claude/scripts/blog/build-remediation-queue.mjs --next 3   # 次の must-fix 上位
  ```
  → article-writer agent で brushup (既存分析を保持し全 blocker 是正) → blog-critic PASS → develop push で `blog-auto-publish.yml` 公開。
- **1 バッチ 3 本が適量** (各記事に article-writer + blog-critic が走る ≒ 40万トークン/バッチ)。169 本は週次バッチで順次消化する継続運用。
- 典型 blocker: callouts<2 / internalLinks<3 / である調混在 / ランキング表→上位5+下位5 SVG / インライン svg→生成画像 / 記事内「関連」セクション削除。
- **注意 (今回踏んだ)**: blog category は 17 軸キーのみ有効 (`medicalhealth` は無効→404、医療は `socialsecurity`)。critic は frontmatter↔body の data-false 矛盾も検出する (中堅県事例)。

---

## 5. その他の agent-doable バックログ (未着手)

- 是正キュー残り 169 本 (上記 §4)。
- `PERF-AUDIT-DEFER` (大型・要設計): theme/area 観測値の R2 事前 bake / search-index 1.35MB バンドル解除 (一度 #472→#473 で revert 済)。
- effect/pending 多数 (期日 6/20〜7/8 に gsc-analyst/performance-auditor が実測 → improvement-triage が effect 確定。日付ゲート待ち)。

---

## 6. 環境メモ (次セッションへの注意)

- **並行セッションが同一作業コピーで稼働中**。develop への push は都度 rebase 統合・main 先行は取り込んでから PR (branch-workflow 準拠)。git race を何度も踏んだ。
- R2 incremental cache の deploy 403 は **owner がトークン権限付与で解消済** (#468 deploy 成功)。再発時はトークンの R2 バケット provisioning 権限を確認。
- CodeQL の残存 open alert は全て今回解消したが、巨大 PR では既存 alert が「新規」と誤帰属される (diff が大きすぎる時の CodeQL 仕様)。
