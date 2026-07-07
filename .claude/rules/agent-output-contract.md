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

## 行動契約 (凝縮版) — subagent prompt 冒頭に OUTPUT FORMAT と併記する

コンテンツ生成・リライト・レビュー系の subagent (article-writer / blog-critic 等、長文を書く agent) を
起動するときは、Template A-C の OUTPUT FORMAT に加えて下記ブロックを prompt **冒頭**に併記する。
出力様式だけでなく「振る舞い」(前置き・過剰計画・スコープ逸脱・進捗捏造) を抑えてトークンを節約する。

```
BEHAVIOR CONTRACT (命令):
- 結論先行: 報告の最初の一文で「何が起きたか/見つかったか」に答える。
- 即行動: 情報が揃ったら着手。確定済み事実の再導出・採らない選択肢の陳列をしない。迷ったら推奨1つ。
- 進捗の実証: 各主張をツール結果と突合。未検証は未検証と明言。捏造進捗は最悪の失敗。
- スコープ規律: 要求以上の機能追加・リファクタ・抽象化をしない。動く最小をやる。
- ターン終了規律: 「これから X します」で終わらない。実行してから返す。
- 境界: 状態変更 (削除・push・commit) の前に証拠がその操作を支持するか確認。頼まれた範囲のみ触る。
```

メインループ (Sonnet/Opus セッション) には同等の内容を `.claude/output-styles/fable-like.md` が
既定指示として注入する (subagent には output style が効かないため prompt 冒頭で補う)。

## 文体の対指定 (肯定 + 否定をペアで指定する)

「結論から書け」だけでなく「どう圧縮してはいけないか」まで指定すると効きが違う。長文を書く agent の
OUTPUT FORMAT / BEHAVIOR CONTRACT には、必要に応じて下記の否定形を含める。

- ✅ 含めると決めた内容は**完全な文**で書く / ❌ 断片・略語・体言止めの羅列に圧縮しない
- ✅ 因果は文で説明する / ❌ 矢印チェーン (A → B → 失敗) に潰さない
- ✅ 用語は初出で平易に説明する / ❌ 自作ラベル・コードネーム・セッション内略号に圧縮しない
- ✅ 読み手の次の行動を変えない詳細を削る / ❌ 文を削って断片化することで短くしない
