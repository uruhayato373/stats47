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

## [AFF-03] ランキングページのバナー枠追加 (案A 実装)

- **status**: in-progress
- **tier**: 2
- **target_metric**: affiliate/impression
- **owner**: claude
- **deployed_at**: 2026-06-04
- **due**: 2026-06-28
- **verification_command**: `curl -s -A "Googlebot" "https://stats47.jp/ranking/<banner在庫のあるkey>" | grep -c "a8.net"`
- **related_pr**: (develop→main PR)

**[仮説]** ランキング詳細 (`/ranking/[rankingKey]`) はサイトの主要トラフィックだが、現状 affiliate は
`sidebar-bottom` の **text 18 枠**のみで banner impression がゼロ。視認性の高い banner 枠を 1 つ足せば
impression が大きく増える可能性。

- **設計**: `docs/40_アフィリエイト管理/AFF-03-ranking-banner-design.md` (案A 採用)
- **実装 (2026-06-04)**: `AffiliateAdSlot` の解決優先順位を「バナー → テキスト → AdSense」に変更。
  - `resolveAffiliateBannersByCategoryKey(categoryKey, 1)` を新設 (services / server から export)
  - sidebar のみバナー優先。banner 在庫の無い 8 軸は従来どおり text→AdSense にフォールバック
  - `cookies()/headers()` を追加していないため SSG は維持 (既存 async RSC と同パターン)。型チェック green。
  - SSG (`○ Static`) の最終確認は CI の `next build` に委ねる (ローカルはフルビルド未実行)
- **検証期日後の判定**: 本番 ranking の HTML に banner が描画され、`ad_impression(link_position=ranking-sidebar)` が
  GA4 で観測されれば前進。CTR は AFF-04 で評価。

---

## [AFF-06] 公務員 AI 転職体験記で STRATEGY CAREER を訴求

- **status**: pending
- **tier**: 2
- **target_metric**: affiliate/ctr
- **owner**: claude
- **due**: 2026-07-04
- **verification_command**: `node .claude/scripts/ads/fetch-affiliate-ga4.cjs 28`（`af_strategy_career_*` の `ad_impression` / `affiliate_click` を `page_path=/blog/koumuin-ai-tenshoku-1500man` で集計）
- **related_pr**: -

**[仮説]** STRATEGY CAREER（エンジニア転職）は `laborwage` タグ記事の blog-bottom に薄く自動配置しているが、
広告と読者文脈のマッチが弱く CTR が伸びにくい。「公務員が AI を独学して転職・独立し、年収が公務員時代の
2 倍以上になった」一人称の体験記（`/blog/koumuin-ai-tenshoku-1500man`、`laborwage` タグ）を新設し、
「転職を決めた」セクション直下に同案件を `<affiliate-banner>` で **直接属性配置**（末尾集約しない）すれば、
転職検討の意図が最も高まる文脈で接触でき、blog-bottom 単独より CTR が高まると見込む。

- **施策内容**:
  - 体験記ブログ `koumuin-ai-tenshoku-1500man`（`published: false` の下書き）を作成。景表法対応（冒頭 PR 表記・
    リンク直前「※PR：」・年収は個人結果である旨の打消し表示）済み。
  - 本文インライン + `laborwage` タグによる blog-bottom 自動配置の二重接触。
  - `/about` を体験ストーリー軸（県庁→AI 独学→転職→独立→stats47）に書き換え、体験記への導線を追加（about には
    バナー非設置・リンクのみ）。
- **想定効果**: [仮説] 体験記文脈のインライン枠は blog-bottom 単独より高 CTR を見込むが、定量基準は実測前のため
  未設定。公開後 4 週で GA4 実測 → blog-bottom 平均 CTR と比較して effect/* を判定する（80% 未満なら CTA 文言 /
  配置位置を見直し）。
- **未確定 / 仮説**: 記事は現在 `published: false`。公開には blog-critic レビュー（`review.md` PASS）と
  オーナーによる経歴・年収表記の事実確認が前提。公開・GA4 計測前に effect/* は付けない。
