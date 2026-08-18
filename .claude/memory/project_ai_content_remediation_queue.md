---
name: project_ai_content_remediation_queue
description: ranking ai-content (考察/地域別/FAQ/県別解説) の DBレス生成パイプライン + 状態付き是正キュー (中断耐性・複数PC安全)。次に何を直すか/done かの SSOT
metadata:
  node_type: memory
  type: project
---

ranking 詳細ページの AI コンテンツ (insights=考察 / regionalAnalysis=地域別 / faq / prefectureCommentary=県別解説)
は完全DBレス移行 (`7569bd5c`) で生成パイプラインごと削除され凍結データ化していた。2026-06-21 に DBレス再構築 +
状態付き是正キューを整備した。

**生成パイプライン (D1 非依存・`packages/ai-content/src/scripts/`)**:
- `build-input.ts` (`ai:input -- <key>`): R2 観測値 `app/stats/<key>/values.json` + `app/ranking/<key>/item.json` →
  `RankingContentInput` + prompt 文字列 (純 read)。`buildRankingContentInput` を export。
- `verify-inputs.ts` (`ai:verify -- --stdin`): key 群が build-input 可能か一括判定 (再生成可否)。
  ★values.json が 200 でも item.latestYear 欠落で再生成不能なキーがある (例 public-phone-count)。agent に投げる前に弾く。
- `generate-parallel.ts` (`ai:gen`): buildInput → claude/gemini CLI 生成 → audit ゲート (blocker 0 のみ採用) →
  staging `.local/r2/app/ranking/<key>/ai-content.json` 書込。**claude CLI は Claude Code セッション内で stdin 制限により
  動かない** → 大量バッチはユーザー端末/CI。少数はエージェント駆動 (ranking-content-author) でセッション内可。
- 実行 env: `NODE_OPTIONS='--conditions react-server' R2_PUBLIC_FETCH_URL=https://storage.stats47.jp`。
- 出力 = `AiContentSnapshotRow` (faq/prefectureCommentary は **JSON 文字列**、insights/regionalAnalysis は Markdown)。

**決定的ゲート**: `.claude/scripts/ai-content/audit-ai-content.mjs`。blocker = 括弧内数値挿入 (全面禁止)・NGワード
(ワースト/ベスト/激減/急増/衝撃)・insights空・faq parse/推測表現・prefectureCommentary空/parse。warn = 字数・pref件数(47以外)・因果。
`auditRow(row)` を export (再入可能) し CLI とキューが同一判定 = drift 防止。意味レビューは `ranking-content-critic`。

**SSOT 是正キュー (中断耐性・複数PC安全)**: `.claude/state/ai-content/remediation-queue.json` + `LATEST.md`。
**done は手動ログでなく「R2 の ai-content が auditRow を通る(blocker 0)か」で毎回再導出** = R2 が真実源、キューは派生ビュー。
- 生成: `node .claude/scripts/ai-content/build-ai-content-queue.mjs` (GSC 流入のある /ranking/ 924件を R2 で判定。
  2026-06-21 実測 done 40 / needs-regen 884 = incomplete 825・missing 39・blocker 20)。
- 再開手順 (どのセッション/PC からでも): build-queue (再構築=done 再導出) → `--next 15` (GSC impressions 降順) →
  `ai:verify --stdin` (再生成不能を除外) → 検証済 10件で ranking-content-author 並列起動 → 独立 audit →
  `diff-push-r2 --prefix app/ranking` → build-queue 再実行で done 反映。中断しても 1 からやり直せる。

**R2 push (本番反映)**: ローカルから可能。`.env.local` に R2_ACCESS_KEY_ID/SECRET/S3_ENDPOINT あり。
`npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix app/ranking` が `.local/r2/app/ranking/` を読んで push
(manifest 差分で変更分のみ)。outward-facing なので明示確認してから。ページは SSG/ISR で即時反映には `/purge-cdn`。

**SEO の勘所**: 高流入ページの大半は **incomplete** (faq/考察/地域別はあるが prefectureCommentary 欠落)。真の missing
(完全空) は低流入ニッチが大半。→ SEO 目的なら「missing を端から」でなく **GSC 流入のある incomplete を優先** (キューが自動でそう並べる)。
効果 (CTR/順位) は GSC で数週間後に実測が要る (未実証、`evidence-based-judgment.md`)。

進捗 2026-06-21: 111件 本番反映 (バッチ1=複合11 + バッチ2-6=GSC流入優先、最大30並列)。queue done 130 / needs-regen 794。
★build-input.ts の `meta.input.allPrefectures` が canonical R2 値と不一致のキーあり (road-national-route-length: 北海道 7361.6≠正6815.9)。agent は R2 `app/ranking/<key>/values.json` を SSOT 採用して回避済だが、build-input.ts の allPrefectures 算出は要調査。正典: `.claude/todo/05_機能バックログ.md`
`[AICONTENT-DBLESS-REBUILD]`。担当 `ranking-content-author` / `ranking-content-critic`。

関連: [[feedback_evidence_based_judgment]] [[project_ranking_publish_pipeline_gap]] [[feedback_shared_working_copy_git_race]]
