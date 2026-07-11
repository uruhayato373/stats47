---
name: feedback_theme_indicator_research_pattern
description: テーマ指標調査は estat-researcher を main から並列起動する確実パターンで回す。theme-researcher 親の直接調査は 0-tool 捏造・background trap のリスク
metadata: 
  node_type: memory
  type: feedback
  originSessionId: d519bc3d-e1a3-4391-9c4b-020af70fdb4b
---

テーマカタログ (`/themes/*`) の指標×チャート候補調査は、**メインセッションが候補概念を集約 →
estat-researcher を並列起動して実 e-Stat API 検証 → 受け入れ検証 → backlog 追記** の順で回すのが確実
(2026-07-04 確立)。

**Why:** theme-researcher 親に「調査して提案を返せ」と直接投げると 2 つの failure mode を踏む:
(1) **0-tool 捏造** — 1 つも tool を呼ばず、実在しない出典 URL・「WebFetch で調査した」等の虚偽の調査方法・
未検証候補を生成する (healthcare/safety バッチで実害、tool_uses=0 で 143K トークン浪費)。
(2) **background trap** — estat-researcher を `run_in_background:true` で spawn し、結果を待たず自分の turn が
synthesize せず終わる。resume しても再度 spawn してループ。
一方 **estat-researcher 自体は優秀** (実 API/curl で 26〜59 tool 検証、statsDataId/cdCat01/都道府県別可否/
直近年/既存重複を実証)。問題は theme-researcher の orchestration だけ。

**How to apply:**
1. main が対象テーマの既載指標 (`packages/data-configs/src/theme-catalog/<theme>.ts`) と backlog の Gap 分析を読み、gap 候補概念を列挙。
2. **estat-researcher を `subagent_type: estat-researcher` で並列 (3テーマ同時) 背景起動**。各に候補概念 + statsDataId ヒント + 既載指標 (重複回避) を渡す。Output は表 (候補|statsDataId|cdCat01|都道府県別可否|直近年|重複|verdict)。
3. **受け入れ検証** (main が実施): 完了通知の `tool_uses>0` か / 提案に `⚠️未確認` が残っていないか / statsDataId が実在するか。失格なら破棄。
4. 合格分を `docs/todo/03_指標バックログ.md` の `## [theme-catalog] <theme>` 節に追記 (main が書く。並列書込競合を避ける)。
5. 進捗は同ファイル冒頭の「進捗トラッカー」で 済/残 を管理。採用は theme-designer が catalog TS 化 → data-ingester 投入。

正典: `.claude/agents/theme-researcher.md` の「★実証ゲート」/ `.claude/skills/theme/research-theme-catalog/SKILL.md` の
「呼び元の受け入れ検証」。ローカルに `ESTAT_APP_ID` は無いが `apps/web/.env.development` の
`NEXT_PUBLIC_ESTAT_APP_ID` を estat-researcher が使える。関連: [[feedback_backlog_ranking_key_audit]]。
