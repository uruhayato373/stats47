---
name: seo-audit
description: stats47.jp の SEO 総合監査。GSC/GA4 実データ + サイト構造 + DB を分析し、改善アクションを優先度付きで出力する。
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

### Phase 1: データ収集（並列サブエージェント）

4つのサブエージェントを**同時に起動**する。

#### Agent A: GSC パフォーマンスデータ

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
- ページ種別ごとの集計（/ranking/, /areas/, /blog/, /correlation/, /compare/, その他）
- 上位クエリ 50 件（clicks 順）

#### Agent B: GA4 トラフィックデータ

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

#### Agent C: サイト構造・技術監査

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

#### Agent D: DB からコンテンツ規模の把握

```bash
DB=".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
sqlite3 "$DB" "
  SELECT '公開記事' as item, COUNT(*) as cnt FROM articles WHERE published = 1
  UNION ALL SELECT '下書き記事', COUNT(*) FROM articles WHERE published = 0
  UNION ALL SELECT 'ランキング項目(都道府県)', COUNT(*) FROM ranking_items WHERE area_type='prefecture'
  UNION ALL SELECT 'ランキング項目(市区町村)', COUNT(*) FROM ranking_items WHERE area_type='city'
  UNION ALL SELECT 'カテゴリ', COUNT(*) FROM categories
  UNION ALL SELECT 'サブカテゴリ', COUNT(*) FROM subcategories
  UNION ALL SELECT 'AI コンテンツ', COUNT(*) FROM ranking_ai_content
  UNION ALL SELECT '相関分析ペア', COUNT(*) FROM correlation_analysis
  UNION ALL SELECT '地域プロファイル', COUNT(*) FROM area_profiles
"

# ranking_items で ranking_data が 0 件のもの（データ未投入）
sqlite3 "$DB" "
  SELECT ri.ranking_key, ri.title
  FROM ranking_items ri
  LEFT JOIN (SELECT ranking_key, COUNT(*) as cnt FROM ranking_data GROUP BY ranking_key) rd
    ON ri.ranking_key = rd.ranking_key
  WHERE ri.area_type = 'prefecture' AND (rd.cnt IS NULL OR rd.cnt = 0)
  LIMIT 20;
"

# AI コンテンツ未生成のランキング
sqlite3 "$DB" "
  SELECT ri.ranking_key, ri.title
  FROM ranking_items ri
  LEFT JOIN (SELECT ranking_key, COUNT(*) as cnt FROM ranking_ai_content GROUP BY ranking_key) rac
    ON ri.ranking_key = rac.ranking_key
  WHERE ri.area_type = 'prefecture' AND (rac.cnt IS NULL OR rac.cnt = 0)
  LIMIT 20;
"
```

出力形式:
- コンテンツ規模の全体像
- データ欠損のあるランキング項目
- AI コンテンツ未生成のランキング項目

### Phase 2: 分析（6つの観点）

Phase 1 のデータを統合し、以下の6観点で分析する。

#### 2-1. インデックス状況とカバレッジ

- **サイトマップ URL 数 vs GSC インデックス数の乖離**
  - ランキングページ: DB の ranking_items 数 vs GSC で impressions > 0 のランキング URL 数
  - ブログ記事: DB の公開記事数 vs GSC で impressions > 0 のブログ URL 数
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

`docs/03_レビュー/seo-audit/YYYY-MM.md` に保存する。

ディレクトリが存在しない場合は作成する。

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

`docs/03_レビュー/seo-audit/` に過去のレポートがある場合:
- 前回のアクションリストの実行状況を確認
- 主要指標の推移を記載（トラフィック・インデックス率・順位）
- 前回 P0/P1 で未実行のアクションは今回も引き継ぐ

## トーンと姿勢

- **データで語る**: 「たぶん改善できる」ではなく「順位 8 位・imp 2,400 → タイトル改善で CTR 3%→5% なら +48 clicks/月」
- **実行可能性を重視**: stats47 のスキル（`/register-ranking`, `/generate-ai-content` 等）で実行できるアクションを優先
- **過剰な最適化を避ける**: 一人プロジェクトである現実を踏まえ、ROI の高い施策に絞る
- **優先度を明確に**: 全てを「重要」にしない。P0 は最大3件

## 推奨実行頻度

- **月次**: フルレポート（全領域）
- **隔週**: キーワード分析のみ（`--focus keywords`）
- **四半期**: `/pre-mortem` と合わせて実施

## 参照

- `.claude/skills/analytics/fetch-gsc-data/SKILL.md` — GSC データ取得
- `.claude/skills/analytics/fetch-ga4-data/SKILL.md` — GA4 データ取得
- `.claude/skills/blog/discover-trends-gsc/SKILL.md` — GSC トレンド検出
- `apps/web/src/app/sitemap.ts` — サイトマップ生成
- `apps/web/src/lib/structured-data/` — 構造化データ実装
- `apps/web/src/middleware.ts` — リダイレクト設定
- `apps/web/tests/e2e/seo/` — SEO 関連 E2E テスト
- `docs/03_レビュー/seo-audit/` — 過去の監査レポート
