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
- 列構造・件数の単位・読み手の用途を具体的に書く（「concise」「short」だけでは効かない。**出力の長さは effort を下げても減らないので、形式で指定する**）
- 判定に理由が要る場合は `Reason` 列を用意し、contract 内で明示する

## Template A: table-only（推奨デフォルト）

```
OUTPUT FORMAT: 1 markdown table only.
Columns: <列名>
Cell content: one short phrase per cell; the table is scanned, not read.
No prose before/after. No section headers.
If verdict needs justification, add a Reason column (one phrase).
```

## Template B: bullet list（列挙のみ）

```
OUTPUT FORMAT: bullet list only, one item per finding.
Each bullet is one plain sentence. No nested bullets. No prose.
```

## Template C: report（調査の文章まとめが必要な場合のみ）

```
OUTPUT FORMAT: only as long as the findings require; the caller reads it to decide the next action. No headers.
Structure: 1 paragraph (findings) + 1 paragraph (recommendation).
```

## 起票候補 (全 template 共通・必須)

subagent の最終報告は、形式に関係なく最後に「起票候補」を置く。作業中に見つけた依頼範囲外の不具合・改善点・
再発しうる誤り・環境の問題を 1 件 1 文で書き (複数は「;」区切り)、無ければ「なし」と書く。依頼の範囲内で
直したものは書かない。推測ではなく、証拠を指せるものだけを書く。

- Template A は表の最終行を起票候補の行にする (列が 2 列でない表は、表の下に起票候補の 1 行を置く)。B / C は最終行を「起票候補:」で始める
- prompt の OUTPUT FORMAT にこの行を書き忘れても省かない (呼び元はこの行を前提にする)
- 呼び元は「なし」以外を `.claude/todo/backlog.md` (未完了の行動) か `.claude/memory/` (恒久の教訓) に記録してから
  turn を終える。記録しないものは返答に「起票しない: <理由>」と書く。Stop hook `check-findings-on-stop.js` が
  記録の無い候補を 1 回差し戻す
- 呼び元自身の課題も同じ。返答で残作業に触れる段落にはカード ID か PR を書き、TaskCreate のタスクは完了にするか起票する
  (同じ hook が、ID も PR も無い「残作業」「後で対応」の段落と、未完了のタスクを差し戻す)

## 悪い例 / 良い例

❌ NG（末尾に書いて無視されるパターン）:
```
docs/01_技術設計/ の 11 ファイルを KEEP/DELETE/MOVE-TO-REFERENCE に分類して。
... (中略) ...
Report concisely.
```

✅ OK（冒頭に format を固定）:
```
OUTPUT FORMAT: 1 markdown table only.
Columns: File | Verdict | Reason
Cell content: one short phrase. Reason: one phrase.
No prose before/after.

TASK: docs/01_技術設計/ の 11 ファイルを KEEP/DELETE/MOVE-TO-REFERENCE に分類。
```

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
