---
name: Agent 起動時の Output Contract
description: Agent tool 呼び出し時は prompt 冒頭で OUTPUT FORMAT (Template A/B/C) を必ず指定する。末尾の word limit は無視されるため。
type: feedback
originSessionId: a1901524-b4eb-4b4b-8590-5c5f7395cde7
---
Agent tool / Task 経由で subagent を起動するときは、prompt の **冒頭** で出力形式を明示する。
末尾に「concise」「under N words」と書くだけでは無視される。

**Why**: 2026-05-05 session で Explore agent に "Report concisely — under 600 words" を末尾に書いて呼び出したところ、~2,200 word の per-file 詳細レポートが返ってきた (ファイル毎に Type分類 / Summary / D1候補 / Authority check を全展開)。token を急激に消費する原因になった。

**How to apply**:

1. CLAUDE.md の「Agent 起動時の出力契約」セクションを参照。Template A (table-only) / B (bullet) / C (report) のいずれかを prompt 冒頭で必ず指定する。
2. 「concise」「short」など抽象語ではなく、行数 / word 数 / 列構造を具体的に書く。
3. agent が説明欲を満たす逃げ道として `Reason` カラム (≤ 8 words) を許容するなど、contract 内で明示する。
4. Custom agent (`.claude/agents/*.md`) を呼ぶ場合は、各 agent の `## Output Contract` セクションに固有の主要列が定義されている — それを参照して prompt に展開する。
5. 探索系 (調査が本質で表に収まらない) の場合のみ Template C (report、定量制約付き) を使う。`strategy-advisor` は定性分析が本質のため例外的に C 中心。

**改善後の期待値**: 同じ docs cleanup 依頼を新ルールで再実行した場合、~150 word の table に収まる (1/15 サイズ)。

**運用上の注意**: Output Contract を変更したら CLAUDE.md と 16 個の `.claude/agents/*.md` を **同時に更新** すること (片方だけ更新すると drift する)。
