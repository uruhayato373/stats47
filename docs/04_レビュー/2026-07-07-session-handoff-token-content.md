---
type: session-handoff
date: 2026-07-07
status: active
tags: [handoff, token, ai-content, x-batch, roadmap]
---

# セッションハンドオフ (2026-07-07) — X量産 / 100万PVロードマップ / トークン削減

このセッションの成果はすべて **ブランチ `claude/stats47-funnel-cta-q1dmk8` (PR #548, draft, →develop)** に載っている。
**develop には未マージ**。別 PC で作業する場合はまずこのブランチを checkout するか、PR #548 をマージしてから進める。

```bash
git fetch origin claude/stats47-funnel-cta-q1dmk8
git checkout claude/stats47-funnel-cta-q1dmk8
```

PR: https://github.com/uruhayato373/stats47/pull/548 (CI green・レビューコメント 0・mergeable)

---

## 1. このセッションで完了したこと (5 成果物)

### ① X 投稿量産システム (PR #548 の主内容)
X のランキング定型投稿を量産する基盤。型・画像・頻度の SSOT は `.claude/rules/sns-content-standards.md`
(§1 quota / §2-0 テンプレ 8種 / §2-8 相性表 / §2-9 画像カタログ)、機械参照は `.claude/scripts/lib/x-catalog.cjs`。
量産スキル `/post-x-batch` (候補選定→画像→執筆→lint→draft 登録、クラウド可) と、ローカル専用の投稿
`publish-x --from-queue` (Playwright・頻度ガード付き) で draft→scheduled→posted のライフサイクルが繋がった。
旧 post-x-6angles は廃止済み。

### ② 月間100万PVロードマップ (`docs/02_実装計画/16_月間100万PVロードマップ.md`)
トラフィック層の長期計画。T1 (月3万PV/GSC 4,000 clicks週・〜2026-09) → T2 (10万・〜2027-03) →
T3 (30万・〜2027-12) → T4 (100万・2028〜) のゲート駆動。NSM は週次収益のまま (doc01 と矛盾しない)。

### ③ TOKEN-CONTENT-01 — blog 製作の低トークン化
- `.claude/output-styles/fable-like.md` 新設 + `settings.json` で有効化 (メインループの結論先行・スコープ規律。
  **新セッションから効く**)
- `agent-output-contract.md` に「行動契約 (凝縮版)」+「文体の対指定」を追記 (subagent prompt 冒頭に併記する規約)
- blog-critic に full/delta 二相 (REVISE 再審査は前回指摘+変更 hunk のみ)。blog-critic に `model: sonnet` pin
- `build-remediation-queue.mjs` が reviewTier 付与 (GSC 上位30 = opus critic)。workflow 3本に反映済み

### ④ TOKEN-AICONTENT-01 — ai-content の低トークン化 (今回の最後の作業)
実測で「セッション消費の主因は critic 側」と特定し対策:
- `ranking-content-critic` に full/delta 二相 + **batch 起動 ≤10 key/agent** + **compact 読み**
  (jq で実コンテンツのみ。実測 -22%、jq コマンドは agent 定義に記載・3 key で完全性検証済)
- `ranking-content-author`: REVISE は指摘フィールドのみ外科修正 (全再生成禁止)
- `generate-ai-content` SKILL: **量産生成の既定はローカル CLI (haiku・セッション外)**、セッションは
  キュー管理+critic batch+公開段取りのみ

### ⑤ 行動契約の横展開
critic-review-protocol.md (全 critic 共通) / ranking-content-author / note-manager に参照追加。

---

## 2. 別 PC でやること (優先順)

### A. ai-content の量産生成 (★最優先・ローカル CLI が最安経路)
残キュー needsRegen **875 件** (`.claude/state/ai-content/remediation-queue.json`)。セッション内で生成しない。

```bash
cd stats47
NODE_OPTIONS='--conditions react-server' R2_PUBLIC_FETCH_URL=https://storage.stats47.jp \
  npm run ai:gen --workspace=@stats47/ai-content -- \
  --model claude-haiku --concurrency 3 --limit 50 \
  >> /tmp/ai-content-gen.log 2>&1 &
tail -f /tmp/ai-content-gen.log
```

生成後のフロー: staging (audit ゲート通過分のみ) → セッションで critic を **batch (≤10 key/agent・
compact 読み・REVISE は delta)** で回す → commit → CI `publish-ai-content.yml` が R2 公開 (MAX_PUBLISH=40/run)。
critic の起動手順は `generate-ai-content/SKILL.md` の「critic の起動方法」節に記載済み。

### B. X 量産の初回稼働 (X-BATCH-01)
1. (前提) X メトリクス再収集: `/update-sns-metrics --platform x` — 勝ちパターン分析の前提 (2026-04 で凍結中)
2. クラウド/どこでも: `/post-x-batch --count 14` で draft 14 本登録
3. **ローカルのみ**: `npx tsx .claude/skills/sns/publish-x/publish-x.ts --from-queue --dry-run` (初回必須)
   → 問題なければ `--dry-run` を外して予約 → `node .claude/scripts/sns/promote-scheduled-x.cjs --apply`

### C. PR #548 のマージ判断 (人間)
draft のまま。CI green。マージすると develop に全成果物が乗る (ai-content の staging publish も develop 前提)。

### D. 効果判定の期日 (先の話・忘備)
- TOKEN-CONTENT-01 / TOKEN-AICONTENT-01: **2026-08-04** — 次回バッチの token/記事・token/key を実測 vs baseline
  (blog 217K/記事、ai-content は per-key 起動+全文読)。品質は critic PASS 率で同等確認
- X-BATCH-01: 4 週後に imp/フォロワー実測

---

## 3. 注意点

- **output style は新セッションから有効** (`settings.json` の `outputStyle: "fable-like"`)。応答が結論先行に
  なっていれば効いている
- ai-content の生成は **haiku 既定** (`generate-parallel.ts`)。ゲート (audit) + critic (sonnet/opus 傾斜) が
  品質を担保する設計なので、生成モデルを上げる必要はない
- blog の一括是正は **1 バッチ 15-20 本** (mass-rewrite 24.3M token 事故の再発防止)。キューは
  `build-remediation-queue.mjs --next N` で払い出す
- このセッションの PR #548 監視 (1時間おき自己チェックイン) はセッション終了とともに止まる。
  マージ/クローズで自然終了
