---
type: implementation-plan
status: design-approved-pending-phase-1
created: 2026-05-23
updated: 2026-05-23
target_phase: 100x Phase 1 (2026-W29 〜 W44)
related_files:
  - docs/02_実装計画/100x-pv-strategy.md
  - docs/05_改善ログ/indexing.md  # P0-CITIES-DIAG section
  - apps/web/src/app/areas/[areaCode]/cities/[cityCode]/page.tsx
  - apps/web/src/app/areas/[areaCode]/cities/[cityCode]/[categoryKey]/page.tsx
  - packages/area-profile/  # 既存 prefecture profile を city にも拡張するベース
---

# 市区町村ページ復活戦略 (100x Phase 1 主軸)

> P0-CITIES-DIAG の成果物。100倍 PV 戦略 Phase 1 (W29 〜 W44) の中核投資判断材料。

## Executive Summary

- **資産**: 2,701 市区町村 × 162 metrics = 186 万行の統計データが D1 にある
- **現状**: 25,785 URL が公開済みだが GSC indexed **21 / 25,785 (0.08%)**、impressions 33、clicks 0
- **真因**: city pages は実質**空のプレースホルダー** (タイトル + ナビのみ)、`generateStaticParams() returns []` で動的レンダ、sitemap からも除外中
- **データはあるが UI に出てない** → Phase 1 で「データ表示 + SSG 化 + sitemap 段階追加」を実施し、Phase 1 倍率 ×4 (38K → 150K PV/月) の主要寄与施策にする

---

## 1. 現状診断 (2026-W21 実測)

### 1.1 D1 のデータ状況

| テーブル | 行数 | 内容 |
|---|---|---|
| `cities` | 2,701 | 市区町村マスタ (code, name, prefecture_code) |
| ~~`stats_city`~~ → R2 `app/stats/<metric>/cities.json` | 1,866,054 (DROP 済) | 市区町村別統計。Phase 6 (2026-05-27) で D1 から R2 移行済 |
| city × metric カバレッジ | 2,701 × 162 = ~437,562 | 1 市につき平均 692 行 (複数年度含む) |
| `area_profiles` (city rows) | **0** | 県のみ 18,460 行、city profile 未生成 |

### 1.2 既存ページ実装

| ファイル | 機能 | 問題点 |
|---|---|---|
| `apps/web/src/app/areas/[areaCode]/cities/[cityCode]/page.tsx` | 市町村 top | h1 + サブタイトル + カテゴリナビのみ。**統計データ表示 0**。`generateStaticParams() returns []` |
| `apps/web/src/app/areas/[areaCode]/cities/[cityCode]/[categoryKey]/page.tsx` | 市町村×カテゴリ | AreaDashboardSection でチャート表示。**こちらは内容あり** |

### 1.3 R2 の状況

| キー | 状態 |
|---|---|
| `app/areas/{prefCode}/profile.json` | ✅ 47 ファイル (prefecture profile) |
| `app/areas/{prefCode}/cities/{cityCode}/profile.json` | ❌ 不存在 (本提案で生成) |
| `app/areas/{prefCode}/cities/{cityCode}/{categoryKey}/*.json` | ✅ 部分的に存在 (city-category subpage 用) |

### 1.4 GSC 状況 (2026-W21 snapshot)

- 市区町村 URL: GSC に出ているのは **21 件**、impressions 33、clicks 0
- 平均 impressions/URL = 1.5/週
- 比較: /blog 78% indexed、/ranking 40% indexed、市区町村 0.08% indexed

**結論**: ページの content quality が極端に薄いため、Google が「インデックスする価値なし」と判定。

---

## 2. 復活戦略

### 2.1 基本方針

> **「データ表示 + SSG 化 + sitemap 段階追加」の 3 本柱で、Top 500 都市を 4 週間で indexed 化する**

3 つの柱を同時並行で進めるのではなく、**1 → 2 → 3 を順次** 実行。1 で結果が出るまで 2 は本格着手しない (リスク管理: 低品質ページの大量公開で site-wide ranking を下げないため)。

### 2.2 段階導入計画 (Phase 1 内)

| Stage | 期間 | 対象都市 | sitemap | 検証指標 | GO/NO-GO |
|---|---|---|---|---|---|
| **S1: パイロット** | W29-W30 | 政令指定都市 20 + 中核市 60 = **80 都市** | 追加 | 4 週後 indexed 50+ 件 | indexed ≥ 60% で S2 GO |
| **S2: 拡大** | W31-W34 | 普通市 (人口 5 万以上) **420 都市** | 段階追加 (週 100) | 8 週後 indexed 250+ | indexed ≥ 60% で S3 GO |
| **S3: 全域** | W35-W44 | 残り **2,201 都市** | 全追加 | 12 週後 indexed 1,200+ (全 2,701 中 60%) | — |

S1 で indexed 率 60% 達成失敗の場合: 品質テンプレを再設計、S2 は遅延。

### 2.3 品質テンプレート (各 city page の必須要素)

city profile ページ (`/areas/{prefCode}/cities/{cityCode}`) に以下を順に配置:

```
1. Hero
   - h1: "{市町村名}の統計データ｜{県名}｜{TOP指標} 全国{N}位"
   - サブタイトル: 県名 + 人口 + 面積
   - 推定 SEO ボリューム: city name + "ランキング" or "統計"

2. 強み (この市の上位指標 5 件)
   - 各 metric の bar chart (この市 vs 県平均 vs 全国平均)
   - クリックで /ranking/{key} へ

3. 弱み (この市の下位指標 5 件)
   - 同上

4. 統計カテゴリナビ
   - 既存の CategoryNavGrid を再利用 (人口・経済・教育など 17 カテゴリ)

5. 同県内の類似都市 (人口規模が近い上位 5 件)
   - 内部リンク強化

6. 親県へのリンク
   - "{県名}の統計データ全体を見る" → /areas/{prefCode}

7. 出典・更新日
```

**最低品質基準** (Stage GO の前提):
- 1 ページ最低 1,500 文字相当 (構造化データ含む)
- 6 チャート以上
- 内部リンク ≥ 10 (parent / siblings / categories / rankings)
- structured data: `BreadcrumbList`, `Place`, `Dataset`

### 2.4 R2 キーパス設計

| データ | R2 キー | 生成ソース |
|---|---|---|
| city profile (strengths/weaknesses) | `app/areas/{prefCode}/cities/{cityCode}/profile.json` | R2 `app/stats/<metric>/cities.json` から batch 生成 (Phase 8 で実装予定、現状 run-batch-city-profile.ts は Phase 7 で削除済) |
| city ↔ city 比較データ (類似都市) | `app/areas/{prefCode}/cities/{cityCode}/similar.json` | 同県内 + 人口近似で算出 |
| 既存 (city-category) | `app/areas/{prefCode}/cities/{cityCode}/{categoryKey}/...` | 既存維持 |

### 2.5 batch service 設計

既存の `packages/area-profile/src/services/run-batch-area-profile.ts` を拡張:

```typescript
// 新規: packages/area-profile/src/services/run-batch-city-profile.ts
// (注: Phase 7 (2026-05-28) で初版 service + scripts/run-batch-city.ts を削除済。
//  Phase 8 で R2 fetch 版として再実装予定)
// - cities テーブルから 2,701 cityCode を取得
// - 各 city について R2 `app/stats/<metric>/cities.json` から data を集めて
//   extractStrengthsAndWeaknesses を実行 (rank>=1 フィルタ済)
// - area_profiles テーブルに area_type='city' として INSERT
// - 既存 prefecture batch と並走可能 (UNIQUE INDEX で衝突なし)
```

実行コマンド: `npm run batch:city --workspace=@stats47/area-profile`

### 2.6 R2 export 設計

既存の `packages/area-profile/src/exporters/area-profile-snapshot.ts` を拡張:

```typescript
// 新規 export 関数を追加
// - area_profiles WHERE area_type='city' を 2,701 cities に対して
//   各 `app/areas/{prefCode}/cities/{cityCode}/profile.json` に書き出す
// - 既存 prefecture export とは別の export 関数として呼び分け
```

### 2.7 page.tsx 改修

`apps/web/src/app/areas/[areaCode]/cities/[cityCode]/page.tsx`:

```typescript
// 1. generateStaticParams を [] → Stage S1 (80 cities) → S2 (500) → S3 (2,701) と段階拡大
//    Stage 移行は環境変数 NEXT_PUBLIC_CITY_SSG_STAGE で制御 (1/2/3)
//    NOT_STAGED な city は dynamic (SSR) のまま、indexed 対象外
export function generateStaticParams() {
  const stage = parseInt(process.env.CITY_SSG_STAGE ?? "0", 10);
  if (stage === 0) return [];
  return getCitiesInStage(stage); // Stage 別の cityCode リスト
}

// 2. profile.json を R2 から読み込む
//    rank>=1 フィルタは extract-strengths-and-weaknesses で既に対応済 (今日のバグ修正)
const profile = await readCityProfileFromR2(prefCode, cityCode);

// 3. profile.strengths + profile.weaknesses をレンダリング
//    既存 AreaProfilePageClient を再利用 (componentが prefecture/city 両対応)
```

### 2.8 sitemap.ts 改修

`apps/web/src/app/sitemap.ts`:

```typescript
// 既存: 市区町村は意図的に sitemap から除外
// 新規: Stage 別で段階追加
const STAGE_1_CITIES = [...]; // 80 都市 (政令市 + 中核市)
const STAGE_2_CITIES = [...]; // 500 都市
const STAGE_3_CITIES = [...]; // 全 2,701 都市

function getCitiesToInclude(): string[] {
  const stage = parseInt(process.env.CITY_SITEMAP_STAGE ?? "0", 10);
  if (stage >= 3) return STAGE_3_CITIES;
  if (stage >= 2) return STAGE_2_CITIES;
  if (stage >= 1) return STAGE_1_CITIES;
  return [];
}
```

### 2.9 内部リンク強化

- **parent 都道府県ページ**: `/areas/{prefCode}` に「主要都市の統計」セクション追加 (5-10 都市へリンク)
- **city-level ranking ページ**: `/ranking/{cityRankingKey}` (例: cpi-regional-difference-index-food-51cities100) のテーブルから city pages へリンク (今日の RankingDataTable 変更で既に対応済)
- **prefecture ranking ページ**: prefecture-level ranking では city link は不要 (既存仕様維持)

---

## 3. 想定効果 (Phase 1 ×4 の主要寄与)

### 3.1 ベース仮説

- **[仮説]** Stage S3 (全 2,701 都市) 完了で indexed 1,200-1,500 件 (60% 達成)
- **[仮説]** 1 indexed URL あたり月 5-10 PV (city × statistic ニッチクエリ流入)
- → **月 +6,000 〜 +15,000 PV** 追加

### 3.2 Phase 1 全体への寄与

| 寄与源 | 月 PV 追加 |
|---|---|
| Stage S3 city pages (indexed 1,200) | +6,000 〜 +15,000 |
| city-category subpages (既存、SSG 化で indexed 増) | +3,000 〜 +6,000 |
| 内部リンク経由の prefecture / ranking 強化 (halo effect) | +2,000 〜 +5,000 |
| **Phase 1 全体での city 関連寄与** | **+11,000 〜 +26,000** |

Phase 1 目標 38K → 150K (+112K) の **10-25% をこの施策で確保**。

### 3.3 根拠データ

- /blog インデックス率 78% を上限と仮定 → 2,701 × 0.6 = 1,620 程度が現実的上限
- 「東京都 渋谷区 統計」「札幌市 人口」など city + 統計クエリは検索ボリュームが堅実
- todo-ran や uub には city 個別ページがなく、競合不在の領域

---

## 4. リスクと対処

| リスク | 影響 | 対処 |
|---|---|---|
| 低品質ページ大量公開で site-wide ranking ダウン | -30% PV (致命的) | 段階導入 (S1=80 で 4 週検証してから拡大)。品質テンプレ厳守 |
| Cloudflare Pages build 時間が長大化 | デプロイ遅延 | SSG 対象を段階導入。Stage 別の generateStaticParams で制御。最終 2,701 ページなら ~6-8 分追加見込み |
| R2 ストレージ増加 (2,701 ファイル × 約 5KB = ~13MB) | 軽微 | 無視可能 |
| city が動的 rendering のまま (SSG されない) | indexed されない | generateStaticParams + R2 snapshot 必須化 |
| データ更新時の R2 同期遅延 | データ古い | 既存 `/sync-snapshots` フローに統合 |
| Stage 内の URL に低品質ページが混入 | -20% PV | Stage 移行前に「全 city page が品質テンプレ準拠か」を automated check |

---

## 5. 完了判定基準 (Phase 1 全体での Cities revival)

- [ ] Stage S1 完了: 80 都市が SSG 化 + sitemap 追加 + 4 週後 indexed ≥ 50
- [ ] Stage S2 完了: 500 都市が SSG 化 + 8 週後 indexed ≥ 250
- [ ] Stage S3 完了: 2,701 都市が SSG 化 + 12 週後 indexed ≥ 1,200
- [ ] 月間 PV: city 関連で +10K 以上 (4 週連続観測)
- [ ] site-wide CTR / position が悪化していない (副作用検証)

---

## 6. 実装ロードマップ (Phase 1 W29 〜 W44)

| Week | 作業 | 成果物 |
|---|---|---|
| W29 | city profile batch service 実装 | `packages/area-profile/src/services/run-batch-city-profile.ts` |
| W29 | city profile R2 exporter 実装 | `packages/area-profile/src/exporters/city-profile-snapshot.ts` |
| W30 | city page.tsx を profile レンダリングに改修 + generateStaticParams (S1) | 80 都市の SSG ビルド成功 |
| W30 | sitemap.ts S1 追加 + `/deploy` | S1 deploy 完了 |
| W30-W33 | S1 観測 (毎週 GSC snapshot で indexed 件数を追跡) | 4 週後判定 |
| W34 | S1 OK なら S2 設定変更 + deploy | S2 deploy 完了 |
| W34-W37 | S2 観測 | 8 週後判定 |
| W38 | S2 OK なら S3 設定変更 + deploy | S3 deploy 完了 |
| W38-W44 | S3 観測 + 内部リンク追加調整 | Phase 1 完了判定 |

---

## 7. 関連 TODO の更新

本設計書完成により、以下の改善ログ TODO を更新:

- `docs/05_改善ログ/indexing.md` **[P0-CITIES-DIAG]** → status: completed, **設計書リンク追加**, **次の TODO**: P1-CITIES-EXEC (Phase 1 実装) として新規追加
- `docs/02_実装計画/100x-pv-strategy.md` Phase 1 section に本設計書のリンクを追加

---

## 8. 補足: 今日の area-profile rank=0 修正との整合性

- 2026-05-23 デプロイした area-profile 修正 (`extract-strengths-and-weaknesses` の rank>=1 フィルタ) は **prefecture / city 両対応**
- city profile batch を実装する際、同じ extract 関数を使うため、rank=0 排除は自動的に適用される
- 別途 city-specific の filter 実装は不要

---

## 関連ドキュメント

- 親計画: `docs/02_実装計画/100x-pv-strategy.md` Phase 1
- 既存 prefecture profile 実装: `packages/area-profile/`
- R2 設計ルール: `.claude/rules/r2-storage-design.md`
- 実証ベース判定: `.claude/rules/evidence-based-judgment.md` (Stage GO/NO-GO 判定時に必読)
- Next.js SSG 保全: `.claude/rules/nextjs-ssg-preservation.md` (generateStaticParams 変更時に必読)
