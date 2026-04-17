# GSC 改善記録

Google Search Console のインデックス問題を時系列で追跡する記録簿。
更新ルールは `../SKILL.md` を参照。

- **プロパティ**: `sc-domain:stats47.jp`
- **本番 URL**: `https://stats47.jp`
- **開始日**: 2026-04-14

---

## 1. Baseline

**取得日**: 2026-04-10
**ソース**: `gcsエラー/重大な問題.csv`, `gcsエラー/平均読み込み時間のチャート.csv`

### カテゴリ別件数

| カテゴリ | 件数 | ソース | 備考 |
|---|---|---|---|
| 見つかりませんでした (404) | 5,661 | ウェブサイト | 2026-01-13 の 3,976 から +1,685 増加中 |
| サーバーエラー (5xx) | 2,047 | ウェブサイト | 要 URL pattern 特定 |
| クロール済み - インデックス未登録 | 2,339 | Google システム | 類似テンプレート量産が主因の疑い |
| ページにリダイレクトがあります | 2,308 | ウェブサイト | 内部リンク or www 履歴の累積 |
| 検出 - インデックス未登録 | 1,536 | Google システム | クロール予算不足 |
| 代替ページ (canonical 適切) | 920 | ウェブサイト | 意図通り |
| noindex により除外 | 592 | ウェブサイト | 意図通り |
| 重複 (user canonical 無し) | 531 | ウェブサイト | 未調査 |
| ソフト 404 | 506 | ウェブサイト | survey/category の空状態が発生源 |
| robots.txt によりブロック | 61 | ウェブサイト | 意図通り |
| 重複 (Google が別 canonical 選択) | 51 | Google システム | 優先度低 |

### インデックス登録トレンド（`平均読み込み時間のチャート.csv`）

| 日付 | 未登録 | 登録済み |
|---|---|---|
| 2026-01-13 | 10,437 | 4,577 |
| 2026-02-15 | 10,674 | 3,999 |
| 2026-03-15 | 13,708 | 1,910 |
| 2026-04-10 | **16,552** | **1,808** |

**決定的な悪化**: 3 ヶ月で登録済み **-60%** (4,577 → 1,808)、未登録 **+59%** (10,437 → 16,552)。
原因仮説: クロール予算枯渇 + 類似ページ（/areas/{code}/{category} 611 件）の品質評価低下による自動 noindex 化。

---

## 2. Action Log

### Phase 1 — middleware レベルの 404/410 対策

**日付**: 2026-04-14
**コミット**: `0fdab9dd` (`fix: GSC 問題の恒久対策（Phase 1+2: 404/410/soft404/5xx/クロール予算）`)
**ESLint 追従**: `2784b1d2`

#### 変更内容

- `apps/web/src/middleware.ts`:
  - `gone()` ヘルパー新設。全 410 応答に `Cache-Control: no-store, must-revalidate` 付与
  - `isValidPrefCode()` ヘルパー（export 済）で 01〜47 末尾 000 を厳密判定
  - `/ranking/prefecture/{slug}` → 301 `/ranking/{slug}` or 410 の分岐追加
  - 無効 prefCode (00000 等) の 301→410 チェーンを直接 410 に短絡
  - `/tag/{英語slug}` で `GONE_TAG_KEYS` を参照して 410
- `apps/web/src/config/gone-tag-keys.ts`: 新規作成（空 Set、今後追加運用）
- `apps/web/src/__tests__/middleware.test.ts`: `isValidPrefCode` 単体テスト 4 件

#### 想定効果

- 404: middleware で 410 を返す URL の Cloudflare キャッシュ競合を解消
- リダイレクトがあります: `/ranking/prefecture/*` 系が 404 ではなく 301 で正しく処理されるようになる

### Phase 2 — ソフト 404 / 5xx 発生源 + クロール予算回復

**日付**: 2026-04-14
**コミット**: `0fdab9dd` (Phase 1 と同時コミット)

#### Tier 1: 発生源除去

- `apps/web/src/app/survey/[surveyKey]/page.tsx` L165: 空状態を `notFound()` 化
- `apps/web/src/app/category/[categoryKey]/page.tsx` L165: 同上
- `apps/web/src/app/global-error.tsx`: 新規作成。ルートレベル例外の統一ハンドラ
- `apps/web/src/app/robots.ts`: `/api/*` を Disallow 追加（Googlebot から隔離）
- `apps/web/src/app/api/blog-data/[...path]/route.ts`: catch 500 → 404

#### Tier 2: クロール予算回復

- `apps/web/src/lib/indexable-area-categories.ts`: **13 → 2** に削減（`population`, `economy` のみ）
  - sitemap の area-category URL が **611 → 94**（-517、sitemap 全体の約 35%）
  - 非 indexable カテゴリは `generateMetadata` で自動的に `noindex, follow`
- `apps/web/src/app/tag/[tagKey]/page.tsx`: 記事 < 2 本なら `noindex, follow`
- `apps/web/src/app/sitemap.ts`: tag 抽出を `HAVING COUNT(*) >= 2` にフィルタ
- `apps/web/src/app/compare/[categoryKey]/page.tsx`: 全面 `noindex, follow`
- `apps/web/src/app/sitemap.ts`: `/compare` / `/compare/{key}` 全除外

#### 想定効果

- ソフト 404: 506 → 減少（survey/category の 2 発生源除去）
- 5xx: 2,047 → 一部減少（`/api/*` Disallow + blog-data 500→404 で Googlebot 由来の 5xx カウント減）
- クロール済み - インデックス未登録: 2,339 → 大幅減少予測（area-category 611→94）
- 検出 - インデックス未登録: 1,536 → 減少予測（sitemap URL 総数 -35% で予算回復）
- 登録済みページ: 1,808 → 回復予測

### Cloudflare 側の設定（ユーザー実施）

**日付**: 2026-04-14

- SSL/TLS → Edge Certificates → **"Always Use HTTPS" ON** 確認済
- Caching → Cache Rules → **"Cache HTML pages"** (host = stats47.jp) に以下を追加:
  - エッジ TTL: 元の「キャッシュ制御ヘッダーを無視、1 日」は維持
  - ステータスコード TTL: **404 / 410 / 5xx を bypass（キャッシュしない）**
  - オリジンエラーページのパススルー: ON
- デプロイ後 **Purge Everything** 実施

---

## 3. Observation Log

施策適用後の数値トレンドを時系列で記録する。**1 行追記でも OK**、長文は不要。

| 日付 | 404 | 5xx | ソフト404 | クロール済み未登録 | 検出未登録 | リダイレクト | 登録済み | 未登録 | 備考 |
|---|---|---|---|---|---|---|---|---|---|
| 2026-04-10 | 5,661 | 2,047 | 506 | 2,339 | 1,536 | 2,308 | 1,808 | 16,552 | **Baseline** |
| 2026-04-17 | 5,727 | 2,044 | 500 | 2,415 | 1,394 | 2,305 | 1,860 | 16,628 | **MID**: Phase 1+2 デプロイから 3 日。登録済み/未登録は 2026-04-13 時点（GSC 遅延）。差分: 404 +66、クロール済み未登録 +76、検出未登録 -142、登録済み +52。アラート閾値（登録済み ≤ -10% / 404 ≥ +5% / 5xx ≥ +20%）非発火 |

### 2026-04-14 記述 — Phase 1+2 デプロイ
- 本日 `2784b1d2` を main にマージ・デプロイ
- Cloudflare Purge Everything 実施済
- GSC「修正を検証」は各レポートで順次押下予定
- 次回 FINAL 観測: **2026-04-28 頃**（デプロイ +14 日、SEO 効果測定可能日）

### 2026-04-17 記述 — MID 中間観測
- GSC 手動 export を取り込み (`~/Downloads/stats47.jp-Coverage-2026-04-17/` → `gcsエラー/`)
- 検出未登録 -142（sitemap URL 611→94 の効果が早期に反映）、登録済み +52 の兆候
- 404 +66、クロール済み未登録 +76 は未浸透範囲（MID ラベル）
- アラート非発火、2026-04-28 の FINAL 観測まで静観

---

## 4. Next Actions

優先度順。実施したら Action Log に移動し、ここから削除する。

### Tier 3 — 観測後の調査系

#### [N7] Downloads 自動取り込み動作確認

**ソース**: `/fetch-gsc-data snapshot YYYY-Www` 実行時のログ
**目的**: 2026-04-17 に追加した Downloads 自動取り込みロジックが週次で安定動作するか確認
**着手条件**: 2026-04-24 or 2026-W17 の週次レビューで初めて自動実行される
**合格条件**:
- `~/Downloads/stats47.jp-Coverage-YYYY-MM-DD/` を検出してログ `[downloads] ... copied from ...` を出す
- `snapshots/YYYY-Www/index-coverage.csv` と `index-trend.csv` が生成される
- 冪等性（2 回実行しても副作用なし）
成功したら本エントリを削除する

#### [N1] 5xx の URL pattern 特定

**ソース**: Cloudflare dashboard → Workers & Pages → stats47-dev → Logs → Sample Logs で `status=500` フィルタ
**目的**: `/api/*` Disallow 後も残る 5xx の実体を特定
**候補**:
- `apps/web/src/app/sitemap.ts` の全 DB 取得で D1 レイテンシにより 30 秒 timeout
- `apps/web/src/app/ranking/[rankingKey]/page.tsx` の 47 都道府県集計
- R2 フェッチ依存の重い SSR ページ

#### [N2] 「ページにリダイレクトがあります 2,308 件」の per-URL 精査

**ソース**: GSC レポート → 該当カテゴリを開く → 右上「エクスポート」→ CSV ダウンロード → `gcsエラー/表.csv` に配置
**目的**: sitemap 内の URL か、内部リンクハードコードか、www→apex 履歴かを特定
**着手条件**: 表.csv の全量 URL が揃ってから

#### [N3] 重複 (user canonical 無し) 531 件の原因調査

**目的**: canonical 不整合パターンを特定
**候補**:
- `/compare/*` の searchParams 膨張（Phase 2 で noindex 化済なので自動的に減る見込み）
- `/ranking/{key}?year=...` の canonical が年度無視で複数 URL が同じ canonical を指す

#### [N4] `/tag/` の死 slug を `GONE_TAG_KEYS` に一括登録

**ソース**: GSC の 404 レポートから `/tag/{英語slug}` を抽出
**着手条件**: URL 単位の CSV が提供された時点
**手順**:
1. `/tmp/classify-tag-404.ts` スクリプトで 404 URL から slug 抽出
2. 現行 DB の `articleTags.tagKey` と突き合わせて欠落 slug を特定
3. `apps/web/src/config/gone-tag-keys.ts` に追加

#### [N5] `GONE_RANKING_KEYS` に廃止済みランキングを追加

**ソース**: GSC の 404 レポートから `/ranking/{slug}` を抽出
**着手条件**: URL 単位の CSV が提供された時点
**手順**: N4 と同様のフロー

### Tier 2 — 戦略判断系（観測結果次第）

#### [N6] `INDEXABLE_AREA_CATEGORIES` を 2 → 再拡張するかの判断

**判断基準**:
- 2026-04-28 頃の観測で登録済みページ数が回復しているか
- 「クロール済み - インデックス未登録」が減少しているか
- 効果ありなら `educationsports`, `socialsecurity` 等を追加で再開
- 効果なしなら現状維持 or さらに絞る

---

## 付録: GSC データ取得ガイド

### 手動エクスポート手順

1. [Google Search Console](https://search.google.com/search-console) にログイン
2. プロパティ `sc-domain:stats47.jp` を選択
3. 左メニュー → 「インデックス作成」 → 「ページ」
4. 上部「未登録」タブ → 各カテゴリをクリック
5. 右上「エクスポート」 → CSV → ダウンロード
6. プロジェクトルートの `gcsエラー/` ディレクトリに配置
   - ファイル名: `表.csv`（URL 単位）/ `重大な問題.csv`（集計）/ `平均読み込み時間のチャート.csv`（トレンド）

### API 取得（`/fetch-gsc-data` スキル）

検索パフォーマンス系データ（クエリ・ページ別クリック）は `/fetch-gsc-data` スキルで取得。
ただし **「ページインデックス登録」レポート（本スキルが追跡する対象）は Search Console API では取得不可**。
GSC 画面からの手動エクスポートが唯一のソース。
