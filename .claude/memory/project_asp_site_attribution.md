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
| afb | UIはChosen.js の**実クリック**、成果APIは必須指定した`partner_site_id`＋全行照合 | SID `959426` | `984453` |

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
- afbの提携操作はstorageStateの別process移送が拒否される場合があるため、ログインから完了まで同一headed processで行う。成果取得は公式APIへ分離し、Cookie再ログインにfallbackしない。A8/もしものサイト限定レポートは認証付きCI経路がある（[認証運用正典](../../docs/01_技術設計/07_Playwright認証プロファイル.md)）。
- 正典: `.claude/rules/affiliate-ads-standards.md` §11 / 関連: [[feedback_playwright_profile_dual_os]]

**問題**: afb公式APIの成功応答を`{response: []}`と仮定すると、正常な成果ゼロも形式不一致で止まる。

**原因**: 2023-12-25版の仕様表にある`response`から外側のJSONキーを推定したが、2026-09-21のCI実応答は本文そのものが`[]`だった。

**対策**: `measurement/afb-outcomes.mjs`はJSON配列だけを受理し、エラーobjectや欠落を空配列へ変換しない。要求はstats47のsite IDを必須にし、非ゼロ行も帰属・重複・日付・状態・報酬gateで検査する。APIキーは承認済みGitHub Secretのみ、発生日/確定日系列を合算しない。

**証拠**: CI `35560007703` attempt 2の値を含まない応答型診断、`.claude/scripts/measurement/__tests__/afb-outcomes.test.mjs`。
