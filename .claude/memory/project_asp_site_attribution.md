---
name: project_asp_site_attribution
description: A8 / もしも / afb の 3 ASP は stats47 と doboku-note が同一口座に同居しており、サイト帰属 assert を通さないと他サイトのデータを自分のものと誤認する
metadata:
  type: project
---

**A8.net / もしもアフィリエイト / afb の 3 ASP は、stats47 と doboku-note を同一口座で運用している。**
切り替えずに読むと他サイトの数値を自サイトの実績と誤認する。doboku-note では afb の走査で SID 不一致を
「警告して続行」した結果、別サイトの一覧を読んで「該当 0 件」と誤報告した事故が起きた。

| ASP | 分離方式 | stats47 の ID | doboku-note の ID |
|---|---|---|---|
| A8.net | **切替 UI が存在しない** | 口座 mediaId `a25050375786` (共通) | 同左 |
| もしも | URL の `shop_site_id` | `638943` | `672381` |
| afb | Chosen.js の**実クリックのみ**有効 (URL も JS の change も効かない) | SID `959426` | `984453` |

**Why:** 「切り替え忘れ」は静かに間違った数値を出すので、事後に気づけない。判定を
`.claude/scripts/ads/lib/asp-site-guard.mjs` に集約し、**不一致は例外で停止**する設計にしてある
(`--force` 相当の迂回手段は意図的に作っていない)。

**How to apply:**
- ASP を操作するときは必ず `ensureTargetSite` を通す。停止したら回避せず、debug artifact を見て原因を報告する。
- `targetSiteName` は config の `sites` マップの**キー** (`stats47`)、`targetSiteLabel` は画面の**表示名**
  (「統計で見る都道府県」)。select の option をキー名で探すと見つからず切替が黙って失敗する。
- **A8 の成果レポートで「stats47 単独」と言えるのは `/report/site` (site-rows) の対象サイト行だけ。**
  `program/detail` や `period/*` は口座横断。さらに **buildjob / kensetsu-jobs / gks の 3 プログラムは
  両サイトが同じ A8 案件を配信している**ため programId でも分離できない (両サイト合算)。
- 実行はローカル限定 (Playwright 永続プロファイル)。**afb は storageState を別プロセスで復元できず
  headless も拒否される**ので、ログインから作業完了までを 1 プロセス・headed で終える。
- 正典: `.claude/rules/affiliate-ads-standards.md` §11 / 関連: [[feedback_playwright_profile_dual_os]]
