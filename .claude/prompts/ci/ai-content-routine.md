<task>
  <goal>CI が選んだ ranking ai-content を生成し、機械ゲートと独立 critic を通った成果だけを outbox に置く</goal>
  <scope>`.local/ci/ai-content-targets.txt` に列挙された key と、その key の prompt・outbox・review manifest だけ。R2 publish、git、workflow、rule、queue は変更しない</scope>
  <sources>CLAUDE.md、`.claude/skills/content/generate-ai-content/SKILL.md`、`.claude/agents/ranking-content-{author,critic}.md`、`.local/ci/ai-content-prompts/<key>.txt`</sources>
  <done_when>各 target に `data/ai-content-staging/<key>.json` があり、`audit-ai-content.mjs --file` が成功し、別コンテキストの critic が PASS し、review manifest がある</done_when>
  <authorization>指定 key の outbox と `.local/ci/ai-content-reviews/` の作成・修正まで</authorization>
</task>
<output_format>最後の返答は Key | Audit | Critic | Output のMarkdown表1つだけ。前後の文章は書かない</output_format>

BEHAVIOR CONTRACT:
- 証拠のある target だけを PASS と報告する。未生成・未監査・未審査は PASS にしない。
- gate を緩めたり、監査結果を推測したりしない。
- 数値は target ごとの prebuilt prompt にある観測値だけを使う。

Agent の起動規約 (外すと成果が 0 件になる):

- Agent tool は必ず `run_in_background: false` で起動する。**既定は background** なので、
  省略すると「起動しただけ」でターンが終わる。「foreground で」と読み替えて省略しない。
- 未完了の agent を残したままターンを終えない。CI に次のターンは無いので、
  「完了通知を待つ」と述べて終えた時点で run ごと終了し、その key は 0 件になる。
- 同時に起動する author は 1 件だけ。次の key はその key の critic が PASS してから着手する。

実行手順:

1. `.local/ci/ai-content-targets.txt` を読み、空なら変更せず終了する。
2. 各 key を直列に処理する。Agent tool で `ranking-content-author` を foreground の別コンテキストで起動し、
   `.local/ci/ai-content-prompts/<key>.txt` に従って
   `data/ai-content-staging/<key>.json` を `AiContentSnapshotRow` 形式で書かせる。
   Agent prompt のTask Capsuleに対象 key を必ず明記し、起動時に model を上書きしない。
3. `node .claude/scripts/ai-content/audit-ai-content.mjs --file data/ai-content-staging/<key>.json`
   を実行する。blocker があれば同じ author に blocker と対象fieldだけを渡して外科修正し、再実行する。
4. audit 成功後に Agent tool で `ranking-content-critic` を author とは別の foreground コンテキストで起動する。
   Agent prompt のTask Capsuleに対象 key を必ず明記する。
   critic は生成JSONと対応promptだけを読み、重複・読者価値・中立トーンを審査する。critic にファイルを編集させない。
5. critic が REVISE なら author に指摘fieldだけを直させ、audit と critic を再実行する。
   PASS できない key は review manifest を作らない。
6. PASS の key だけ、親コンテキストが
   `.local/ci/ai-content-reviews/<key>.json` を次の形式で書く。

```json
{
  "rankingKey": "<key>",
  "reviewer": "ranking-content-critic",
  "verdict": "PASS"
}
```

禁止:

- target 外のファイル変更
- R2、GitHub、git commit / push、Issue、Secretsへのアクセス
- WebFetch / WebSearch / MCP
- author 自身による critic 判定
- blocker を残した outbox や、critic 未実施の review manifest
