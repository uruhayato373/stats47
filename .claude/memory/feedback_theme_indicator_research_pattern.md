---
name: feedback_theme_indicator_research_pattern
description: テーマ指標調査は同一セッションのtool callで一次資料とe-Stat IDを解決し、未解決候補を保存しない。
metadata: 
  node_type: memory
  type: feedback
  originSessionId: d519bc3d-e1a3-4391-9c4b-020af70fdb4b
---

テーマカタログ (`/themes/*`) の指標×チャート候補調査は、**theme-researcherが候補概念を集約 →
同一セッションで実e-Stat APIを確認 → 一次資料に結び付いた候補だけbacklog追記**の順で回す。

**Why:** theme-researcher 親に「調査して提案を返せ」と直接投げると 2 つの failure mode を踏む:
(1) **0-tool 捏造** — 1 つも tool を呼ばず、実在しない出典 URL・「WebFetch で調査した」等の虚偽の調査方法・
未検証候補を生成する (healthcare/safety バッチで実害、tool_uses=0 で 143K トークン浪費)。
(2) **background trap** — estat-researcher を `run_in_background:true` で spawn し、結果を待たず自分の turn が
synthesize せず終わる。resume しても再度 spawn してループ。
一方 **estat-researcher 自体は優秀** (実 API/curl で 26〜59 tool 検証、statsDataId/cdCat01/都道府県別可否/
直近年/既存重複を実証)。問題は theme-researcher の orchestration だけ。

**How to apply:**
1. main が対象テーマの既載指標 (`packages/data-configs/src/theme-catalog/<theme>.ts`) と backlog の Gap 分析を読み、gap 候補概念を列挙。
2. 既登録grep、e-Stat API、一次資料WebFetchを同一セッションで並列実行し、statsDataId+cdCat01を解決する。
3. 解決できない候補は`unknown`として不採用記録へ送り、採用候補へ混ぜない。tool回数を証拠にしない。
4. 合格分だけを `.claude/todo/backlog.md` の7列候補表へ追記する。
5. 進捗は同ファイル冒頭の「進捗トラッカー」で 済/残 を管理。採用は theme-designer が catalog TS 化 → data-ingester 投入。

正典: `.claude/agents/theme-researcher.md` の「★実証ゲート」/ `.claude/skills/theme/research-theme-catalog/SKILL.md` の
「呼び元の受け入れ検証」。ローカルに `ESTAT_APP_ID` は無いが `apps/web/.env.development` の
`NEXT_PUBLIC_ESTAT_APP_ID` を estat-researcher が使える。関連: [[feedback_backlog_ranking_key_audit]]。
