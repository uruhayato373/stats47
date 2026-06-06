---
type: backlog
category: feature
created: 2026-05-16
status: pending
---

# 機能開発バックログ (Tier-2/3)

未着手の機能開発タスク。優先度は tier で示す。実装着手時は section header に `[in-progress]` を付与、完了時に `[done]` + 完了日を追記。

---

## [pending] Phase 8: 既存記事チャートの dark mode 一括対応ツール

- **tier**: 3
- **status**: pending
- **created**: 2026-05-28
- **trigger**: 2026-05-28 ブログ品質監査で公開記事のチャート SVG 多数が dark mode 未対応と判明
- **概要**: `audit-chart-quality.mjs` が多数の公開記事で `darkModeMissing` / `themeColorInline` を検出。
  しかし `generate-article-charts.mjs` は (a) data ファイル命名が `*-prefecture-rankings.json` 等の
  パターンに一致する記事しか再生成できず、(b) これら公開記事の data は `fetched-*.json` 等の別命名 +
  scatter は未実装、のため再生成不能。既存 SVG に dark-mode CSS を後付け注入する専用ツールが必要
- **対象**: `.local/r2/app/blog/<slug>/data/*.svg` (公開記事の chart)
- **着手判断**: dark mode は CTR 主因でない (blog-quality-standards.md) ため優先度低。chart 品質を
  一斉に底上げしたいタイミングで
- **関連**: `.claude/scripts/blog/generate-article-charts.mjs` (2026-05-28 に `--base` 追加済、ただし命名問題は未解決)

## [pending] Phase 7: recompute-correlations 実装

- **tier**: 3
- **status**: pending
- **created**: 2026-05-28
- **trigger**: Phase 6 (D1 → R2 移行) 完遂、最終整理 PR にて未実装と確定
- **概要**: `.claude/skills/db/recompute-correlations/SKILL.md` の方針 (R2 stats → D1 temp → Pearson r → R2 snapshot → temp DROP) を `packages/correlation/src/scripts/recompute.ts` として実装
- **入力**: `app/stats/<metric>/values.json` (全 2,207 metric × 47 県)
- **出力**: `app/correlation/top-pairs.json`, `app/correlation/by-ranking-key/<key>.json`
- **着手判断**: 既存の相関 snapshot で運用継続可能なため、新規 metric 追加が増えて相関が陳腐化したタイミング
- **関連**: Phase 6.7 schema cleanup (packages/correlation の reader が `correlations` schema を import している、Phase 7 でまとめて refactor)

## [pending] Phase 7: stats_* schema + correlations schema 削除 + reader refactor

- **tier**: 3
- **status**: pending
- **created**: 2026-05-28
- **trigger**: Phase 6.7 で発覚: packages/ranking + packages/correlation + packages/area-profile の 12 ファイルがまだ `statsPrefecture` / `correlations` を import している
- **概要**:
  - `packages/database/src/schema/{stats-prefecture,stats-city,stats-port,stats-migration-flow,stats,correlations}.ts` 6 ファイル削除
  - schema index.ts の DEPRECATED export 行削除
  - 上記 12 reader を R2 fetch に切替 (参照: `packages/ranking/src/repositories/ranking-value/list-ranking-values.ts`)
  - `packages/database/scripts/{ingest-migration-flow,populate-port-statistics}.ts` + `packages/ranking/src/scripts/seed-city-ranking-items.ts` 削除
- **着手判断**: 現状 D1 にテーブルは無く、production が壊れた reader を呼ぶか確認。壊れている場合は緊急で対応
- **検証**: `npx tsc --noEmit -p apps/web/tsconfig.json` + 全 tsc clean
- **関連**: `~/.claude/plans/drifting-cuddling-blossom.md` の "C (DEFERRED)" セクション

## [pending] 122 metric (完全データ) の本番公開 — 生成パイプライン修復

- **tier**: 2
- **status**: pending
- **created**: 2026-06-04
- **trigger**: `feature/activate-122-ranking-metrics` が config `isActive:false→true` のみ変更し、本番公開に必要な派生リスト/snapshot 更新を欠いていた (2026-06-03 デプロイ時に判明)
- **概要**: 「完全データの ranking metric 122 件」を本番公開するには config(isActive:true) を起点に複数の派生物を整合再生成する必要があるが、DBレス移行 (Phase F) でパイプラインの一部が未配線/破損のまま残っていた
- **現状 (2026-06-03 時点・デプロイ済)**:
  - ✅ config `isActive:false→true` (PR #430, commit `9ac68552`)
  - ✅ `GONE_RANKING_KEYS` から 122 key 除去 (PR #431, commit `fc4c1f3b`)
  - ❌ 本番は依然 **410** (middleware `isGone(key) || !isKnown(key)` 判定: `middleware.ts:61`。122 が `KNOWN_RANKING_KEYS` に無いため `!isKnown` で 410)
- **本番公開に必要な手順 (依存順)**:
  1. R2 `app/ranking-items/all.json` + `app/ranking/<key>/item.json` を isActive:true で再生成
     → 生成器 `packages/ranking/src/scripts/generate-ranking-items.ts` は実装済だが **`.claude/skills/db/sync-snapshots/run.sh` に未配線**(旧 monolith exporter は Phase F で削除)。要 task 追加
  2. `apps/web/scripts/generate-known-ranking-keys.ts` で `KNOWN_RANKING_KEYS` 再生成 (R2 all.json を読む)
     → memory `project_dbless_migration_2026_05_29` に「known-keys スクリプトは破損済」記録あり。要修復
  3. `.claude/scripts/gsc/build-sitemap-ranking-keys.cjs` で `SITEMAP_RANKING_KEYS` 再生成
  4. `INDEXABLE_RANKING_KEYS` 再生成 (GSC pages.csv 依存・要方針)
  5. config 変更を develop→main 再デプロイ (middleware に新 KNOWN list を載せる)
  6. `gh workflow run purge-cdn.yml` で CDN 全パージ (410 は `s-maxage=604800` で 7 日エッジキャッシュ。ピンポイント purge の `--urls` input は purge-cdn.yml に無い)
  7. 本番 `https://stats47.jp/ranking/<key>` が 200 + sitemap 掲載を確認
- **122 key 一覧**: commit `9ac68552` (`packages/data-configs/src/metrics/*.ts` 122 files) / `fc4c1f3b` (`gone-ranking-keys.ts` の削除 122 行) を参照
- **データ前提**: 観測値 `app/stats/<key>/values.json` は R2 に存在確認済 (HTTP 200)。データは揃っている
- **着手判断**: GSC「クロール済み・インデックス未登録」再発リスク (過去 1,453 件) があるため、known 生成修復とセットで SEO 影響評価込みの独立 PR にする
- **中途半端状態の注意**: 122 は `GONE_RANKING_KEYS` から外れたが `KNOWN` にも無いため挙動は 410 のまま (実害なし)。本タスク着手までこの状態を維持。完全に元へ戻したい場合は PR #431 を revert

---

## [done] #129 [T2-AI-CONTENT-01] regional_analysis を UI に配線（または insights へ統合）

- **tier**: 2
- **status**: done (実装確認 2026-05-24)
- **related_issue**: #129 (closed)
- **完了**: `apps/web/src/app/ranking/[rankingKey]/page.tsx:388-392` で `regionalAnalysisSection` を `AiContentAccordion` (タイトル「地域別の傾向」) として配線済。DB の `aiContent?.regionalAnalysis` 内容が読者に届いている。

---

## [done] #131 [T2-CORR-UI-01] CorrelationSection UI 拡張（partial_r 表示 + scatter mini）

- **tier**: 2
- **status**: done (2026-05-25)
- **related_issue**: #131 (closed)
- **実装**:
  - `CorrelationSectionClient.tsx` に `ScatterMini` 内部コンポを追加 (60×36 px SVG、47 県 scatter、相関符号で色分け)
  - 各行に `(人口除外 {formatR(partial_r_population)})` を併記
  - ヘッダ補足文「r = 全体相関、(人口除外) = 人口の影響を控除した偏相関」を追加
- **データ**: R2 snapshot `app/correlation/by-ranking-key/<key>.json` に既存の `partialRPopulation` + `scatterData` (47 点) をそのまま消費
- **動作確認**: `http://localhost:3000/ranking/abortion-rate` で 10 SVG × 47 dots レンダリング確認 (HTTP 200)
- **次のステップ**: 案 ③ partial_r トグル UI / 案 ④ 解釈ラベル は別途検討 (本実装でデータの一部のみ可視化)

---

## [done] #292+ [T3-LOCAL-FINANCE-02] /themes/local-finance 市区町村別データ拡張（Japan Dashboard 完全互換）

- **tier**: 3
- **status**: done MVP (2026-05-25, 6 直接指標)
- **related**: PR #292（都道府県別 Phase 1）

### 実装内容 (2026-05-25)

**データ層 (D1 stats_city)**:
- ✅ e-Stat SSDS 市区町村版 `0000020204` (廃置分合処理済) から 4 指標 fetch + stats_city 投入:
  - `real-balance-ratio-city` (D2202): 57,392 行
  - `current-balance-ratio-city` (D2203): 35,447 行
  - `real-public-debt-service-ratio-city` (D2211): 24,333 行
  - `future-burden-ratio-city` (D2212): 12,150 行
- ✅ 既存 city 指標 2 件と統合 (6 指標カバー):
  - `fiscal-strength-index` (57,613 行)
  - `per-taxpayer-taxable-income` (56,913 行)
- ✅ Fetch スクリプト: `.claude/scripts/estat/fetch-city-local-finance.cjs`

**Indicator set**:
- ✅ `LOCAL_FINANCE_CITY_SET` (`packages/types/src/indicator-sets/local-finance-city.ts`) を定義 + registry 登録
- ✅ `LOCAL_FINANCE_CITY_THEME` を `apps/web/src/features/theme-dashboard/server.ts` で export

**R2 export**:
- ✅ `.claude/scripts/db/export-city-local-finance.cjs` で D1 → R2 形式変換 (243,848 行 → 6 metric の `item.json` + `values.json`)
- ⏸ 本番 R2 push は **本番デプロイ時** にユーザが実施 (`/push-r2 --prefix app/ranking/` で部分 sync 可能、または `/sync-snapshots` 全体)

**UI 層**:
- ✅ `load-theme-data.ts` を areaType 対応に拡張 (`options.areaType: "city"`)
  - city モードでは R2 から直接 `readRankingValuesFromR2(key, "city", yearCode)` で取得
  - topology は `fetchAllCitiesTopology` に切替
- ✅ 新規 page `/themes/local-finance/cities/page.tsx` 作成 (`LOCAL_FINANCE_CITY_THEME` を使用)
- ✅ 既存 `/themes/local-finance/page.tsx` に「市区町村」ナビゲーション追加 (相互リンク)
- ✅ 型チェック PASS

**動作確認 (localhost:3000)**:
- ✅ `/themes/local-finance` HTTP 200 (pref 維持、回帰なし)
- ✅ `/themes/local-finance/cities` HTTP 200 (全 6 指標が描画される、市区町村ラベル表示)

### 本番デプロイ手順 (ユーザ作業)

1. R2 push (6 metric の app/ranking/ 配下):
   ```bash
   for key in fiscal-strength-index real-balance-ratio-city current-balance-ratio-city real-public-debt-service-ratio-city future-burden-ratio-city per-taxpayer-taxable-income; do
     npx tsx packages/r2-storage/src/scripts/sync-upload.ts --prefix app/ranking/$key
   done
   ```
2. feature ブランチ → develop → main の PR で deploy
3. 本番 smoke: `curl -I https://stats47.jp/themes/local-finance/cities` で 200 確認

### 残作業 (Phase 2 で別途)

ratio 系 12 指標 (歳出割合 / 1人当たり等) は分子・分母から計算が必要。Phase 2 で計算 metric として実装:

| 指標 | 算出 | 必要なデータ |
|---|---|---|
| local-tax-ratio | D320101 / D3201 | 地方税 / 歳入総額 |
| local-allocation-tax-ratio | D320108 / D3201 | 地方交付税 / 歳入総額 |
| national-treasury-disbursement-ratio | D320113 / D3201 | 国庫支出金 / 歳入総額 |
| self-financing-ratio | D3202 / D3201 | 自主財源額 / 歳入総額 |
| personnel-expenditure-ratio | D320401 / D3203 | 人件費 / 歳出総額 |
| welfare-expenditure-ratio | D320303 / D3203 | 民生費 / 歳出総額 |
| education-expenditure-ratio | D320310 / D3203 | 教育費 / 歳出総額 |
| public-works-expenditure-ratio | D320308 / D3203 | 土木費 / 歳出総額 |
| per-capita-total-expenditure | D3203 / 人口 | 歳出総額 / 人口 |
| per-capita-inhabitant-tax | (住民税) / 人口 | - |
| taxpayer-ratio | 納税義務者数 / 人口 | - |
| laspeyres-index | local-public-employee-salary | 別ソース |


---

## [done] [T2-SNS-STATION-01] 駅別乗降客数バブルマップ動画（国土数値情報 S12）

- **tier**: 2
- **status**: done (Phase 1-5 全完了 2026-05-22、PR #328 マージ済、47連結 YouTube 動画 `wjLQCiuEeNI` public 公開済)
- **target**: SNS（X / YouTube 投稿用 16:9 / 縦長動画）
- **残タスク (運用)**: 47県×3フォーマットのフルバッチレンダー → /post-* 投稿、ランキング→アニメ地図の相互リンク、AI コンテンツ生成。詳細は memory `project_station_passengers`。

---

## [T2-RANKING-NORM-SSG-01] ranking 正規化派生 (人口10万人あたり等) の SSG 化 + SEO 対応

- **tier**: 2
- **status**: pending
- **created**: 2026-05-25
- **target_metric**: GSC clicks / impressions (normalization 派生 URL の indexing)

### 背景

`/ranking/[rankingKey]` ページには 2 系統の「表示基準切替」UI が並存している:

| 系統 | UI | 計算ソース | URL | SSG | SEO |
|---|---|---|---|---|---|
| pill (RankingHeroCard) | rounded-full ボタン | stats47 計算 (per_population / per_area / per_household) | `?norm=per_population` などの query param | ✗ (CSR 限定) | ✗ indexable 不可 |
| group toggle (RankingKeyPageClient) | テキストタブ | 別 metric (e-Stat 提供の「従業員1人あたり」「事業所1ヶ所あたり」等) | `/ranking/{別 rankingKey}` | ✓ | ✓ 別 page として indexed |

### 問題

1. **SEO 損失**: pill 切替の派生 (例: 「人口10万人あたり製造品出荷額」) は SSG 対象外で、検索エンジンに認識されない。同じ意味の e-Stat 由来派生 (「従業員1人あたり」) は別 rankingKey として SSG されており、indexing 状況が非対称。
2. **UI 混乱**: pill と group で「表示基準を変える」操作が縦に並ぶ。pill は CSR 限定、group は別 URL 遷移という挙動の違いがユーザーに見えない。
3. **データ重複**: pill 限定派生も group 由来派生も、本質的には「分子 / 分母 * scaleFactor」の同型計算。同じ概念が「どこから来たデータか」で UI / URL 設計が分かれている。
4. **意味バグ**: `total-population` (denominator key 自身) に per_population オプションが付いており「人口あたりの人口」という無意味な選択肢が pill に並ぶ。`isBaseMetric()` ガード追加前のデータが残存している (T3-RANKING-NORM-DATA-CLEAN-01 で対応)。

### 対応案

#### 案 A (推奨): pill 選択肢を SSG 化する route 拡張

- `app/ranking/[rankingKey]/page.tsx` の `generateStaticParams` に norm 種別を加え、`/ranking/{key}/{norm?}` のような route を生成
- canonical: 各 norm 毎に独自 URL、`<link rel="alternate">` で他 norm を関連付け
- sitemap.ts: 全 norm URL を含める (件数増、容量検討要)
- 内部リンク: ranking-items-by-category 等、関連 ranking 列挙ロジックで norm 派生を含めるか検討

工数: 中 (page.tsx の generateStaticParams / metadata / sitemap / 内部リンク全般)

#### 案 B: pill 派生を別 rankingKey に昇格 (group に一本化)

- `auto-attach-normalization.ts` の派生を、`metrics` テーブルの別 row として登録 (例: `manufacturing-shipment-amount-per-population` という新 key)
- 既存の group toggle 機構をそのまま使うため、UI 統合が容易
- 欠点: metric 数が 2-3 倍に膨らむ。snapshot 容量 / ビルド時間 / D1 行数の試算が必要

工数: 大 (DB 設計変更 + 既存 R2 スナップショット移行 + 旧 `?norm=` URL の 301)

#### 案 C: pill を維持しつつ canonical で吸収

- 現状の `?norm=` URL を canonical で元 URL に統合し、pill は CSR 限定の便利機能と割り切る
- 「人口10万人あたり製造品出荷額」のような検索クエリは諦める

工数: 小 (canonical タグの整備のみ)

### 関連

- 短期対応 (モバイル UI Select 化): claude/admiring-noether-HeeLC (2026-05-25)
- 派生計算ロジック: `packages/ranking/src/services/compute-normalization.ts`
- snapshot: `packages/ranking/src/exporters/ranking-normalized-values-snapshot.ts`
- denominator マップ: `WELL_KNOWN_DENOMINATORS` in compute-normalization.ts

---

## [T3-RANKING-NORM-DATA-CLEAN-01] denominator 系 metric から不適切な normalizationOptions を削除

- **tier**: 3
- **status**: pending
- **created**: 2026-05-25

### 背景

`total-population`, `total-area-*`, `households` 等の denominator として使われる metric に、自分自身の denominator を使う norm option が混入している。`isBaseMetric()` ガード追加 (`packages/ranking/src/utils/is-base-metric.ts`) 以前のデータが DB に残存。

### 例

- `total-population` の `calculation.normalizationOptions` に `per_population` (label: 「人口10万人あたり」) が含まれる → 「人口あたりの人口」で意味なし

### 対応

- `packages/ranking/src/scripts/` に cleanup CLI を追加 (`drop-invalid-norm-options.ts`)
- ロジック: `DENOMINATOR_KEYS` に該当する metric の `normalizationOptions` から、対応する `type` を除外
- 実行: `--dry-run` で対象確認 → `--apply` で DB 更新 → `/sync-snapshots` で R2 再生成

工数: 小

### 関連

- `packages/ranking/src/utils/is-base-metric.ts` DENOMINATOR_KEYS
- `packages/ranking/src/scripts/auto-attach-normalization.ts` (既存の自動付与スクリプト)

---

## [T2-REDESIGN-PHASE2] D-System Phase 2 — KPI Tile クリック化 + 本文中 NativeAffiliateRow

- **tier**: 2
- **status**: pending
- **created**: 2026-05-25
- **related**: PR #353 / #354 で Phase 1 完了済 (本前提)
- **master_plan**: `docs/02_実装計画/d-redesign-master-plan.md`
- **真実源**: `.claude/design-system/redesign/INDEX.md`

### 背景

D-System Phase 1 (PR #349-#354) で以下が完了:

- ✅ 共通プリミティブ作成 (`WidePageShell` / `RightRailWidgets` / `NextUpGrid`)
- ✅ Tailwind container 1700px 拡張 (全 50+ ページ自動適用)
- ✅ 5 ページに右サイドバー追加 (area / category / themes-index / tag + blog 3 カラム)
- ✅ home に NextUpGrid 追加
- ✅ ブログ機能改善 (α 3 カラム / コードブロック配色 / ふるさと納税 3 段ロジック / CSV ダウンロード R2 事前生成)

### Phase 2 で残っている改良

#### A. KPI Tile クリック可能化

各ページの暗色 hero 内 KpiTile を「クリック → 関連ランキング遷移」可能にする。

- 対象: `apps/web/src/features/redesign/components/KpiTile.tsx`
- 実装: `href?: string` prop を追加し、指定時は `<Link>` 内包
- 効果: 内部リンク密度 ↑ → GSC indexation 改善 + 回遊性 ↑
- 工数: 30 分 (primitive 変更 + 数ヶ所の call site 更新)

#### B. ブログ本文中 NativeAffiliateRow 周期挿入

公式 D 案 (`blog-option-d.jsx`) で実装されている「本文中ネイティブ広告 3 種」をブログ記事の H2 セクション毎に挿入。

- 候補:
  - ランキング CTA (記事に登場した rankingKey を抽出 → 関連 ranking へのリンクカード)
  - 書籍 3 冊横並びストリップ
  - AdSense in-feed
- 実装: `apps/web/src/features/blog/components/md-content.tsx` の `injectAdSlots()` 拡張、または `ArticleRenderer` 内で `h2` 検出して節間に挿入
- 工数: 2-3 時間

#### C. 関連書籍 `prose-pre` の CSS 微調整

PR #353 で `prose-pre:bg-slate-900` を導入したが、`dark:prose-invert` で dark mode に行ったときの再調整が未確認。

### 対応の判断基準

- A: 単独で完結。SEO 内部リンク密度の改善目的で先行実装が良い
- B: 工数中。記事の読み込み深度向上に効くが、広告密度が AdSense ポリシーに当たらないか検証必要
- C: dark mode 利用者が少なければ後回し可

---

## [T2-REDESIGN-PHASE3] D-System Phase 3 — A8.net 統合 + compare/search 実装

- **tier**: 2
- **status**: pending
- **created**: 2026-05-25

### 背景

Phase 1/2 完了後の最終フェーズ。外部サービスの契約や noindex ページの実装。

### 残作業

#### A. A8.net ふるさと納税アフィリエイト直契約

現状はある楽天 affiliate ID 経由。A8.net で「ふるさとチョイス」「さとふる」等を直契約する方が利益率高。

- マスタープラン § 9 参照
- 必要作業:
  - A8.net アカウント開設・該当プログラム加入申請
  - `apps/web/src/features/ads/components/FurusatoNozeiCard.tsx` を A8 直リンクに切替
  - 環境変数 (NEXT_PUBLIC_A8_FURUSATO_PROGRAM_ID 等) を Cloudflare Pages に設定
- 工数: 1-2 時間 (契約後の作業)

#### B. compare/search ページを D 案で実装

INDEX.md で `deferred` 扱いだが、サイト内利用ユーザー向け体験向上のため将来実装。
noindex のため SEO 流入は無いが、ブックマーク・直接アクセス・サイト内検索利用者向け。

- `/compare/[categoryKey]`: D 案 = Story Editorial + ふるさと納税 (2 県分)
- `/search`: D 案 = Discovery + ネイティブ収益
- プロトタイプ: `.claude/design-system/redesign/project/compare-option-d.jsx` / `search-option-d.jsx` を参照
- 工数: 各 2-3 時間

#### C. ~~CSV ダウンロード R2 事前生成の運用反映~~ → 廃止 (2026-06-01, PR #391)

**事前生成 (bake) は不採用に確定。** 全 ~2,169 metrics × 最大 8 ファイル ≈ 23K files / 1GB 超 /
CI 45 分 timeout となり、これは Phase 6 が download exporter を削除した理由 (R2 肥大化) そのものだった。
代わりに route `/api/ranking/[key]/download` で **オンザフライ生成** (R2 観測値 → `getRankingDownloadSeries`
→ build CSV、SJIS は iconv-lite 動的 import) に変更。運用タスク不要。詳細: memory
`project_ranking_download_onthefly` / `feedback_check_why_removed_before_reviving`。

#### D. 環境変数の本番設定

Cloudflare Pages env vars に以下を追加 (現状は未設定で内部 fallback 動作):

- `NEXT_PUBLIC_TECH_SCHOOL_AFFILIATE_URL`: Claude Code 副業講座 ASP URL
- `NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID`: 楽天アフィリエイト ID
- `NEXT_PUBLIC_RAKUTEN_APP_ID`: 楽天 API アプリ ID (ふるさと納税商品取得用)

### 関連

- マスタープラン: `docs/02_実装計画/d-redesign-master-plan.md`
- INDEX: `.claude/design-system/redesign/INDEX.md`

---

## [pending] コードベース最適化レビュー deferred 分 (T3 / T4 / T5-残 / T6-残)

- **tier**: 2-3
- **status**: pending
- **created**: 2026-06-02
- **trigger**: `docs/04_レビュー/critical-review/2026-06-01-codebase-optimization.md` の 6 軸監査。
  PR #414 で T1(reader factory)/T2(prefecture SSOT)/T5-a(raw 要素)/T5-b(Sankey)/T6-verified を実施。
  以下は影響範囲が広い or 設計判断/視覚検証を要するため deferred。
- **2026-06-02 追加着手分 (commit 履歴参照)**:
  - ✅ **T3**: ranking の `SourceConfig` → `SourceProvenance` 改名（名前衝突解消、2 file、serialized 列不変）完了。
  - ✅ **T5-残(Slider)**: MetricYoy の `<input type=range>` を既存 `Slider` に置換完了（Slider は既に components に存在）。
  - ✅ **T4 基盤**: `createMetric()` ファクトリ導入 + PoC 1 件移行（出力が元リテラルと byte 一致）。codemod 不要・段階移行可。
  - ✅ **T6 verified slice**: `CountUp`/`ScrollReveal`/`MobileNavigation` 削除（参照ゼロ個別確認）。
- **残タスク（引き続き deferred）— ★ROI 判断（2026-06-02 深掘り後）付き**:
  - **T4-残** (tier 3) — **推奨: やらない（基盤導入で実質完了扱い）**。`createMetric()` は導入済で**いつでも利用可**。残りの「2209 file 一括 codemod」は**挙動ゼロ変化なのに巨大 diff** を生むだけで、レビュー性・git 履歴を悪化させ利得は僅少。設計上の正解は**段階移行（新規 metric から createMetric を使う）**。registry 分割/SEO メタ分離は別途スケール律速が出たら検討。
  - **T3-残** (tier 2) — **低優先（任意）**。実害だった `SourceConfig` 名前衝突は修正済。`MetricConfig`/`YearSpec` の `@stats47/types` 一次源化は data-configs↔types の依存方向再設計（cycle 回避）を伴い、広範な import 改修の割に効果は控えめ。
  - **T5-残** (tier 3) — **低優先（任意）**。重複の実体だった fetch/fallback は `useFlowData`/`SankeyFallback`/`topNWithOther` に hook 化済。残る GenericSankey の JSX 全抽象化は利得わずか + 視覚回帰リスク（要 Playwright 目視）。
  - **T6-残** (tier 3) — **要オーナー判断（untangle PR）**。下記の半廃止整理。「単純 dead-code 削除」ではない。
    - `knip.config.ts` の Next.js entry を拡充済（sitemap/robots/manifest/opengraph-image/global-error/middleware/test.setup）。これで `config/test.setup.tsx` 等の明白な false-positive は解消。
    - しかし残る flagged の多くは **`/ports`・`/fishing-ports` ルートの半端な廃止**に起因。両ルートは 2026-05-28 (`709a704`) に `/themes` へ統合・middleware で 301 済 → **feature の UI（components/page）は orphan**。
    - **だが** `port-statistics`/`fishing-ports` の `lib`/型は **R2 export パイプラインがまだ使用**（`apps/web/scripts/export-fishing-ports-snapshot.ts` が `FishingPortData` を import、`sync-snapshots/run.sh` に残存）。→ **UI dead + データ層 live の混在**。blind 削除は export を壊す。
    - 正しい対処は「UI を消し、export が要る型だけ残す/移設」する**整理 PR**であり、`/themes` のデータフロー把握 + オーナー判断（旧 `app/ports`・`app/fishing-ports` snapshot を残すか）が前提。
    - また `r2-storage-design.md` の URL 表が `/ports`・`/fishing-ports` を live として記載しており **stale**（要更新）。
    - 結論: bulk 削除は不可。verified leaf（CountUp/ScrollReveal/MobileNavigation）のみ削除済。残りは半廃止の untangle が本質。
- **着手判断**: いずれも単独 PR + `next build` の SSG 区分確認を伴う規模。
- **関連**: `docs/04_レビュー/critical-review/2026-06-01-codebase-optimization.md` (§実施状況 / deferred 理由)
