# アフィリエイト広告 標準 (SSOT + 共通ルール)

`apps/web/scripts/affiliate-ads-data.ts` (`AFFILIATE_ADS: AffiliateAd[]`) を SSOT とする、
アフィリエイト広告の **利用プログラム・フォーマット/サイズ・配置/priority** の**単一ソース**。
`affiliate-manager` agent / `/register-affiliate-banner` / 人間はこれに従う。

> 背景: 広告サイズが 10 種に分裂 (300×250=35 / text=18 / 320×100=8 が主力 + skyscraper 等の一点物が散在)、
> `tourism` 枠に転職・研修広告が混在し旅行ページに旅行広告が出ない、等の不統一があった。型ではなく
> **運用ルールで是正**する。完全DBレス: SSOT は git TS、配信は R2 (永続 DB を持たない)。

## 1. SSOT とデータフロー

```
apps/web/scripts/affiliate-ads-data.ts (AFFILIATE_ADS = git TS SSOT)
  → export-affiliate-ads-snapshot.ts → R2 app/affiliate-ads/all.json
  → resolve-affiliate-ad.ts (配信時に categoryKey / locationCode / priority で解決)
  → apps/web/src/features/ads/ コンポーネントが描画
```

- **反映 (公開) は develop への push で `publish-affiliate-ads.yml` が自動発火** (workflow_dispatch ではない)。ローカルからの R2 push は不可。
- **手編集 JSON を SSOT にしない。** 必ず git TS を編集 → CI が R2 を生成。

## 2. 利用プログラム表 (vertical → categoryKey → 提携状況)

| vertical | 主プログラム | categoryKey | 提携 | 主な送客ページ |
|---|---|---|---|---|
| 旅行・宿泊 | じゃらん (`af_jalan_tourism_001`) / 楽天トラベル / OZmall | `tourism` | じゃらん✅ / 楽天トラベル取得予定 | `/ranking` 観光系 (`travel-participation-rate-overnight` = note #1 ファネル) |
| 転職・年収 | STRATEGY CAREER / 就職エージェントneo / AI就労支援 | `laborwage` | ✅ | 年収・所得 ranking, 県民所得 |
| 引越し・不動産・住まい / 建設業 | 不動産・住宅バナー / 引越し比較 / ビルドジョブ(施工管理転職 `af_buildjob_construction_001`) | `construction` | 一部✅ | `/areas`, 住宅・地価・建設業 ranking |
| ふるさと納税 | (未在庫) | ★要決定 (新規 or `administrativefinancial`) | 未提携 | 財政・地域系 ranking |
| 健康・フィットネス | RIZAP (`af_rizap_socialsecurity_001`) / ClassPass / マカエンペラー / Repilates | `socialsecurity` | ✅ | 医療・社会保障・健康系 ranking |
| 投資・保険・お金 | FP無料相談 (`af_fp_soudan_economy_001`) / NISA・証券 / SBI証券 / 未来保険 | `economy` | ✅ | 県民所得・貯蓄率・経済系 ranking |

- `categoryKey` は `apps/web/src/features/ads/constants/affiliate-category.ts` の `CATEGORY_AFFILIATE_MAP` のキーと一致必須 (不一致は配信時に解決されず非表示)。
- **ふるさと納税は対応 categoryKey 未確定**。提携取得時に (a) 既存 `administrativefinancial`/`economy` に載せる か (b) 新 `AffiliateCategory` を起こす かを `/register-affiliate-banner` Phase 2 で決める。

## 3. フォーマット & サイズ規約 (canonical 4 種)

新規登録・是正は下記 **4 種のみ**に標準化する。これ以外のサイズは登録しない。

| フォーマット | サイズ | 用途 | 主な locationCode |
|---|---|---|---|
| レクタングル (主) | **300×250** | 既定。blog 本文下 / ranking / sidebar | `blog-bottom` / `sidebar-sticky` |
| スクエア | **250×250** | 正方形クリエイティブ (じゃらん等) | `blog-bottom` |
| モバイル横長 | **320×100** | モバイル枠 | `blog-bottom` |
| テキスト | (サイズなし) | sidebar テキストリンク | `sidebar-bottom` |

**廃止する一点物** (新規登録禁止・既存は順次移行): `160×600` / `120×600` (skyscraper)、`165×120`、`320×250`、`336×280`、`300×300` → **300×250 か text に寄せる**。理由: 固定スロットで崩れ・余白事故が出る。

## 4. 配置 & priority 規約

### locationCode と解決 (`resolve-affiliate-ad.ts`)

| ページ種別 | 解決キー | 件数 |
|---|---|---|
| blog / ranking / category / tag / theme | `categoryKey` + `adType` の priority 上位 (**locationCode 非依存**) | banner 上位 1〜2 |
| area | `locationCode="area-sidebar"` の banner | 上位 2 (ゼロサム) |
| ranking sidebar テキスト | `locationCode="sidebar-bottom"` の `adType="text"` | 上位 2 |

### priority 規約

- **ページ意図に合致するプログラムを上位**にする。例: 旅行ランキング → じゃらん `priority: 100` (tourism 最上位)。
- 意図不一致の汎用広告 (研修 / 汎用キャリア等) を**意図特化ページの上位に置かない**。
- 同一広告を複数カテゴリに出す場合は `categoryKey` 別にエントリを複製する (priority はカテゴリ単位)。

### category → ad 写像の分離 (中期 / doc 14 付録A-4 打ち手 c)

現状 `affiliate-category.ts` は `tourism / transportation / traffic-safety / public-safety / traffic-accidents` を**同一 `"tourism"` 枠に集約** (過粗)。宿泊旅行ページと交通事故ページが同じ広告プールを共有し意図ミスマッチが起きる。**旅行系を独立バケットに分離**する。

## 5. 禁止事項

| NG | OK |
|---|---|
| `affiliate-ads-data.ts` 以外 (R2 JSON 等) を手編集して真実源化 | git TS を編集 → CI が R2 生成 |
| canonical 4 種以外のサイズで新規登録 | 300×250 / 250×250 / 320×100 / text |
| 意図不一致の汎用広告を特化ページ上位に置く | ページ意図適合プログラムを上位 priority |
| `categoryKey` を `CATEGORY_AFFILIATE_MAP` 外の値にする | map のキーと一致させる |

## 6. 運用フロー (役割分担)

| 工程 | 担当 |
|---|---|
| バナー / テキスト登録 | `affiliate-manager` (skill `/register-affiliate-banner`) |
| 在庫整理・監査・dashboard | `affiliate-manager` (skill `/affiliate-improvement` の inventory/dashboard) |
| サイズ / プログラム規約の enforcement | `affiliate-manager` (本ルール) |
| imp / click / CTR の実測値取得 | `ga4-analyst` / `adsense-analyst` |
| effect/* 判定・改善ログ status | `improvement-triage` |
| R2 公開 | develop push → `publish-affiliate-ads.yml` (CI 自動) |
| 記事内手動配置 (`<affiliate-banner>` タグ) | `blog-editor` / `article-writer` |

## 7. 関連

- SSOT データ: `apps/web/scripts/affiliate-ads-data.ts`
- 型ソース: `packages/database/src/schema/affiliate_ads.ts`
- 配信解決: `apps/web/src/features/ads/services/resolve-affiliate-ad.ts` / `constants/affiliate-category.ts`
- 生成: `apps/web/scripts/export-affiliate-ads-snapshot.ts` → R2 `app/affiliate-ads/all.json`
- agent: `.claude/agents/affiliate-manager.md`
- skill: `/register-affiliate-banner` / `/affiliate-improvement`
- 戦略: `docs/02_実装計画/01_収益化マスタープラン.md` §5-6 / 実装: `docs/02_実装計画/14_収益化実装方針.md` §3・付録A
