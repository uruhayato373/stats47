---
name: project_affiliate_banner_text_asymmetry
description: banner 解決は locationCode を見ないが text 解決は見る。この非対称を知らないと text 広告が永久に表示されない死に在庫になる
metadata:
  type: project
---

stats47 のアフィリエイト配信で、**banner と text の解決規則が非対称**である。

| | 絞り込み条件 | 実装 |
|---|---|---|
| banner | vertical + adType + targetRankingKeys のみ。**locationCode を見ない** | `readActiveBannersByVerticalsFromR2` |
| text | 上記 + **locationCode で絞る** (`sidebar-bottom` / `footer`) | `readActiveTextAdsByVerticalsFromR2` |

**Why:** これを知らずに text を `blog-bottom` に置くと、banner 経路は adType で弾き、text 経路は
locationCode 不一致で弾くため **どちらにも乗らず永久に表示されない**。2026-07-28 に実際に 2 件が
そうなっていた (`af_gmo-bb-au_a8_001` / `af_dmm-com-dmm-cfd_a8_001`)。`buildAdDraft` が adType で
振り分けるよう修正済み。

**How to apply:**
- text 広告の `locationCode` は必ず `sidebar-bottom` (または `footer`)。**ブログ本文インラインも
  `sidebar-bottom` を再利用する** — 本文用の新しい値を作ると在庫が分断され、本文もサイドバーも
  埋まらなくなる。本文とサイドバーの区別は GA4 の `link_position` (`article-inline` / `sidebar`) で行う。
- 在庫監査は `coverage.textGapVerticals` を見る。vertical 総数だけでは
  「banner はあるが text ゼロ」を検出できない (2026-07-28 に追加)。
- A8 から text を取るときは `harvest --include-registered`。`fetchAdCode` は banner と text を
  両方返すが、**registered は状態機械上 harvested へ戻せない**ので status を変えず
  `pendingDrafts` に積み、append が status 非依存で拾う。同一プログラムでも banner と text は
  a8mat が別なので二重登録にはならない。
- 正典: `.claude/rules/affiliate-ads-standards.md` §3/§4。関連: [[project_asp_site_attribution]]
