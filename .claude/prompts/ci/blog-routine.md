<task>
  <goal>CI が接地・準備したブログ原稿を執筆し、機械ゲートと独立 critic を通して公開待ちに確定する</goal>
  <scope>`.local/ci/blog-targets.txt` に列挙された slug の `docs/21_ブログ記事原稿/<slug>/` だけ。R2 publish、git、workflow、rule、topic queue は変更しない</scope>
  <sources>CLAUDE.md、`.claude/skills/blog/write-prepared-article/SKILL.md`、`.claude/agents/{article-writer,blog-critic}.md`、各slugの `article.prompt.txt` と `data/`</sources>
  <done_when>各 target に article.md と200字以上の review.md があり、factual check・quality gate・critic PASS・最終 ingest がすべて成功する</done_when>
  <authorization>指定 slug の article.md、review.md、任意のogp/ogp.jsonの作成・修正まで</authorization>
</task>
<output_format>最後の返答は Slug | Factual | Quality | Critic | Published-ready のMarkdown表1つだけ。前後の文章は書かない</output_format>

BEHAVIOR CONTRACT:
- 証拠のある target だけを完了と報告する。未検証は未検証と明記する。
- ground truth にない数値を書かず、gate を緩めない。
- author と critic を同じコンテキストで兼任しない。

Agent の起動規約 (外すと成果が 0 件になる):

- Agent tool は必ず `run_in_background: false` で起動する。**既定は background** なので、
  省略すると「起動しただけ」でターンが終わる。「foreground で」と読み替えて省略しない。
- 未完了の agent を残したままターンを終えない。CI に次のターンは無いので、
  「完了通知を待つ」と述べて終えた時点で run ごと終了し、その slug は 0 件になる。

実行手順:

1. `.local/ci/blog-targets.txt` を読み、空なら変更せず終了する。
2. slug ごとに直列処理する。Agent tool で `article-writer` を foreground の別コンテキストで起動し、
   `article.prompt.txt` と `data/` だけを根拠に `article.md` を書かせる。
   Agent prompt のTask Capsuleに対象 slug を必ず明記する。初稿は `published: false`、
   `publishedAt: 未定` とする。
3. 次を実行し、blocker があれば author に対象箇所だけを外科修正させる。

```bash
node .claude/scripts/lib/article-factual-check.mjs \
  "docs/21_ブログ記事原稿/<slug>/article.md" \
  "docs/21_ブログ記事原稿/<slug>/data"
node .claude/scripts/blog/quality-gate.mjs \
  "docs/21_ブログ記事原稿/<slug>/article.md"
```

4. 機械ゲート成功後、Agent tool で `blog-critic` を author とは別の foreground コンテキストで起動する。
   Agent prompt のTask Capsuleに対象 slug を必ず明記する。
   critic は article.md と data/ をread-onlyで審査し、契約どおり200字以上の `review.md` を書く。
5. verdict が REVISE なら author に指摘箇所だけを直させ、factual check、quality gate、
   critic の順で再実行する。critic を通らない記事を PASS にしない。
6. PASS 後、次を実行して `published: true` の公開待ちに確定する。

```bash
node --conditions=react-server --import tsx \
  packages/ai-content/src/scripts/generate-blog-article.ts --ingest <slug>
```

禁止:

- target 外のファイル変更
- R2、GitHub、git commit / push、Issue、Secretsへのアクセス
- WebFetch / WebSearch / MCP
- article-writer 自身による review.md 作成
- review.md の形式だけを満たす根拠のない PASS
