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
- `generate-deterministic-backfill.ts` (`ai:backfill -- --manifest <json>`): immutable manifest を対象に、R2 観測値から
  順位・同率・平均との差・地域内順位・上位集中度を決定的に計算して 4 セクションを生成する大規模 backfill 経路。
  既存ファイルは既定で skip、再生成は `--force`。全件 audit + R2 SHA readback を必須とし、モデルは代表的な境界ケースの
  意味レビューに限定する。通常の個別改善・独自考察は従来の author + critic 経路を使う。
- 実行 env: `NODE_OPTIONS='--conditions react-server' R2_PUBLIC_FETCH_URL=https://storage.stats47.jp`。
- 出力 = `AiContentSnapshotRow` (faq/prefectureCommentary は **JSON 文字列**、insights/regionalAnalysis は Markdown)。

**決定的ゲート**: `.claude/scripts/ai-content/audit-ai-content.mjs`。blocker = 括弧内数値挿入 (全面禁止)・NGワード
(ワースト/ベスト/激減/急増/衝撃)・insights空・faq parse/推測表現・prefectureCommentary空/parse。warn = 字数・pref件数(47以外)・因果。
`auditRow(row)` を export (再入可能) し CLI とキューが同一判定 = drift 防止。意味レビューは `ranking-content-critic`。

**SSOT 是正キュー (中断耐性・複数PC安全)**: `.claude/state/ai-content/remediation-queue.json` + `LATEST.md`。
**done は手動ログでなく「R2 の ai-content が auditRow を通る(blocker 0)か」で毎回再導出** = R2 が真実源、キューは派生ビュー。
- quarantine は generation-failures の履歴全体ではなく、現在も `needs-regen` のキーとの積集合だけを LATEST / `--next` に表示する。公開済みへ直ったキーを未解決扱いしない。
- 生成: `node .claude/scripts/ai-content/build-ai-content-queue.mjs` (GSC 流入のある /ranking/ 924件を R2 で判定。
  2026-06-21 実測 done 40 / needs-regen 884 = incomplete 825・missing 39・blocker 20)。
- 再開手順 (どのセッション/PC からでも): build-queue (再構築=done 再導出) → `--next 15` (GSC impressions 降順) →
  `ai:verify --stdin` (再生成不能を除外) → 検証済 10件で ranking-content-author 並列起動 → 独立 audit →
  `diff-push-r2 --prefix app/ranking` → build-queue 再実行で done 反映。中断しても 1 からやり直せる。

**R2 push (本番反映)**: 書き込みはCI専用。`data/ai-content-staging/<key>.json` をdevelopへ送り、
`publish-ai-content.yml` の監査→R2反映→cache purge→outbox整理を使う。ローカルS3書き込みで代用しない。
公開は明示承認の範囲に限定し、成功ログだけでなくR2本文のSHAを読み戻して確認する。

**SEO の勘所**: 高流入ページの大半は **incomplete** (faq/考察/地域別はあるが prefectureCommentary 欠落)。真の missing
(完全空) は低流入ニッチが大半。→ SEO 目的なら「missing を端から」でなく **GSC 流入のある incomplete を優先** (キューが自動でそう並べる)。
効果 (CTR/順位) は GSC で数週間後に実測が要る (未実証、`evidence-based-judgment.md`)。

**最新実測（2026-09-08 00:30 JST）**: TS active prefecture / KNOWN / R2 master / 全量queueは
すべて2,166キー、双方向差分0。done 2,166 / needs-regen 0 / notEligible 0 / doneButUnhealthy 0。
AIとcanonical valuesを各2,166件HTTP 200・JSON取得し、values健全性の未確認も0だった。
追加12件は独立critic・数値監査後、[run 34137832197](https://github.com/uruhayato373/stats47/actions/runs/34137832197)
でR2公開し、本文SHA 12/12一致。公開outboxもCIが整理済み（git履歴から復元可能）。
全件doneは既存の決定的ゲートでblockerが無いことを意味し、旧2,154件を今回すべて意味レビューしたわけではない。
非阻害警告はAI 969キー（短文等）、values 41キー（thin-coverage）に残る。市区町村・全国専用ページは対象外。
日次CIは対象0ならAPIを呼ばず正常終了し、対象ありならbilling preflight不通で停止する。
無料枠の課金設定は未確認で、課金・Secretは変更していない。生成完了と費用実験の完了を混同しない。

前回実測 2026-09-07: R2 active 2,154 / done 2,154 / needs-regen 0。残863件を immutable manifest で backfill し、
全863件 audit blocker/warn 0、数値照合863/863、代表10件の意味レビュー PASS、公開R2 SHA readback 863/863一致を確認。
**入力一致の再確認（2026-09-07夜）**: 過去の北海道7361.6≠6815.9という記録は、最新mainを含む隔離環境と
元checkoutの両方で再現せず、`road-national-route-length` の2023年47行がcanonical `app/stats`と完全一致した。
現行経路は `build-input.ts` → `listRankingValues` → `readStatsValues` で、配信用snapshotを正典へ格上げしない。
過去の不一致原因は未確定で、修正したとは扱わない。`packages/ai-content/src/scripts/__tests__/build-input.test.ts` は
実観測readerを通し、指定年の値・欠測除外・実在0の維持・正典不在時の生成停止を固定する。

**全件完了の母集団**: 古いキューのdone件数だけでは追加指標を取りこぼす。新規公開後はR2 masterから全量キューを
再構築し、active prefectureのTS/KNOWN集合とも突合する。2026-09-07に旧2154件のキューから3指標が欠落し、
その3件はactive・最新47観測あり・AIは404だった。件数の足し算で全件完了とせず、集合差分と最新R2監査で判定する。

関連: [[feedback_evidence_based_judgment]] [[project_ranking_publish_pipeline_gap]] [[feedback_shared_working_copy_git_race]]
