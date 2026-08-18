---
name: seo-audit
description: SEO 総合監査を実行する（GSC/GA4 実データ + サイト構造 + DB 分析）。Use when user says "SEO監査", "SEOチェック", "検索順位改善". 技術SEO・コンテンツ・キーワード・プログラマティック4領域対応.
primary_agent: performance-auditor
---

stats47.jp の SEO を総合的に監査する。データ取得 → 分析 → 改善提案を一気通貫で行い、優先度付きのアクションリストを生成する。

## 引数

```
/seo-audit [--focus AREA] [--period PERIOD]
```

- `--focus`: 監査の重点領域（省略時: 全領域）
  - `technical`: 技術 SEO（構造化データ・サイトマップ・Core Web Vitals）
  - `content`: コンテンツ最適化（タイトル・ディスクリプション・内部リンク）
  - `keywords`: キーワード分析（順位・CTR・カニバリゼーション）
  - `programmatic`: プログラマティック SEO（ランキングページのインデックス状況）
- `--period`: GSC/GA4 のデータ期間（デフォルト: `28d`）。`7d`, `28d`, `3m`, `6m`

## 手順

### Phase 1: データ収集（同一セッションの並列 tool call）

4つの観点を同一セッションで収集する。各 snapshot skill / script を直接実行し、収集だけの
subagent は起動しない。

#### Track A: GSC パフォーマンスデータ

GSC API からデータを取得する。認証情報は `stats47-*.json`（サービスアカウント）。

```bash
# サービスアカウントキーの特定
SA_KEY=$(ls stats47-*.json 2>/dev/null | head -1)
```

取得するデータ:

1. **ページ別パフォーマンス（上位100）**
   - dimensions: page
   - metrics: clicks, impressions, ctr, position
   - 期間: 指定期間

2. **クエリ別パフォーマンス（上位200）**
   - dimensions: query
   - metrics: clicks, impressions, ctr, position
   - 期間: 指定期間

3. **クエリ×ページ（上位500）**
   - dimensions: query, page
   - カニバリゼーション検出用

4. **デバイス別パフォーマンス**
   - dimensions: device
   - モバイル vs デスクトップの差異

出力形式:
- 総クリック数・インプレッション数・平均 CTR・平均掲載順位
- ページ種別ごとの集計（/ranking/, /areas/, /blog/, /category/, /themes/, その他）
  ※ /compare は 2026-05-28 に /category/[key]/compare へ統合 (301 redirect)、/ranking 一覧は / へ統合
- 上位クエリ 50 件（clicks 順）

#### Track B: GA4 トラフィックデータ

GA4 API からデータを取得する（Property ID: `463218070`）。

取得するデータ:

1. **ページ別 PV（上位100）**
   - dimensions: pagePath
   - metrics: screenPageViews, activeUsers, bounceRate, averageSessionDuration

2. **流入チャネル別**
   - dimensions: sessionDefaultChannelGroup
   - metrics: sessions, activeUsers

3. **デバイス別**
   - dimensions: deviceCategory
   - metrics: sessions, bounceRate

出力形式:
- 総 PV・ユーザー数・直帰率・平均セッション時間
- ページ種別ごとの PV 集計
- チャネル別セッション比率

#### Track C: サイト構造・技術監査

コードベースから技術的な SEO 状態を調査する。

```bash
# 1. サイトマップ生成のカバレッジ
# sitemap.ts がどのテーブルからURLを生成しているか確認
cat apps/web/src/app/sitemap.ts

# 2. 構造化データの実装状況
find apps/web/src -name "*.ts" -o -name "*.tsx" | xargs grep -l "json-ld\|JsonLd\|structured-data\|structuredData" 2>/dev/null

# 3. メタデータ生成の実装
find apps/web/src -name "*metadata*" -o -name "*meta-data*" | head -20

# 4. リダイレクト設定
cat apps/web/src/middleware.ts

# 5. robots.txt
cat apps/web/src/app/robots.ts

# 6. 画像の alt テキスト状況（ランダムサンプル）
grep -r "<img\|<Image" apps/web/src --include="*.tsx" -l | head -10
```

出力形式:
- サイトマップに含まれる URL 種別と推定数
- 構造化データの実装一覧（ページ種別 × スキーマタイプ）
- リダイレクトルール一覧
- robots.txt のルール
- 画像 alt テキストの有無（サンプル）

#### Track D: R2 / git TS からコンテンツ規模の把握

```bash
# 完全DBレス: R2 snapshot / git TS から集計。旧 D1/miniflare は廃止
R2="https://storage.stats47.jp"
echo "公開記事:            $(curl -s "$R2/app/blog/all.json" | jq '.articles | length')"
echo "下書き記事:          $(ls docs/21_ブログ記事原稿/*/article.md 2>/dev/null | wc -l | tr -d ' ') (docs/21 outbox。公開分のみ R2)"
echo "メトリクス(全定義):   $(ls packages/data-configs/src/metrics/*.ts 2>/dev/null | wc -l | tr -d ' ') (git TS)"
echo "メトリクス(公開active): $(curl -s "$R2/app/ranking-items/all.json" | jq '.count')"
echo "カテゴリ:            $(curl -s "$R2/app/categories/all.json" | jq '.count')"
echo -n "テーマ:              "; npx tsx -e 'import {ALL_THEMES} from "./apps/web/src/features/theme-dashboard/config/all-themes.ts";console.log(ALL_THEMES.length)'
echo "相関ペア総数:        $(curl -s "$R2/app/correlation/stats.json" | jq '.total')"
# 地域プロファイルは Derived（R2 app/areas/<code>/profile.json、47 都道府県分）

# 観測値 (values.json) 未投入のランキング（公開集合を R2 有無で判定）
for key in $(curl -s "$R2/app/ranking-items/all.json" | jq -r '.items[].rankingKey' | head -200); do
  [ "$(curl -s -o /dev/null -w '%{http_code}' "$R2/app/stats/$key/values.json")" = "200" ] || echo "未投入: $key"
done | head -20

# AI コンテンツ未生成のランキング（R2 ai-content.json の有無で判定。旧 metrics.insights 列は廃止）
#   体系的な棚卸しは build-ai-content-queue.mjs（状態付きキュー、正典 memory project_ai_content_remediation_queue）を使う
for key in $(curl -s "$R2/app/ranking-items/all.json" | jq -r '.items[].rankingKey' | head -50); do
  [ "$(curl -s -o /dev/null -w '%{http_code}' "$R2/app/ranking/$key/ai-content.json")" = "200" ] || echo "AI未生成: $key"
done | head -20
```

出力形式:
- コンテンツ規模の全体像
- データ欠損のあるランキング項目
- AI コンテンツ未生成のランキング項目

### Phase 2: 分析（6つの観点）

Phase 1 のデータを統合し、以下の6観点で分析する。

#### 2-1. インデックス状況とカバレッジ

- **サイトマップ URL 数 vs GSC インデックス数の乖離**
  - ランキングページ: R2 ranking-items 数（`app/ranking-items/all.json` の `.count`）vs GSC で impressions > 0 のランキング URL 数
  - ブログ記事: R2 公開記事数（`app/blog/all.json` の `.articles | length`）vs GSC で impressions > 0 のブログ URL 数
  - 都道府県ページ: 47 × カテゴリ数 vs GSC データ
- **インデックスされていないページの特定**: サイトマップに含まれるが GSC にデータがない URL パターン
- **薄いコンテンツのリスク**: AI コンテンツ未生成のランキングページ（コンテンツが少なくインデックスされにくい）

#### 2-2. キーワードパフォーマンス

- **Low-Hanging Fruit（順位 4-20 位）**: 少しの改善で上位表示できるクエリ
  - 各クエリに対する改善提案（タイトル改善・コンテンツ追加・内部リンク強化）
- **高インプレッション低 CTR**: 表示されているがクリックされないページ
  - タイトル・ディスクリプションの改善候補
- **キーワードカニバリゼーション**: 同じクエリに対して複数ページが競合
  - クエリ × ページのデータから、同一クエリで2ページ以上がランクインしているケースを検出
  - 対策: canonical 統合 or コンテンツ差別化

#### 2-3. コンテンツ最適化

- **タイトルタグの品質**: 長すぎ（60文字超）/ 短すぎ / キーワード未含有
- **メタディスクリプション**: 未設定 / 長すぎ（160文字超）/ 短すぎ
- **構造化データの網羅性**:
  - ランキングページ: Dataset + BreadcrumbList（実装済み。FAQPage 未実装）
  - ブログ記事: Article スキーマ未実装（OGP のみ）
  - 都道府県ページ: AdministrativeArea + BreadcrumbList（実装済み）
- **内部リンク**: 孤立ページ（他ページからリンクされていないページ）の検出

#### 2-4. プログラマティック SEO 健全性

stats47 の主力は 1,800+ 件のランキングページ。以下を重点チェック:

- **テンプレート品質**: 動的に生成されるタイトル・ディスクリプションが適切か
- **コンテンツ差別化**: ランキングページ間の差別化が十分か（薄いコンテンツリスク）
- **AI コンテンツのカバレッジ**: 全ランキングページに FAQ・分析が生成されているか
- **データ鮮度**: ranking_data の最新年度。古いデータのみのページはないか
- **CSV ダウンロード**: Dataset スキーマの distribution（DataDownload）が正しく設定されているか

#### 2-5. モバイル・パフォーマンス

- **モバイル vs デスクトップの差異**: GSC のデバイス別データで順位差が大きいページ
- **GA4 の直帰率差異**: モバイルの直帰率がデスクトップより著しく高いページ
- **Core Web Vitals の確認方法を提示**: PageSpeed Insights API や CrUX API への手動チェック手順

#### 2-7. インデックス制御チェック

以下の3点を自動チェックする。過去に OGP 画像 URL の Disallow 漏れで 1,453 件の「クロール済み - インデックス未登録」が発生した教訓に基づく。

1. **robots.txt Disallow の網羅性**: `apps/web/src/app` 配下を再帰的に走査し、`opengraph-image.tsx`, `icon.tsx`, `apple-icon.tsx`, `twitter-image.tsx` 等の Next.js File Convention ルートを列挙。それぞれが `robots.ts` の Disallow に含まれているか照合する。
2. **noindex 一貫性**: `generateMetadata` で `robots: "noindex"` を設定しているページを列挙し、その親/子ページにも同じ設定が必要かを確認する。特に、サイトマップに含まれていないページで noindex 未設定のものを検出する。
3. **sitemap と noindex の矛盾**: サイトマップに含まれているが noindex のページ、またはサイトマップに含まれていないが index 対象のページを検出する。

#### 2-6. 競合・機会分析

- **検索クエリのカテゴリ分布**: どのテーマが最も検索されているか
- **未カバーのテーマ**: GSC クエリに出現するがランキングページが存在しないテーマ
- **ブログ vs ランキングの貢献度**: どちらがトラフィックを牽引しているか
- **季節性パターン**: 特定時期にインプレッションが急増するクエリ

### Phase 3: アクションリスト生成

分析結果を優先度付きのアクションリストに変換する。

#### 優先度の判定基準

| 優先度 | 基準 | 例 |
|---|---|---|
| 🔴 P0（今すぐ） | インデックス問題・重大な技術的エラー・大きなトラフィック損失 | サイトマップに含まれるがインデックスされていないページが 30% 以上 |
| 🟡 P1（今週中） | 低コストで効果が見込める改善 | 順位 4-10 位のクエリのタイトル改善、カニバリゼーション解消 |
| 🟢 P2（今月中） | 中期的な改善 | 構造化データ追加、内部リンク強化、AI コンテンツ生成 |
| ⚪ P3（バックログ） | 効果は見込めるが工数が大きい | 新規コンテンツ制作、ページ速度改善 |

#### アクションの書き方

各アクションに以下を含める:
1. **何をするか**: 具体的な作業内容
2. **なぜ**: データに基づく根拠
3. **期待効果**: 推定インパクト（クリック増加見込み等）
4. **実行方法**: 使うべきスキル or 手動手順
5. **計測方法**: 効果測定の方法と時期

### Phase 4: 出力

監査全文はセッション内で提示する。未完了の改善だけを `.claude/todo/04_改善バックログ.md` へ
ID・優先度・対象URL・実行手順・停止条件・計測方法・完了条件付きで統合する。再現可能な機械結果は
`.claude/state/`、比較用のagent履歴は本skillの `reference/` に置く。

## 出力フォーマット

```markdown
---
title: SEO 監査レポート
date: "YYYY-MM-DD"
period: "YYYY-MM-DD ~ YYYY-MM-DD"
focus: "all | technical | content | keywords | programmatic"
---

# SEO 監査レポート（YYYY年MM月）

## エグゼクティブサマリー

- 総合スコア: **N/10**（前回比 ±N）
- 最重要アクション: {1文で}
- 推定改善ポテンシャル: 月間 +N クリック

## 1. トラフィック概況

| 指標 | 値 | 前期比 |
|---|---|---|
| 総クリック数 | N | ±N% |
| 総インプレッション | N | ±N% |
| 平均 CTR | N% | ±N pp |
| 平均掲載順位 | N | ±N |
| GA4 PV | N | ±N% |
| GA4 ユーザー | N | ±N% |

### ページ種別パフォーマンス

| ページ種別 | クリック | インプレッション | CTR | 平均順位 | PV |
|---|---|---|---|---|---|
| ランキング (/ranking/) | N | N | N% | N | N |
| ブログ (/blog/) | N | N | N% | N | N |
| 都道府県 (/areas/) | N | N | N% | N | N |
| 相関分析 (/correlation/) | N | N | N% | N | N |
| その他 | N | N | N% | N | N |

## 2. インデックス状況

| ページ種別 | サイトマップ数 | GSC 検出数 | インデックス率 | 状態 |
|---|---|---|---|---|
| ランキング | N | N | N% | ✅/⚠️/❌ |
| ブログ | N | N | N% | ✅/⚠️/❌ |
| 都道府県 | N | N | N% | ✅/⚠️/❌ |

{分析コメント}

## 3. キーワード分析

### Low-Hanging Fruit（順位 4-20 位、高インプレッション）

| クエリ | 順位 | imp | clicks | CTR | 対象ページ | 改善案 |
|---|---|---|---|---|---|---|
| ... | N | N | N | N% | /path | タイトル改善 / コンテンツ追加 |

### 高インプレッション低 CTR

| クエリ | 順位 | imp | CTR | 対象ページ | 改善案 |
|---|---|---|---|---|---|
| ... | N | N | N% | /path | ディスクリプション改善 |

### カニバリゼーション検出

| クエリ | ページ1 | 順位1 | ページ2 | 順位2 | 対策 |
|---|---|---|---|---|---|
| ... | /path1 | N | /path2 | N | canonical / 統合 / 差別化 |

## 4. プログラマティック SEO

- ランキングページ総数: N
- AI コンテンツ生成済み: N（N%）
- データ欠損: N 件
- {詳細分析}

## 5. 技術 SEO

### 構造化データ

| ページ種別 | 実装済みスキーマ | 未実装（推奨） |
|---|---|---|
| ランキング | Dataset, BreadcrumbList | FAQPage |
| ブログ | (OGPのみ) | Article, BreadcrumbList |
| 都道府県 | AdministrativeArea, BreadcrumbList | — |
| トップ | WebSite, Organization | — |

### その他の技術項目

- リダイレクト: N 件設定済み
- 410 Gone: N 件
- robots.txt: {問題の有無}
- サイトマップ: {問題の有無}

## 6. 機会分析

### 未カバーテーマ

| 検索クエリパターン | インプレッション | 現状 | 提案 |
|---|---|---|---|
| ... | N | ページなし | 新規ランキング登録 / ブログ記事作成 |

### カテゴリ別トラフィック分布

| カテゴリ | クリック比率 | ランキング数 | 1件あたりクリック |
|---|---|---|---|
| ... | N% | N | N |

## アクションリスト

### 🔴 P0: 今すぐ対応

| # | アクション | 根拠 | 期待効果 | 実行方法 |
|---|---|---|---|---|
| 1 | ... | データ引用 | +N clicks/月 | スキル名 or 手順 |

### 🟡 P1: 今週中

| # | アクション | 根拠 | 期待効果 | 実行方法 |
|---|---|---|---|---|
| 1 | ... | ... | ... | ... |

### 🟢 P2: 今月中

| # | アクション | 根拠 | 期待効果 | 実行方法 |
|---|---|---|---|---|
| 1 | ... | ... | ... | ... |

### ⚪ P3: バックログ

| # | アクション | 根拠 | 期待効果 |
|---|---|---|---|
| 1 | ... | ... | ... |

## 次回監査への申し送り

- 今回のアクション実行後に確認すべき指標
- 次回重点的に見るべき領域
- 比較のためのベースライン数値
```

## 前回レポートとの比較

`.claude/todo/04_改善バックログ.md` とGSCのhistory/improvement logを読み:
- 前回アクションのstatusを確認
- 主要指標の推移を比較
- 未完了のP0/P1は同じIDを更新し、重複行を作らない

## SEO トラッキングの活用（完全DBレス）

> 旧 D1 `seo_tracking` / `seo_actions` テーブルは廃止（2026-04-15、schema にも存在しない）。
> カバレッジ推移は GSC state、SEO 施策は改善バックログを真実源とする。

### データ参照
```bash
# カバレッジ指標の推移（GSC state。旧 seo_tracking の代替）
cat .claude/state/gsc/LATEST.md                                  # 最新サマリ
cat .claude/state/metrics/gsc/history.csv | tail -10             # 時系列（直近10件）
# 未完了の SEO 施策（改善バックログ。旧 seo_actions の代替）
grep -nE "status:\s*(pending|in.progress)" .claude/todo/04_改善バックログ.md
```

### レポート出力時
- GSC state（`LATEST.md` / `history.csv`）のトレンドをレポートの「インデックス状況」セクションに含める
- 改善バックログの未完了施策（status != done）をアクションリストに反映（重複登録しない）

### 新規施策の登録
監査で新たに発見した改善施策は `.claude/todo/04_改善バックログ.md` に追記する（`improvement-triage` が status を管理する唯一の writer）。frontmatter/簡易表の行として tier・期日・target_metric を記録する（規約: `.claude/rules/docs-vs-issues.md`）。

## トーンと姿勢

- **データで語る**: 「たぶん改善できる」ではなく「順位 8 位・imp 2,400 → タイトル改善で CTR 3%→5% なら +48 clicks/月」
- **実行可能性を重視**: stats47 のスキル（`/page-data-batch`, `/generate-ai-content` 等）で実行できるアクションを優先
- **過剰な最適化を避ける**: 一人プロジェクトである現実を踏まえ、ROI の高い施策に絞る
- **優先度を明確に**: 全てを「重要」にしない。P0 は最大3件

## 推奨実行頻度

- **月次**: フルレポート（全領域）
- **隔週**: キーワード分析のみ（`--focus keywords`）
- **四半期**: `/pre-mortem` と合わせて実施

## サイト回遊グラフのルーティング

`.claude/todo/05_機能バックログ.md`の`KAIYU-HUB-01`を監査・実装するときは、
`reference/site-navigation-graph.md`を必ず読む。進捗と優先順位はTODO、node/edge、score、placement、
GA4 event、段階実装、受入条件はreferenceを正典とする。Phase 0は`--focus content`のread-only監査として実行し、
Phase 1以降へ自動的に進めない。

## 実証チェックリスト（監査結果を Issue/レポートに confirmed と書く前に必須）

参照: `.claude/rules/evidence-based-judgment.md`

- [ ] 検証コマンドを実行したか:
  - インデックス状況: `node .claude/scripts/gsc/url-inspection-daily.cjs` で URL 単位の coverageState / lastCrawlTime を取得（GSC impressions だけで「インデックス済み」と判定しない）
  - 本番 HTTP: `curl -A "Mozilla/5.0 (compatible; Googlebot/2.1)" -o /dev/null -w "%{http_code}\n" https://stats47.jp/<path>`
  - 構造化データ: 公式 Rich Results テスト（`https://search.google.com/test/rich-results?url=<URL>`）
- [ ] Google 検索仕様の主張は公式 URL（`developers.google.com/search/...`）を併記したか
- [ ] 「Low-Hanging Fruit（順位 4-20 位、imp 高）」の改善見込み計算に過去類似改善の実績を引用したか
- [ ] NG ワード（「のはず」「と思われる」「兆候」）を使っていないか
- [ ] 推奨アクションごとに「効果が出る検証コマンド + 検証期日」をセットで書いたか
- [ ] **「クロール済み未登録 / 検出未登録」を判断するときは GSC UI スナップショットだけでなく URL Inspection API の最新 lastCrawlTime を確認したか**

このチェック未満なら confirmed / done と書かない。draft / pending のままにすること。

## 参照

- `.claude/skills/analytics/fetch-gsc-data/SKILL.md` — GSC データ取得
- `.claude/skills/analytics/fetch-ga4-data/SKILL.md` — GA4 データ取得
- `.claude/skills/blog/discover-trends/sources/gsc.md` — GSC トレンド検出（`/discover-trends --source gsc`）
- `apps/web/src/app/sitemap.ts` — サイトマップ生成
- `apps/web/src/lib/structured-data/` — 構造化データ実装
- `apps/web/src/middleware.ts` — リダイレクト設定
- `apps/web/tests/e2e/seo/` — SEO 関連 E2E テスト
- `.claude/state/gsc/LATEST.md` / `.claude/state/metrics/gsc/history.csv` — SEO カバレッジ指標の数値推移（旧 D1 `seo_tracking` の代替）
- `.claude/todo/04_改善バックログ.md` — SEO 改善施策の管理（pending → in_progress → done。旧 D1 `seo_actions` の代替）
- `reference/site-navigation-graph.md` — `KAIYU-HUB-01`のサイト横断回遊グラフ・レコメンド実装詳細

## page_components の責務分離監査 (area / theme)

`/areas/*` は県軸・回遊面、`/themes/*` は 47 県横断の比較面。この責務が混ざると
どちらのページも中途半端になる (判定基準: `docs/01_技術設計/03_情報設計.md`)。

```bash
node .claude/scripts/audit/page-components-audit.cjs
```

git TS SSOT (`apps/web/scripts/data/page-components/<pageType>/<pageKey>.json`) を読み、
area / theme / area-category / city-category の配置を棚卸しして
`reference/audits/YYYY-MM-DD-area-theme-audit.md` に出す。ネットワーク不要・数秒。

**gate ではなく棚卸し**。「違反候補」は責務の混在を疑うシグナルであって自動確定ではなく、
採否は情報設計の判断が要る。CI に入れず `/seo-audit --focus content` の一部として人が回す。
