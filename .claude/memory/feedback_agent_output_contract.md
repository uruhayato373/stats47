---
name: Agent 起動時の Task / Output Contract
description: Agent tool 呼び出し時は prompt 冒頭で Task Capsule + OUTPUT FORMATを固定する。モデル別規律と委譲上限はmodel-prompting.mdがSSOT。
type: feedback
originSessionId: a1901524-b4eb-4b4b-8590-5c5f7395cde7
---
Agent tool / Task 経由で subagent を起動するときは、prompt の **冒頭** でgoal/scope/sources/
done_when/authorizationと出力形式を明示する。
末尾に「concise」「under N words」と書くだけでは無視される。

**Why**: 2026-05-05 session で Explore agent に "Report concisely — under 600 words" を末尾に書いて呼び出したところ、~2,200 word の per-file 詳細レポートが返ってきた (ファイル毎に Type分類 / Summary / D1候補 / Authority check を全展開)。token を急激に消費する原因になった。

**How to apply**:

1. `.claude/rules/model-prompting.md` と `.claude/rules/agent-output-contract.md` を参照し、Task CapsuleとTemplate A/B/Cをprompt冒頭に置く。
2. 「concise」「short」など抽象語ではなく、行数 / word 数 / 列構造を具体的に書く。
3. agent が説明欲を満たす逃げ道として `Reason` カラム (≤ 8 words) を許容するなど、contract 内で明示する。
4. Custom agent (`.claude/agents/*.md`) を呼ぶ場合は、各 agent の `## Output Contract` セクションに固有の主要列が定義されている — それを参照して prompt に展開する。
5. 探索系 (調査が本質で表に収まらない) の場合のみ Template C (report、定量制約付き) を使う。`strategy-advisor` は定性分析が本質のため例外的に C 中心。

**改善後の期待値**: 同じ docs cleanup 依頼を新ルールで再実行した場合、~150 word の table に収まる (1/15 サイズ)。

**運用上の注意**: 共通契約を各agent/skillへ複製しない。全custom agentのmodel/Output Contract、
全active skillのowner、委譲上限3は`check-agent-skill-consistency.cjs`がPR/週次で検査する。
