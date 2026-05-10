# Agent 起動時の出力契約

Agent tool 経由で subagent を呼ぶ際は prompt の **冒頭** に Output Format テンプレを必ず含める。

- 制約は prompt 末尾ではなく **冒頭**（末尾の指示は agent に無視される）
- 行数 / word 数 / 列構造を具体的に書く（「concise」「short」だけでは効かない）
- agent が「説明欲」を満たす逃げ道として `Reason` カラムを許容するなど、contract 内で明示する

## Template A: table-only（推奨デフォルト）

```
OUTPUT FORMAT: 1 markdown table only.
Columns: <列名>
Cell content: ≤ 10 words each.
No prose before/after. No section headers.
If verdict needs justification, add a Reason column with ≤ 8 words.
```

## Template B: bullet list（列挙のみ）

```
OUTPUT FORMAT: bullet list only, ≤ N items.
Each bullet: ≤ 12 words. No nested bullets. No prose.
```

## Template C: report（調査の文章まとめが必要な場合のみ）

```
OUTPUT FORMAT: ≤ N words total. No headers.
Structure: 1 paragraph (findings) + 1 paragraph (recommendation).
```

## 悪い例 / 良い例

❌ NG（末尾に書いて無視されるパターン）:
```
docs/01_技術設計/ の 11 ファイルを KEEP/DELETE/MOVE-TO-D1 に分類して。
... (中略) ...
Report concisely — under 600 words.
```
→ 実測 ~2,200 words 返ってきた

✅ OK（冒頭に format を固定）:
```
OUTPUT FORMAT: 1 markdown table only.
Columns: File | Verdict | Reason
Cell content: ≤ 10 words. Reason ≤ 8 words.
No prose before/after.

TASK: docs/01_技術設計/ の 11 ファイルを KEEP/DELETE/MOVE-TO-D1 に分類。
```
→ ~150 words に収まる

各 custom agent の Output Contract セクション (`.claude/agents/*.md`) も併せて参照すること。
