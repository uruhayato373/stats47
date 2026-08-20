---
name: register-affiliate-banner
description: アフィリエイト広告を意図軸 (vertical) SSOT に対話式で登録する。propose (次に提携すべき案件を提案) → ユーザーが ASP 提携 → register (コード解析・サイズ検証・vertical 判定・1エントリ追記) のループ。Use when user says "バナー登録", "アフィリエイト追加", "広告登録", "アフィリエイト提案".
disable-model-invocation: true
primary_agent: affiliate-manager
co_agents: [devops-runner]
---

アフィリエイト広告を **意図軸 (AffiliateVertical 10 軸) SSOT** に対話式で登録する。
「在庫ギャップを提案 → ユーザーが ASP 提携 → 1 件ずつ登録」を 1 案件 = 1 エントリで回す。

> **正典は `.Codex/rules/affiliate-ads-standards.md`**。本 skill は手順のみ。vertical 写像・プログラム表・
> サイズ・GA4 手順の SSOT はルール側。**旧「categoryKey ごとに 8-9 件複製」方式は廃止** (vertical 1 つで解決)。

## モード

`/register-affiliate-banner [propose|register|direct|status]` (既定 `propose`)。
`propose`/`register` = タグベース自動配置 (`AFFILIATE_ADS`)、`direct` = 直接属性方式の台帳登録。

---

## propose — 次に提携すべき案件を 1 件提案

1. 在庫を棚卸し: `npx tsx .Codex/scripts/ads/audit-affiliate-inventory.ts` → **vertical カバレッジ** (10 軸)
   の在庫ゼロ/手薄軸を特定。**ゼロ/手薄の軸は固定文でなく audit 出力
   (`.Codex/state/ads/inventory-latest.json` の `coverage.gapVerticals` / `thinVerticals`) から読む**。
2. トラフィックと突合: `.Codex/state/ads/ga4-affiliate-*.json` (GA4) + GSC の高トラフィックページ種別を見て、
   「トラフィックはあるが在庫ゼロ/手薄」の vertical を優先度づけ。
3. `rules §2 利用プログラム表` と照合し、その vertical の **要提携プログラムを 1 件**、根拠つきで提示:
   - Output: `Vertical | 提携先候補 | 根拠 (想定 imp 機会 / 単価帯 / 送客ページ) | ASP`。
4. ユーザーに **ASP (A8.net 等) で提携申請** を促して終了 (承認待ちは非同期)。**1 回 1 件**。

vertical の意味と送客ページは rules §2 を参照する。**提携済みかどうかは §2 ではなく
state (`affiliate-catalog.json` / `a8-catalog.json`) を読む** — §2 の表は設計指針であって
提携台帳ではない (2026-08-04 に一本化。表を真実源にしていた頃は実機と乖離していた)。

---

## register — 承認済みプログラムを 1 エントリ登録

ユーザーが ASP で提携承認 → 広告コードを持っている前提。

### Step 1: コード解析 (ASP 別)

> A8 コードの抽出は `.Codex/scripts/ads/lib/a8-code-core.mjs` の `parseA8Code(html)` に関数化済み
> (自動 scout `/scout-asp` と抽出仕様を共有)。手動でも同関数で {htmlContent, imageUrl, trackingPixelUrl,
> width, height, adType} を得られる。下表は ASP 別の抽出ルール (A8 は関数化・VC/楽天は手動)。

| ASP | href (クリック) | imageUrl | 計測ピクセル | サイズ |
|---|---|---|---|---|
| **A8.net** | `<a href>` (`px.a8.net/...`) | 1つ目 `<img src>` (`www*.a8.net/svt/bgt`) | 2つ目 1×1 `<img src>` (`www*.a8.net/0.gif`) | `<img width/height>` に明記 |
| **ValueCommerce** | noscript の `<a href>` (`ck.jp.ap.valuecommerce...referral`) | noscript の `<img src>` (`ad.jp.ap.valuecommerce...gifbanner`) | **無し → `null`** | **コードに無い → Step 2 で実測** |
| **楽天アフィリエイト** | `<a href>` (`hb.afl.rakuten.co.jp/hsc/...`) | `<img src>` (`hbb.afl.rakuten.co.jp/hsb/...`) | **無し → `null`** | **コードに無い → Step 2 で実測** |

- ValueCommerce は JavaScript バナー。**`<noscript>` の静的形 (gifbanner img + referral link) を使う**(SSG を壊さない)。
- **A8 以外 (ValueCommerce / 楽天) は別インプレッションピクセルを持たない** → `trackingPixelUrl: null`。
  解決層は imageUrl のみ必須・pixel 任意に対応済 (`resolve-affiliate-ad.ts` の `toBanner`)。
- protocol-relative (`//ad.jp...`) は `https:` を補う。

### Step 2: 画像を fetch して サイズ + 広告主 を確定 (★A8 以外は必須)

サイズがコードに無い (VC/楽天) / 広告主がコードから不明な場合は、**画像を実際に取得して判別**する:

```bash
node .Codex/scripts/ads/inspect-banner.mjs "<imageUrl>" /tmp/banner.png
# → {format, width, height, canonical, canonicalSize, savedTo} を JSON 出力
```
- 出力の `canonical` が **false なら登録しない** → ASP で 300×250 (canonical) 素材を選び直してもらう
  (canonical 4 種 = **300×250 / 250×250 / 320×100 / text** のみ。legacy 一点物も新規不可・rules §3)。
- `savedTo` の画像を **Read tool で開いて広告主を目視判別**し vertical を決める (例: LEC→education / ユーカーパック→mobility)。
- **2x 高解像度素材** (例 GIF 600×500) は表示 300×250 として扱う (`canonicalSize` を width/height に採用)。
- A8 は `<img width/height>` が明記されているので画像 fetch は任意 (広告主判別が要るときだけ)。

### Step 3: vertical 判定 (ユーザー確認)
`rules §2 利用プログラム表` でプログラム → vertical を判定し、ユーザーに確認する。10 軸:
`labor / housing / population / economy / health / energy / travel / furusato / education / mobility`。
判定できない/新語のタグが要る場合は `affiliate-category.ts` の `TAG_/THEME_AFFILIATE_MAP` に写像を追加する
(vertical 自体の新設は原則しない。10 軸で足りる)。

### Step 4: SSOT に 1 エントリ追記
`apps/web/scripts/affiliate-ads-data.ts` の `AFFILIATE_ADS` に **1 件だけ**追加 (categoryKey 複製しない):

```typescript
{
  id: "af_<service>_<vertical>_001",       // 一意。複数 placement が要るときだけ placement 別に分ける
  title: "サービス名",                      // banner=内部ラベル / text=表示文言
  htmlContent: "https://px.a8.net/svt/ejp?a8mat=...",
  areaCode: null,
  vertical: "travel",                       // ★正フィールド。10 軸から選ぶ
  categoryKey: null,                        // @deprecated。原則 null (vertical で解決)
  locationCode: "blog-bottom",              // blog-bottom / sidebar-bottom / area-sidebar / sidebar-sticky
  isActive: true,
  priority: 90,                             // 大きいほど優先。意図適合プログラムを上位に
  startDate: null, endDate: null, targetCategories: null,
  adType: "banner",                         // "banner" | "text"
  imageUrl: "https://www22.a8.net/svt/bgt?aid=...",   // banner のみ (VC=gifbanner / 楽天=hsb)
  trackingPixelUrl: "https://www12.a8.net/0.gif?a8mat=...",  // A8=0.gif / VC・楽天は null
  width: 300, height: 250,                  // 実測サイズ (2x 素材は canonicalSize)。text は null/null
  createdAt: "YYYY-MM-DD 00:00:00", updatedAt: "YYYY-MM-DD 00:00:00",
}
```

> **A/B テスト (任意)**: `experimentId`/`variantId`/`weight` を付けると同一実験の 2 件以上で
> `VariantAdSlot` の加重ランダム出し分けになる。実験の開始・判定は `/manage-affiliate-experiment`
> (reference: `.Codex/skills/ads/manage-affiliate-experiment/reference/creative-ab-testing.md`) で行う。

### Step 5: 検証
```bash
npx tsc --noEmit -p apps/web/tsconfig.json
npx tsx .Codex/scripts/ads/audit-affiliate-inventory.ts --json --check-size   # サイズ違反ゼロ (exit 0)
npx tsx -r ./packages/ranking/src/scripts/setup-cli.js apps/web/scripts/export-affiliate-ads-snapshot.ts  # vertical 検証 pass
```

### Step 6: 反映 (ユーザー判断)
commit → **develop への push で `publish-affiliate-ads.yml` が自動発火** (workflow_dispatch ではない)。
outward-facing なので push はユーザーに確認。反映後、対象 vertical のページ (ranking/theme/blog) で表示を目視。
→ 次の `propose` へループ。

---

## status — 提携状況の一覧

**提携状況の真実源は state ファイル** (rules §2 の表ではない。2026-08-04 に一本化)。

| ASP | 読む先 |
|---|---|
| もしも / afb | `.Codex/state/ads/affiliate-catalog.json` の `programs[].asps[].status` |
| A8 | `.Codex/state/ads/a8-catalog.json` の `entries[].status` |

vertical 別に `approved` / `applying` を集計して一覧する。**固定文を持たない** —
数えるたびに実態が変わるため、必ず state を読んで数える。

- 最終照合日は `affiliate-catalog.json` の `verifiedAt`。古ければ `/affiliate-operate status` を促す。
- 在庫ゼロ/手薄の vertical は `.Codex/state/ads/inventory-latest.json` の `coverage` から読む。
- **提携済み = 配信中ではない**。配信 SSOT は `apps/web/scripts/affiliate-ads-data.ts` で、
  もしも / afb は広告コード取得 (harvest) の経路が無いため提携済みでも未配信のことがある。
  両者を混同して「提携したのに出ていない」と誤診しない。

---

## direct — 直接属性方式の配置を台帳に登録

特定記事の文脈にピンポイント配置する方式 (自動配置と別系統)。**配置と台帳登録は必ずセット**で行う
(台帳に無い `<affiliate-banner>` は `/audit-affiliate-compliance` が「台帳未登録タグ」として弾く)。

1. **台帳へ追記**: `apps/web/scripts/affiliate-direct-placements-data.ts` の `AFFILIATE_DIRECT_PLACEMENTS`
   に 1 エントリ (id / asp / href / imageUrl / pixel / サイズ / rewardNote / conversionCondition /
   placements[{channel, slug, position}] / addedAt / isActive)。既存配置に記事を足す場合は `placements` に追加。
2. **記事本文へ配置**: article.md に `<affiliate-banner src= href= tracking= width= height= label=>` を
   文脈一致の位置に挿入 (`md-content.tsx` がレンダリング)。note はカスタム要素未対応のため生 HTML。
   担当は `blog-editor` / `article-writer`。
3. **PR 表記 (景表法)**: blog は記事冒頭の PR 宣言 + リンク直前の `※PR：` の両方、note は `#PR`/`#広告`。
4. **検証**: `npx tsx .Codex/scripts/ads/audit-affiliate-compliance.ts --live --check` で
   孤立 / 表記漏れ / 未登録タグがゼロであること。

## 関連ファイル

| ファイル | 役割 |
|---|---|
| `.Codex/rules/affiliate-ads-standards.md` | **★正典** (vertical ハブ・プログラム表・サイズ・GA4・登録フロー) |
| `apps/web/scripts/affiliate-ads-data.ts` | **★自動配置 SSOT** (`AFFILIATE_ADS`、git TS) |
| `apps/web/scripts/affiliate-direct-placements-data.ts` | **★直接配置 SSOT** (`AFFILIATE_DIRECT_PLACEMENTS`、git TS) |
| `.Codex/scripts/ads/audit-affiliate-compliance.ts` | 直接配置の compliance 監査 (`/audit-affiliate-compliance`) |
| `apps/web/src/features/ads/constants/affiliate-category.ts` | 意図ハブ (`AffiliateVertical` / 3 map / `adVertical`) |
| `.Codex/scripts/ads/inspect-banner.mjs` | バナー画像を fetch → サイズ実測 + canonical 判定 + 目視用保存 (VC/楽天のサイズ確定・広告主判別) |
| `.Codex/scripts/ads/audit-affiliate-inventory.ts` | 在庫棚卸し (vertical カバレッジ + `--check-size`) |
| `apps/web/scripts/export-affiliate-ads-snapshot.ts` | SSOT → R2 (vertical 検証) |
| `.github/workflows/publish-affiliate-ads.yml` | develop push で R2 反映 |
