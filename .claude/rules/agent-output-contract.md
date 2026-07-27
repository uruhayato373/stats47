# Agent 起動時の Task / 出力契約

Agent tool 経由で subagent を呼ぶ際は `.claude/rules/model-prompting.md` に従い、prompt の
**冒頭**に Task Capsule と Output Format を置く。短い単純作業では空の XML 項目を増やさない。

```xml
<task>
  <goal>達成する結果を一つ</goal>
  <scope>触る対象と要求外の境界</scope>
  <sources>読む SSOT と入力</sources>
  <done_when>観測可能な完了条件</done_when>
  <authorization>許可された外部変更</authorization>
</task>
<output_format>形式、列、件数、長さ</output_format>
```

- 制約は prompt 末尾ではなく **冒頭**（長い prompt の中に埋もれた指示は効きが弱い。実測では末尾指定が丸ごと無視された）
- 行数 / word 数 / 列構造を具体的に書く（「concise」「short」だけでは効かない。**出力の長さは effort を下げても減らないので、長さは明示的に指定する**）
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
docs/01_技術設計/ の 11 ファイルを KEEP/DELETE/MOVE-TO-REFERENCE に分類して。
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

TASK: docs/01_技術設計/ の 11 ファイルを KEEP/DELETE/MOVE-TO-REFERENCE に分類。
```
→ ~150 words に収まる

各 custom agent の Output Contract セクション (`.claude/agents/*.md`) も併せて参照すること。

## 行動契約 (凝縮版)

コンテンツ生成・リライト・レビュー系の subagent (article-writer / blog-critic 等、長文を書く agent) を
起動するときは、Task Capsule と Template A-C に加えて必要な行だけを prompt **冒頭**に置く。
goal / scope / sources / done_when は Task Capsule にあるため重複させない。

```
BEHAVIOR CONTRACT (命令):
- 結論先行: 報告の最初の一文で「何が起きたか/見つかったか」に答える。
- 進捗の実証: 証拠を指せる作業だけを完了と報告。未検証は未検証と明言。捏造進捗は最悪の失敗。
- 文章: 読み手の次の行動を変えない詳細を削り、含める内容は完全な文で書く。
```

メインループには `.claude/output-styles/fable-like.md` が既定指示として注入される。
subagent には output style が効かないため、必要な制約を Task Capsule へ固定する。

**自己検証を命じる文言 (「必ず検証して」「ダブルチェックして」「答える前に再確認して」) は
BEHAVIOR CONTRACT に足さない。** モデルは既定で自分の作業を検証するため、命じると過剰検証で
トークンだけが増える。決定的スクリプト (quality-gate / lint / audit 系) の実行はこれとは別物で、
ワークフロー手順として明示してよい。

## Review の扱い

review agent の最初の pass には severity の下限を付けず、証拠を伴う具体的 finding を全件出させる。
表示件数を抑える場合は、finding を得た後に severity / confidence / scope で機械的または統合側で
filter する。「重大な問題だけ探す」と依頼して探索範囲を先に狭めない。

## 文体の対指定 (肯定 + 否定をペアで指定する)

「結論から書け」だけでなく「どう圧縮してはいけないか」まで指定すると効きが違う。長文を書く agent の
OUTPUT FORMAT / BEHAVIOR CONTRACT には、必要に応じて下記の否定形を含める。

- ✅ 含めると決めた内容は**完全な文**で書く / ❌ 断片・略語・体言止めの羅列に圧縮しない
- ✅ 因果は文で説明する / ❌ 矢印チェーン (A → B → 失敗) に潰さない
- ✅ 用語は初出で平易に説明する / ❌ 自作ラベル・コードネーム・セッション内略号に圧縮しない
- ✅ 読み手の次の行動を変えない詳細を削る / ❌ 文を削って断片化することで短くしない
