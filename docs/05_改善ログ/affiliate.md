---
type: improvement-log
target_metric: affiliate
status: active
created: 2026-06-04
updated: 2026-06-04
tags: [affiliate, monetization, impression, ctr]
---

# アフィリエイト改善ログ

アフィリエイト広告の **impression / click / CTR 改善施策の TODO 真実源**(人間向け要約・append-only)。
agent 用詳細 (検証コマンド・仮説・実測) は 2 層構造の下層
`.claude/skills/analytics/affiliate-improvement/reference/improvement-log.md` に置く。

- SSOT (在庫): `apps/web/scripts/affiliate-ads-data.ts` (`AFFILIATE_ADS[]`, git TS / 完全DBレス)
- 配信: `export-affiliate-ads-snapshot.ts` → R2 `app/affiliate-ads/all.json`
- 計測: GA4 `ad_impression` / `affiliate_click` (`apps/web/src/lib/analytics/events.ts` + `AdImpressionTracker`)
- 棚卸し (決定的): `npx tsx .claude/scripts/ads/audit-affiliate-inventory.ts`
- ループ: `/affiliate-improvement` skill (primary_agent: adsense-analyst)

> **effect/* を付ける前に必ず** `.claude/rules/evidence-based-judgment.md` の実証チェックリストを通すこと。
> 想定値・実測値・取得コマンド・経過日数なしに effect/full・effect/partial を付けない。

---

## [AFF-01] 在庫ベースライン棚卸し (2026-06-04)

- **status**: in-progress
- **tier**: 1
- **target_metric**: affiliate/inventory
- **owner**: claude
- **deployed_at**: 2026-06-04
- **due**: 2026-06-11
- **verification_command**: `npx tsx .claude/scripts/ads/audit-affiliate-inventory.ts`
- **related_pr**: -

初回棚卸しで判明した在庫の偏り (active 72 枠 / 実広告主 29 社):

| 観点 | 実測 | 含意 |
|---|---|---|
| カテゴリ 17 軸カバレッジ | **9/17** | 8 軸が広告ゼロ |
| 広告ゼロ軸 | agriculture / miningindustry / commercial / educationsports / safetyenvironment / international / infrastructure / ict | 該当カテゴリの ranking・記事で impression を取りこぼす |
| 手薄軸 | landweather (2) | 補充候補 |
| 配置偏り | blog-bottom 47 / sidebar-bottom(text) 18 / area-sidebar 4 / sticky 2 / inline 1 | バナーが記事末尾に集中 |
| ランキング枠 | sidebar-bottom **text 18** のみ (banner は出ない) | 主要トラフィックの ranking でバナー impression がゼロ |

→ ここから AFF-02 (ゼロ軸の在庫補充) / AFF-03 (ranking バナー枠) / AFF-04 (CTR 弱枠の改善) を派生させる。

---

## [AFF-02] 広告ゼロ 8 軸の在庫補充

- **status**: pending
- **tier**: 2
- **target_metric**: affiliate/impression
- **owner**: uruhayato373
- **due**: 2026-06-21
- **verification_command**: `npx tsx .claude/scripts/ads/audit-affiliate-inventory.ts --json | jq '.coverage.gapCategories'`
- **related_pr**: -

**[仮説]** 広告ゼロの 8 軸 (agriculture / ict / educationsports など) は該当ページにトラフィックがあっても
収益化されていない。A8.net で各軸に適合する案件を 1 軸あたり 1-2 件登録すれば impression のベースが立つ。

- 各軸の適合案件候補は `/plan-blog-affiliate` の AffiliateCategory マップ外なので新規探索が要る。
- 登録は `/register-affiliate-banner` (SSOT 追記 → develop push で `publish-affiliate-ads.yml` 自動反映)。
- **検証期日 (2026-06-21) 後の判定**: gapCategories が 8 → N に減り、該当軸ページの `ad_impression` が GA4 で観測されれば前進。

---

## [AFF-03] ランキングページのバナー枠検討 (要・設計レビュー)

- **status**: pending
- **tier**: 2
- **target_metric**: affiliate/impression
- **owner**: claude
- **due**: 2026-06-28
- **verification_command**: `curl -s -A "Googlebot" "https://stats47.jp/ranking/<key>" | grep -c affiliate`
- **related_pr**: -

**[仮説]** ランキング詳細 (`/ranking/[rankingKey]`) はサイトの主要トラフィックだが、現状 affiliate は
`sidebar-bottom` の **text 18 枠**のみで banner impression がゼロ。視認性の高い banner 枠を 1 つ足せば
impression が大きく増える可能性。

- **設計提案 (承認待ち)**: `docs/40_アフィリエイト管理/AFF-03-ranking-banner-design.md`
- **SSG リスクは低い** (確認済): ranking サイドバーの `AffiliateAdSlot` は既に async Server Component で
  R2 を build 時解決しており、`cookies()/headers()` を増やさなければ force-dynamic 化しない。推奨案 A は
  `AffiliateAdSlot.tsx` 1 ファイルにバナー優先を足す外科的変更。
- 実装は本ログとは別 PR で、`next build` の `○ Static` 維持を確認してから。
- **検証期日後の判定**: 本番 ranking の HTML に banner が描画され、`ad_impression(link_position=ranking-*)` が
  GA4 で観測されれば前進。CTR は AFF-04 で評価。

---

## [AFF-04] CTR 弱枠の特定と CTA / マッチング改善

- **status**: pending
- **tier**: 2
- **target_metric**: affiliate/ctr
- **owner**: claude
- **due**: 2026-07-05
- **verification_command**: `/affiliate-improvement` (GA4 ad_impression / affiliate_click を position×category 別集計)
- **related_pr**: -

**[仮説]** impression はあるが click されない枠 (低 CTR) は、ページ内容と広告カテゴリのミスマッチ、
または CTA 文言 / 位置が原因。`/affiliate-improvement` で placement×category 別 CTR を出し、
下位枠を特定 → categoryKey マッチ修正 / CTA 文言改善 / 位置調整を打つ。

- 4 週ごとに GA4 snapshot で before/after を比較し、ここに effect/* を記録する。
