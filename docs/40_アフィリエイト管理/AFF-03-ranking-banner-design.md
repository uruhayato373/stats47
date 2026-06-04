---
type: design-proposal
target: AFF-03
status: proposal
date: 2026-06-04
related_log: docs/05_改善ログ/affiliate.md#AFF-03
---

# AFF-03 設計提案: ランキング詳細ページにバナー枠を追加

> **承認待ち**。本ドキュメントは設計のみ。実装 (apps/web レンダリング変更) は承認後に別 PR で行う。

## 目的

ランキング詳細 (`/ranking/[rankingKey]`) はサイトの主要トラフィックだが、現状 affiliate は
サイドバーの **テキスト広告 (sidebar-bottom, 最大2件) → AdSense フォールバック** のみで、
**バナー impression がゼロ**。視認性の高いバナー枠を 1 つ足して impression を増やす。

## 現状の実装 (確認済み)

`apps/web/src/app/ranking/[rankingKey]/page.tsx` の `sidebarSection`:

```tsx
<RankingItemsSidebar ... />
<SidebarPromoBanner />
<AdSenseAd format={RANKING_SIDEBAR_TOP.format} slotId={RANKING_SIDEBAR_TOP.slotId} />
<AffiliateAdSlot categoryKey={rankingItem.categoryKey ?? ""} position="sidebar" />  // text → AdSense
```

- `AffiliateAdSlot` は **async Server Component**。`resolveAffiliateTextAds(categoryKey, "sidebar-bottom", 2)` を
  build 時に R2 から解決する (text のみ)。
- `resolveAffiliateBanners` (categoryKey で banner を解決) は既に import 済みだがサイドバーでは未使用。

## SSG への影響: 低リスク

`.claude/rules/nextjs-ssg-preservation.md` の観点で評価:

- 枠の追加は **既存の async RSC パターンの踏襲**であり、`cookies()` / `headers()` / `draftMode()` を
  **一切増やさない**。R2 fetch は build 時に解決され SSG を壊さない (現に `AffiliateAdSlot` が同じことをしている)。
- → **force-dynamic 化のリスクなし**。`next build` で `/ranking/[rankingKey]` が `○ Static` を維持することを
  実装 PR の受け入れ条件にする。

## 提案する変更 (2 案)

### 案 A (推奨・最小): `AffiliateAdSlot` にバナー優先を追加

`AffiliateAdSlot` の解決優先順位を変更:

```
1. バナー広告 (resolveAffiliateBanners(categoryKey) 上位1件) を表示  ← 新規
2. なければ テキスト広告 (最大2件)
3. なければ AdSense フォールバック
```

- 変更は `AffiliateAdSlot.tsx` 1 ファイルに閉じる (外科的)。
- バナーは `categoryKey + adType=banner` で解決 (既存 `resolveAffiliateBanners` を流用)。
- 広告ゼロ8軸では banner も text も無く AdSense にフォールバック → 既存挙動と同じ。

### 案 B (枠を増やす): サイドバーにバナー専用枠を新設

text 枠とは別に banner 枠を 1 つ追加 (impression を両取り)。広告在庫が薄いと同じ案件が
複数枠に出て煩雑になるため、**在庫が増えるまでは案 A を推奨**。

## 検証 (実装 PR の受け入れ条件)

```bash
# 1. SSG 維持 (○ Static のまま)
cd apps/web && npm run build 2>&1 | grep "ranking/\[rankingKey\]"

# 2. 本番反映後、Googlebot UA で banner が描画されるか
curl -s -A "Googlebot" "https://stats47.jp/ranking/<banner在庫のあるkey>" | grep -c "affiliate\|a8.net"

# 3. GA4 で ad_impression(link_position=ranking-sidebar) が観測されるか
node .claude/scripts/ads/fetch-affiliate-ga4.cjs 28
```

## 想定効果と判定

- **[仮説]** ranking のバナー impression は現在ゼロ → 枠追加で該当カテゴリ (banner 在庫のある9軸) の
  ranking PV に比例して impression が立つ。CTR は AFF-04 で評価。
- 効果判定は実装後 1〜4 週の GA4 で before/after を比較し `docs/05_改善ログ/affiliate.md` AFF-03 に記録。
  実証チェックリスト (`.claude/rules/evidence-based-judgment.md`) を通すまで effect/* を付けない。

## 未確定 / 承認が要る点

1. **案 A / 案 B のどちらにするか** (推奨: A)。
2. **バナーサイズ**: サイドバー幅に収まる 300×250 を想定。レイアウト崩れがないか実装時に確認。
3. 実装は **別 PR** とし、`next build` の `○ Static` 維持を確認してからデプロイ。
