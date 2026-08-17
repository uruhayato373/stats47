# Claude モデル別プロンプト設計

`CLAUDE.md`、`.claude/agents/*.md`、`.claude/skills/**/SKILL.md` に共通適用する
プロンプト設計の SSOT。モデル固有の長文を各 agent / skill に複製しない。

公式資料:

- [Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5)
- [Prompting Claude Fable 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5)
- [Prompting Claude Sonnet 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5)
- [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

## 共通の Task Capsule

複数ファイル、外部状態、曖昧な判断を含む依頼では、実行 prompt を次の順で組み立てる。
短い単純作業に空の項目や長い雛形を付けない。

```xml
<task>
  <goal>達成する結果を一つ</goal>
  <scope>触る対象と、要求外として止める境界</scope>
  <sources>読む SSOT、入力、既知の事実</sources>
  <done_when>観測可能な完了条件</done_when>
  <authorization>許可された外部変更。未指定ならローカル可逆操作まで</authorization>
</task>
<output_format>必要な形式と長さ</output_format>
```

- 長い資料は先に置き、質問と判断条件を末尾に置く。
- 指示、資料、例、可変入力を混ぜる場合だけ XML で分ける。
- 完了条件は結果を判定する決定的 gate にする。「よく考える」「念入りに確認する」のような
  行動の重複指示にしない。
- 事実主張は tool output、一次資料、repo の SSOT のいずれかへ結び付ける。証拠が無い値を
  推測で埋めず、`unknown` とする。
- 異なる解釈で成果物が実質的に変わる場合だけ確認する。通常の判断は scope 内で行う。

## Claude Opus 5

- 難しい coding / review では、断片的な追加指示を繰り返さず、完全な task specification を最初に渡す。
- visible response の長さは effort ではなく `output_format` で制御する。
- 最初の tool call 前は一文、作業中は重要な発見か方針変更時だけ、最後は結果から報告する。
- 「double-check」「自己検証」「答える前に再確認」「検証用 subagent」の指示を加えない。
  Opus 5 自身の検証傾向と重なり、token と待ち時間だけを増やす。
- lint、test、schema validation、HTTP probe のような**成果物を判定する決定的 gate**は残す。
  同じ入力へ根拠なく同じ gate を繰り返さない。
- code review は最初の pass でseverityを狭めず、具体的な全 findings を出させる。採否・優先度は
  別の決定的 filter または統合 pass で処理する。
- routine task は low / medium、通常の coding / review は high、最難関だけ xhigh を候補にする。
  effort は固定信仰ではなく repo 固有 eval の結果で選ぶ。thinking は有効のまま effort で費用を調整する。

## Claude Sonnet 5

- 明確な単一 work package、機械的編集、対象テスト、データ収集の既定 executor とする。
- routine は medium、通常実装は high、難しい multi-file coding だけ xhigh を候補にする。
- low / medium で複数段推論が必要な場合は、必要な判断点を task capsule に明示する。
- tool を使う作業は「提案」か「実装」かを goal で明示する。曖昧な「改善して」でscopeを広げない。

## Claude Fable 5

- 長期・複数 work package・曖昧性の高い end-to-end taskの orchestrator に限定する。
- 情報が揃ったら実行し、確定済み事実の再導出、採らない選択肢の列挙、周辺refactorを行わない。
- high を既定、routine coordination は medium、失敗コストが高い最難関だけ xhigh を候補にする。
- 長時間runは checkpoint ごとに事実、変更、未完了、次の一手を repo の正典へ記録する。
  作業時間や進捗率を根拠なく推定しない。
- **CI の無人ルーチンでは run 本体に使わない。** base-action の `--model` は run 全体に効くため、
  難物だけ上位モデルにしたい場合は run 本体を sonnet にして Agent tool で `model: fable` の
  subagent へ委譲する (`backlog-loop` がこの形。正典 `.claude/rules/backlog-loop.md`)。
  agent frontmatter の許可値は `check-agent-skill-consistency.cjs` の `allowedModels` が固定する。

## 委譲

- 大きく、独立し、並列化できる work package だけを委譲する。数回の tool callで終わる収集、
  自分の実装の再確認、同じ diff の重複reviewは委譲しない。
- 既定は子agent 0。必要なら1、独立したfile boundaryがある広い調査でも最大3。
- 複数writerを同じ working treeで並行させない。read-onlyの並列調査、または別worktreeだけを許す。
- agentを起動するpromptは `.claude/rules/agent-output-contract.md` に従い、goal、scope、inputs、
  done_when、出力上限を冒頭で固定する。
- agentの報告は証拠として扱わない。報告が指す file、diff、command outputを統合側が利用する。
  同じ作業を別agentへやり直させるのではなく、欠けた証拠だけを取得する。

## 成果物の長さ

会話とrepoに書く文書の双方で、タスクに必要な長さへ合わせる。背景の再説明、重複summary、
儀礼的な「次のステップ」、空の章を加えない。詳細仕様は既存referenceへ置き、SKILL.mdは
手順とroutingに絞る。

## Repo固有eval

promptやeffortの変更は、同じ入力・同じtool権限で次のcanaryを比較する。1回の印象で全体規約を変えない。

| Canary | 観測する失敗 |
|---|---|
| ENOENTの診断依頼 | 依頼されていない修正、根拠のない原因 |
| 単一UI component変更 | 周辺refactor、未実行testの完了報告 |
| code review | severity先行filter、file:lineの無い指摘 |
| R2/deployを含む依頼 | authorization境界の逸脱 |
| 長文資料の分類 | 指定format/件数/長さの超過 |
| 数回のreadで終わる調査 | 不要なsubagent起動 |

記録項目は factual error、scope violation、unsupported completion claim、tool call数、subagent数、
visible output量、token/cost、所要時間。保存する場合は
`.claude/state/metrics/prompt-evals/YYYY-MM-DD.json`へ置く。モデル、effort、promptの複数要因を
同時に変えず、採用条件を先に固定する。PRの静的checkerは構造driftを防ぐ床であり、実モデルevalの
代替ではない。
