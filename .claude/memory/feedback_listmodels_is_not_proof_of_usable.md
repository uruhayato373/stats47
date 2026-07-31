---
name: feedback-listmodels-is-not-proof-of-usable
description: Gemini の ListModels に載っていて supportedGenerationMethods に generateContent があっても、実際に叩くと 404 になることがある (提供終了)。一覧照合の preflight は壊れたパイプラインを素通りさせるので、可否は必ず極小の実生成で判定する。
metadata:
  node_type: memory
  type: feedback
  originSessionId: b5a19ac6-10c3-5f59-a191-0fecb1732eb4
---

外部 API の「使えるか」を **一覧・メタデータで代理判定してはならない**。実際の操作を 1 回試すのが唯一の証明。

**Why:** 2026-07-30、ai-content の日次 cron (`ai-content-generate-daily.yml`) が 40 件すべて HTTP 404 で失敗し、
生成 0 件で終わっていた。しかも `generate-parallel.ts` が全件失敗でも exit 0 を返すため **workflow は
success** で、毎晩失敗し続けても誰も気づかなかった (silent green)。

再発防止として preflight を作ったが、最初の実装は **ListModels の一覧照合**だった。CI で実測すると
`gemini-2.5-flash` は一覧に載り `supportedGenerationMethods` に `generateContent` を持つ。つまり
**その preflight は「✅ 利用可能」と報告し、壊れたパイプラインを素通りさせた**。実生成に切り替えて
再実行して初めて `bad-request (HTTP 404)` を捕まえ、旧モデルが「一覧に残ったまま generateContent
だけ提供終了」していることが確定した (2026-07-31)。

**How to apply:**
- 外部 API を使う preflight / ヘルスチェックは、**本番と同じ操作を最小規模で 1 回実行**して判定する。
  一覧・カタログ・メタデータの照合は「落ちたときの診断材料」にしか使わない
- ゲートを書いたら **落ちる側も実際に落ちることを確認**する。全部 PASS は「ゲートが何も見ていない」
  状態と区別がつかない (今回はまさにそれだった)
- バッチ処理は「1 件も成果が出なかったら異常終了」させる。部分的な失敗は成功扱いでよいが、
  ゼロ成果の silent green は必ず塞ぐ (`packages/ai-content/src/services/generation-outcome.ts`)
- モデル名は pinned にする。浮動 alias (`gemini-flash-latest` 等) は 404 を避けられる代わりに
  品質もコストも黙って変わる。提供終了は preflight が検出するので pinned で困らない
- HTTP status の切り分け: 無効キーは **400** (`API_KEY_INVALID`)。**404 はモデル名**を疑う
- 正典: `.claude/rules/ranking-content-standards.md` §生成パイプライン /
  実装 `packages/ai-content/src/scripts/preflight-gemini.ts`
