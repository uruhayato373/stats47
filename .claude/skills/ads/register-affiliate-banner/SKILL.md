---
name: register-affiliate-banner
description: A8.net 等のバナー広告を登録しタグベースで自動表示させる。Use when user says "バナー登録", "アフィリエイト追加", "広告登録". TAG_AFFILIATE_MAP 経由の自動配置 + 手動配置対応.
disable-model-invocation: true
primary_agent: affiliate-manager
co_agents: [devops-runner]
---

アフィリエイトバナー広告を登録し、ブログ記事末尾にタグベースで自動表示させる。

## 用途

- A8.net 等で取得したバナー広告コードを登録したいとき
- 既存カテゴリにバナーを追加したいとき
- 新しいカテゴリを作成してバナーを登録したいとき
- 記事内に手動でバナーを配置したいとき

## 引数

ユーザーから以下を確認すること:

- **バナーHTMLコード**: A8.net 等から取得した `<a><img></a><img>` 形式のコード（必須）
- **サービス名/ジャンル**: 広告主のサービス内容（カテゴリ判定に使用）
- **配置方法**: 自動（タグベース）/ 手動（特定記事内）/ 両方

## 仕組み

### 自動表示（記事末尾）

```
記事の tags → TAG_AFFILIATE_MAP → AffiliateCategory → AFFILIATE_BANNERS → ランダム選択
```

- PC: 同一カテゴリのバナーを最大2つ横並び表示
- モバイル: 1つだけ表示
- コンポーネント: `ArticleAffiliateBanner`（`apps/web/src/features/blog/components/article-affiliate-banner.tsx`）

### 手動配置（記事内）

article.md に `<affiliate-banner>` タグを記述:

```html
<affiliate-banner
  src="バナー画像URL"
  href="クリックURL"
  tracking="計測ピクセルURL"
  width="幅"
  height="高さ"
  label="導線テキスト（任意）"
></affiliate-banner>
```

- コンポーネント: `md-content.tsx` 内のカスタム要素
- PRバッジ + 中央配置で表示

## 手順

### Phase 1: バナーコードの解析

1. ユーザーが提供した HTML コードから以下を抽出:

```
<a href="[クリックURL]" rel="nofollow">
  <img ... width="[幅]" height="[高さ]" src="[バナー画像URL]">
</a>
<img ... src="[計測ピクセルURL]">
```

| 項目 | 抽出元 |
|---|---|
| `href` | `<a>` タグの `href` 属性 |
| `src` | 1つ目の `<img>` の `src` 属性 |
| `tracking` | 2つ目の `<img>`（1×1ピクセル）の `src` 属性 |
| `width` / `height` | 1つ目の `<img>` の `width` / `height` 属性 |

### Phase 2: カテゴリ判定

2. サービス内容から適切な `AffiliateCategory` を判定:

| カテゴリ | 対象サービス例 |
|---|---|
| `labor` | 転職、求人、キャリア |
| `housing` | 引越し、不動産、住宅 |
| `population` | マッチングアプリ、婚活、結婚相談所 |
| `economy` | 投資、証券、保険、節約、家計管理 |
| `health` | フィットネス、健康食品、医療 |
| `energy` | 電力、ガス、ウォーターサーバー |
| `tourism` | 旅行、ホテル予約、車査定 |
| `furusato` | ふるさと納税 |

3. 既存カテゴリに該当しない場合は新規カテゴリを作成:
   - `AffiliateCategory` 型に追加
   - `TAG_AFFILIATE_MAP` にタグマッピングを追加
   - `AFFILIATE_THEME` にテーマカラーを追加

### Phase 3: バナー登録 ★SSOT = `apps/web/scripts/affiliate-ads-data.ts`（完全DBレス）

> **2026-06 更新**: 広告の SSOT は **git TS `apps/web/scripts/affiliate-ads-data.ts` の `AFFILIATE_ADS: AffiliateAd[]`**。
> `export-affiliate-ads-snapshot.ts` が R2 `app/affiliate-ads/all.json` を生成し、`resolve-affiliate-ad.ts` が配信時に解決する。
> （旧 `affiliate-category.ts` の `AFFILIATE_BANNERS` 定数は使わない。残置していても編集対象ではない。）

4. `apps/web/scripts/affiliate-ads-data.ts` の `AFFILIATE_ADS` 配列にエントリを追加:

```typescript
{
  "id": "af_<service>_<categoryKey>_001",  // 一意。同一広告を複数枠に出すなら枠ごとに別 id
  "title": "サービス名",                    // banner は内部ラベル / text は表示文言
  "htmlContent": "https://px.a8.net/svt/ejp?a8mat=...",   // クリックURL
  "areaCode": null,
  "categoryKey": "economy",   // ★ CATEGORY_AFFILIATE_MAP のキーと一致 (laborwage/economy/population/...)
  "locationCode": "blog-bottom", // blog-bottom / sidebar-bottom / area-sidebar / sidebar-sticky
  "isActive": true,
  "priority": 80,             // 大きいほど優先 (blog等は上位N件、area-sidebarは上位2件のゼロサム)
  "startDate": null, "endDate": null, "targetCategories": null,
  "adType": "banner",         // "banner" or "text"
  "imageUrl": "https://www22.a8.net/svt/bgt?aid=...",      // banner のみ
  "trackingPixelUrl": "https://www12.a8.net/0.gif?a8mat=...",
  "width": 300, "height": 250,
  "createdAt": "YYYY-MM-DD 00:00:00", "updatedAt": "YYYY-MM-DD 00:00:00"
}
```

- **全カテゴリ横断で出す**場合は categoryKey を変えて 8〜9 件複製（既存 STRATEGY CAREER / AI Agent Camp / 合宿免許 が手本）。
- **配置と解決の対応**（`resolve-affiliate-ad.ts` / `affiliate-ad-snapshot.ts`）:
  - blog / ranking / category / tag / theme = `categoryKey + adType` で priority 上位 N件（**locationCode 非依存**）
  - area ページ = `locationCode="area-sidebar"` の banner を上位2件
  - ランキングサイドバーのテキスト = `locationCode="sidebar-bottom"` の `adType:"text"`
- categoryKey の対応: `apps/web/src/features/ads/constants/affiliate-category.ts` の `CATEGORY_AFFILIATE_MAP`。

> **A/B テスト (AFF-05・任意)**: 同じ枠で複数クリエイティブを競わせるなら、エントリに
> `experimentId`（同一実験で共通）・`variantId`（実験内で一意）・`weight`（任意・既定1）を付ける。
> 同 experimentId が 2 件以上あると ranking sidebar が `VariantAdSlot` でクライアント加重ランダム出し分けに切替わる。
> 詳細・運用手順: `docs/40_アフィリエイト管理/AFF-05-creative-ab-testing-design.md`。

5. 反映（R2 公開）は **develop への push で `publish-affiliate-ads.yml` が自動発火**（workflow_dispatch ではない）。ローカルからの R2 push は不可。

### Phase 4: 手動配置（オプション）

6. 特定記事に手動バナーを配置する場合、article.md に `<affiliate-banner>` タグを挿入
7. 配置推奨位置: まとめセクションの後、関連記事の前

### Phase 5: 検証

8. 型チェック: `npx tsc --noEmit -p apps/web/tsconfig.json`
9. ブラウザで対象カテゴリの記事を確認
   - 記事末尾にバナーが表示されるか
   - PC で2列表示されるか（同カテゴリ2つ以上の場合）
   - リロードでランダム切り替えされるか（同カテゴリ2つ以上の場合）

## 関連ファイル

| ファイル | 役割 |
|---|---|
| `apps/web/scripts/affiliate-ads-data.ts` | **★広告 SSOT** (`AFFILIATE_ADS: AffiliateAd[]`、git TS) |
| `apps/web/scripts/export-affiliate-ads-snapshot.ts` | SSOT → R2 `app/affiliate-ads/all.json` 生成 |
| `apps/web/src/features/ads/services/resolve-affiliate-ad.ts` | 配信時の解決 (categoryKey/location/priority) |
| `apps/web/src/features/ads/repositories/affiliate-ad-snapshot.ts` | R2 snapshot reader (location/adType フィルタ) |
| `apps/web/src/features/ads/constants/affiliate-category.ts` | `CATEGORY_AFFILIATE_MAP`・`TAG_AFFILIATE_MAP`（旧 `AFFILIATE_BANNERS` は不使用） |
| `.github/workflows/publish-affiliate-ads.yml` | develop push で R2 反映 |
| `apps/web/src/features/blog/components/md-content.tsx` | 記事内 `<affiliate-banner>` の手動レンダリング |

## バナーサイズの推奨

| サイズ | 推奨配置 | 備考 |
|---|---|---|
| 300×250 / 320×250 | 記事末尾（自動） | 控えめで広告感が弱い。モバイルにも最適 |
| 300×300 | 記事末尾（自動） | 正方形。PC2列表示で収まりが良い |
| 670×340 | 記事内（手動） | コンテンツ幅にフィット。導線テキスト付きで使用 |
| 468×60 | 非推奨 | バナーブラインドネスが強い |
