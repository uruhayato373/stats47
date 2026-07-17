---
type: session-handoff
date: 2026-07-16
status: active
tags: [buzz-map, blog, p1, claude-code, implementation-prompt]
---

# Claude Code実行プロンプト: buzz-map P1記事群

以下のコードブロック全体を、stats47リポジトリのルートで開いたClaude Codeへ一度だけ渡す。

```text
Output Format:
- 最初に「成功条件 / 変更対象 / 変更しない対象 / 実行順 / 検証方法」を20行以内で提示する。
- 作業中は5記事ごとに「drafted-pass / reuse-existing / blocked-data / rejected-framing / failed-gate / 次のID」の件数だけを報告し、確認待ちで停止しない。
- 最終報告は「結果 / 30件の状態表 / 作成記事 / 再利用記事 / blocked・failedの根拠 / 検証結果 / 未実行 / 変更ファイル」の順にする。
- 30件の状態表は P1 ID | slug | terminal status | factual | quality | critic | reason の列を持つ。
- 失敗、スキップ、未検証を隠さず、未処理を完了扱いしない。

BEHAVIOR CONTRACT:
- 結論先行: 報告の最初に何が完了したかを明示する。
- 即行動: 必読資料と現状を確認したらP1-01から着手し、計画だけで終了しない。
- 進捗の実証: PASSの主張は実際のcommand exit codeとreview.mdで確認する。
- スコープ規律: 記事作成に不要な機能追加、refactor、dependency追加をしない。
- ターン終了規律: 5記事のcheckpointでユーザー回答を待たず、次waveへ進む。
- 境界: commit、push、PR、deploy、R2 publish、SNS投稿・予約を行わない。

TASK:
buzz-mapのP1記事候補30件を、一つのClaude Code作業セッションで順番に処理してください。
ユーザーからの指示は一度だけですが、記事生成自体は必ず1記事ずつ完結させます。
30記事を一つのwriter promptへまとめたり、品質検査を最後にまとめたり、新しい一括生成
scriptを作ったりしないでください。

まず必ず全文を読む:
1. `CLAUDE.md`
2. `.claude/memory/MEMORY.md`
3. `.claude/rules/blog-quality-standards.md`
4. `.claude/rules/blog-data-schema.md`
5. `.claude/rules/estat-api.md`
6. `.claude/rules/gis-data.md`
7. `.claude/rules/skill-code-placement.md`
8. `.claude/rules/docs-vs-issues.md`
9. `.claude/rules/agent-output-contract.md`
10. `.claude/skills/blog/draft-from-trend/SKILL.md`
11. `.claude/skills/blog/md-syntax/SKILL.md`
12. `.claude/skills/blog/generate-article-charts/SKILL.md`
13. `.claude/skills/blog/blog-review/SKILL.md`
14. `.claude/skills/blog/SHARED-failure-cases.md`
15. `docs/01_技術設計/12_完全DBレス設計.md`
16. `docs/01_技術設計/07_情報設計.md`
17. `docs/02_実装計画/27_buzz-map集客ゲート統合仕様.md`の§10.5〜§10.7

開始前監査:
- `git status --short`を確認し、既存の未コミット変更を記録する。
- 他セッションの変更を修正、整形、削除、stash、commitしない。
- `https://storage.stats47.jp/app/blog/all.json`、`apps/web/src/config/blog-redirects.ts`、
  `apps/web/src/config/gone-blog-slugs.ts`、既存`docs/21_ブログ記事原稿/`を棚卸しする。
- P1のslug候補と既存記事を意味・対象単位・年度・算式で比較する。単語一致だけで判定しない。
- 既存記事でSNSの問いを満たす候補は`reuse-existing`とし、新規記事を作らない。

処理対象と順序:
- `docs/02_実装計画/27_buzz-map集客ゲート統合仕様.md` §10.6のP1-01〜P1-30。
- Wave 1=P1-01〜05、Wave 2=06〜10、Wave 3=11〜15、Wave 4=16〜20、
  Wave 5=21〜25、Wave 6=26〜30。
- 順番を飛ばさない。blockedでも終端状態と根拠を記録して次へ進む。

各P1候補で必ず次を直列実行する:

Step A: landing・重複判定
1. 既存ranking/blog/themeが読者の問い、対象単位、年度、算式を満たすか確認する。
2. 満たす場合は`reuse-existing`としてURLと一致根拠を記録し、記事を作らない。
3. 近いだけで単位や算式が違う場合は流用せず、新規記事のdata contractへ進む。

Step B: data contractと実在確認
1. 設計書の骨子から対象単位、母数、年度、派生式、一次出典、欠損処理を確定する。
2. 使用するmetric keyは`packages/data-configs/src/metrics/<key>.ts`の実在を確認する。
3. R2を使う場合は`https://storage.stats47.jp/app/stats/<key>/values.json`のHTTP 200と
   schemaを確認する。存在しないkeyを推測で作らない。
4. GIS/市区町村データは既存KSJ/GSI/e-Stat資産を優先し、同一境界・同一年へ揃える。
5. Webから補う場合は政府・自治体等の一次資料に限定し、利用条件と取得日を残す。
6. 必要なdataが取得不能、比較不能、権利不明なら`blocked-data`として具体的な不足を記録する。
7. 集計結果がタイトルの問いを成立させない場合は、事実に沿う一つの角度へ変更する。
   それでも読者価値がない場合は`rejected-framing`とし、結論を捏造しない。

Step C: 1記事の下書き生成
1. `.claude/skills/blog/draft-from-trend/SKILL.md`を1記事だけに適用する。
2. `docs/21_ブログ記事原稿/<slug>/article.md`と`data/`を作る。
3. frontmatterは`published: false`にする。
4. 本文の数値・順位はdata JSONにある値だけを使用する。
5. ですます調、短いtitle、curiosity gap 1個、導入200〜400字、Markdown table禁止、
   callout 3〜4個、内部リンク3〜5本、各図直下のsource-linkを守る。
6. P1骨子の問い、図、CTA、riskNotesを反映する。ただし実データと矛盾する仮タイトルや
   answerは修正する。
7. 決定的な派生処理は既存utilityを使う。単発変換の中間ファイルは`/tmp/`へ置く。
8. 3記事以上で再利用する新規scriptが本当に必要な場合だけ`skill-code-placement.md`に従う。
   記事を作るためだけの独自CMS、DB、manifest、batch frameworkは作らない。

Step D: chart・factual・quality
1. `node .claude/scripts/blog/generate-article-charts.ts --slug <slug>`を実行する。
2. SVG validateを実行し、errors=0を確認する。
3. `node .claude/scripts/lib/article-factual-check.mjs \
   "docs/21_ブログ記事原稿/<slug>/article.md" \
   "docs/21_ブログ記事原稿/<slug>/data"`をexit 0まで反復する。
4. `node .claude/scripts/blog/quality-gate.mjs \
   docs/21_ブログ記事原稿/<slug>/article.md`をexit 0まで反復する。
5. placeholder、架空のmetric key、図と本文の値ずれ、未出典の外部数値を残さない。

Step E: 独立critic
1. article-writerと別contextの`blog-critic`をAgent toolで起動する。
2. Agent起動は`mode: "bypassPermissions"`を使う。
3. Agent prompt冒頭へ`.claude/rules/agent-output-contract.md`のOutput Formatと
   Behavior Contractを置く。
4. 初回はfull/expert、REVISE後は前回指摘と変更hunkだけを渡すdelta reviewにする。
5. writerとcriticを同時実行しない。同じarticle directoryを複数agentが同時編集しない。
6. `docs/21_ブログ記事原稿/<slug>/review.md`が実体200字以上、`verdict: PASS`になるまで
   writer修正→delta reviewを反復する。
7. factual/quality/criticを解消できない場合は`failed-gate`とし、PASSを偽装しない。

checkpoint:
- 各記事終了時にterminal statusと検証exit codeを内部記録する。
- 各Wave終了時に6状態の件数、次のP1 ID、共通blockerだけを報告する。
- checkpointは停止点ではない。そのまま次Waveへ進む。
- token/context節約のため、writer/criticへ他29件の全文を渡さない。
- session compaction後も処理済みIDを再生成せず、次の未処理IDから継続する。
- session limit等で物理的に継続不能な場合だけ、
  `docs/handoffs/YYYY-MM-DD-buzz-map-p1-batch-progress.md`へ処理済み状態、検証結果、
  次のID、blockerを残す。未処理を完了と書かない。

全体完了条件:
- P1-01〜P1-30の全件が`drafted-pass / reuse-existing / blocked-data /
  rejected-framing / failed-gate`のいずれかになっている。
- `drafted-pass`はarticle.md、data JSON、SVG、review.md PASSが実在する。
- 全article.mdが`published: false`である。
- 各`drafted-pass`でfactual-checkとquality-gateがexit 0である。
- `reuse-existing`はlive URLと対象単位・年度・算式の一致根拠がある。
- blocked/rejected/failedは不足や失敗を具体的に報告している。
- 未確定placeholder、架空値、出典不明値を含む記事がない。
- P1以外の既存draftや他セッションの変更に触れていない。

最終検証:
- P1で作成した全article.mdに対してfactual-checkとquality-gateを再実行する。
- `rg`で`TODO|TBD|FIXME|\[件数\]|\[地域|answerSlot|example\.com`等の未確定表現を確認する。
- 全review.mdのfrontmatterと`verdict: PASS`を確認する。
- 全article.mdの`published: false`を確認する。
- `git diff --check`を実行する。
- `git status --short`で開始前差分とP1差分を分離して報告する。
- 記事作成だけなのでapps/webのfull buildは実行しない。実行していないことを明記する。

禁止:
- 30記事を1つのarticle-writer promptで生成すること
- factual/quality/criticの省略または最終一括実行
- dataがない箇所を一般知識や推測値で埋めること
- 既存記事の無断上書き
- `published: true`への変更
- R2 write、公開workflow、SNS draft登録・投稿・予約
- commit、push、PR、deploy
- D1や新しい永続DB/JSON SSOTの追加
- 既存dirty fileの整形・修正・削除・stash

30件すべてが終端状態になるまで作業を継続してください。drafted-passが30件未満でも、
blocked等を隠して記事を捏造してはいけません。最終報告後は公開操作をせず停止してください。
```
