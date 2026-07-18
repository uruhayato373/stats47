---
type: session-handoff
date: 2026-07-18
status: active
tags: [note, circulation, magazine, cta, claude-code]
---

# note 回遊・マガジン・CTA再設計 実装手順書

## Claude Codeに渡す最初の指示

以下をClaude Codeの新規セッション冒頭に貼る。

```text
OUTPUT FORMAT:
- 作業中は各Phase終了時に「変更ファイル / 検証結果 / 残課題」を最大8項目で報告する。
- 最終報告は「実装結果 / 検証 / 未実行 / 外部操作待ち」の4節だけにする。
- 未検証を完了扱いしない。note.comを更新していなければ明記する。

BEHAVIOR CONTRACT:
- まずこの手順書と参照必須ファイルを最後まで読む。
- note関連以外の既存変更を編集・整形・コミットしない。
- Phaseを飛ばさない。各Phaseの完了条件を検証してから次へ進む。
- note.comの公開記事更新、マガジン作成・並べ替え、R2 push、git push、deployは人間の明示承認なしに実行しない。
- 決定的な割当・検証・フッター生成はコードで行い、LLM判断を実行時処理に入れない。
- 実装は最小限とし、note catalogをeditorial metaのSSOTとして再利用する。

TASK:
docs/handoffs/2026-07-18-note-circulation-cta-implementation.md の手順に従い、
note既存記事の回遊・マガジン集客・CTA基盤をPhase 0から順に実装する。
最初のセッションでは原則Phase 0〜2までを完了し、Phase 3の公開記事更新は承認待ちで止める。
```

## 1. ゴール

note記事ごとに「読者が次に取る行動」を1つに絞り、次の記事、マガジン、stats47、購入のいずれかへ一貫して誘導できる状態を作る。

実装完了の定義:

1. note catalogで記事の役割、次に読む記事、主CTAを型安全に管理できる。
2. 未公開記事、自己参照、vertical不整合、主CTAとリンク先の矛盾をvalidatorが拒否する。
3. catalogから記事別CTAフッターを決定的に生成できる。
4. 既存の共通フッターを壊さず、dry-runで差分を確認できる。
5. stats47アカウント以外のメトリクスを保存しないガードがある。
6. パイロット5記事のローカル/R2 staging差分まで作り、note.com更新前で人間承認を待てる。

## 2. 参照必須ファイル

作業開始前に以下をすべて読む。

- `CLAUDE.md`
- `.claude/rules/sns-content-standards.md` の §2-7、§4、計測部分
- `.claude/rules/browser-use-cleanup.md`
- `.claude/rules/coding-standards.md`
- `.claude/rules/branch-workflow.md`
- `docs/30_note記事企画/note戦略.md`
- `docs/04_レビュー/2026-07-18-note-circulation-cta-redesign.md`
- `.claude/scripts/note/catalog/README.md`
- `.claude/scripts/note/catalog/types.ts`
- `.claude/scripts/note/catalog/index.ts`
- `.claude/scripts/note/catalog/magazines.ts`
- `.claude/scripts/note/catalog/validate-note-catalog.ts`
- `.claude/scripts/note/add-koumuin-circulation-footer.cjs`
- `.claude/scripts/note/add-koumuin-magazine-footer.cjs`
- `.claude/scripts/note/inject-magazine-url.cjs`
- `.claude/scripts/note/fetch-note-metrics.sh`
- `.claude/skills/analytics/fetch-note-metrics/SKILL.md`
- `.claude/skills/note/publish-note/SKILL.md`

## 3. 作業境界

### 変更してよい範囲

- `.claude/scripts/note/catalog/`
- `.claude/scripts/note/` のCTA生成・メトリクス関連スクリプト
- 上記スクリプトの対象テスト
- `.claude/skills/analytics/fetch-note-metrics/SKILL.md`
- `.claude/skills/note/publish-note/` の実行手順・ガード記載
- `docs/30_note記事企画/note戦略.md`
- `docs/04_レビュー/2026-07-18-note-circulation-cta-redesign.md`
- `.claude/state/metrics/note/` は正しい取得を実行した場合のsnapshotのみ
- `.local/r2/note/` はgit管理外stagingとしてのみ使用

### 変更しない範囲

- `apps/web`、`packages/product-factory`、SNS投稿系、ブログ記事
- note商品ファクトリーの仕様・生成物
- `.env.local` と認証情報
- 無関係なdirty worktreeの変更
- note.comの公開記事・マガジン・価格
- R2本番オブジェクト

開始時と終了時に `git status --short` を取得する。既存変更を戻す、stashする、まとめてformatする、commitすることは禁止。

## 4. Phase 0 — 現状固定とベースライン修復

### 4.1 catalogの現状を機械集計する

一時的な調査出力は `/tmp/` に置く。次の数を取得する。

- 全記事数、vertical別記事数、公開数
- `r2Body: false` 数
- magazine未割当数
- noteUrlのhandle別件数
- 公務員系で `circulation-footer` があるローカルdraft数
- stats47-noteの上位候補を選ぶため、利用可能な最新stats47 metricsとのURL照合数

既知の目安はcatalog全239記事、stats47-note 187記事、validator warn 7件だが、コードの実測を正とする。

実行:

```bash
npx tsx .claude/scripts/note/catalog/validate-note-catalog.ts
git status --short
```

### 4.2 メトリクスの誤アカウント保存を防ぐ

問題: 2026-07-13 snapshotは `note.com/dobokunote/` を取得しており、stats47のベースラインではない。Chrome profile名だけではアカウントを保証できない。

`.claude/scripts/note/fetch-note-metrics.sh` に期待handleの検証を追加する。

要件:

- 既定の期待handleは `stats47`。
- 環境変数で上書き可能にする場合も、認証情報ではない専用名（例 `NOTE_METRICS_EXPECTED_HANDLE`）を使う。
- 抽出記事が1件以上ある場合、全URLのhandleを集計する。
- 期待handle以外が1件でも含まれたらexit 1とし、snapshotを正式パスへ保存しない。
- 0件取得もexit 1。空snapshotを成功扱いしない。
- 一時JSONを `/tmp/` に作り、検証通過後だけ `.claude/state/metrics/note/` へ移動する。
- エラーには期待handle、実際のhandle、件数を表示する。CookieやURL query等の秘密は出さない。
- cleanup trapは既存どおり維持し、daemon停止とnoteタブcloseを必ず行う。

シェル内に複雑なJSON検証を増やしすぎず、既存Python抽出部分または小さな決定的helperに寄せる。テスト可能ならURL配列をfixtureとしてhandle検証を分離する。

### 4.3 Phase 0の検証

- stats47だけのfixtureは成功する。
- dobokunote混入fixtureは失敗し、正式snapshotを作らない。
- 空配列は失敗する。
- 既存の2026-07-13ファイルは履歴証拠なので削除・上書きしない。
- browserを実際に起動しないテストを先に通す。

Phase 0ではnote.comへアクセスしない。実取得は人間がstats47ログインprofileを確認した後に行う。

## 5. Phase 1 — catalogに回遊メタを追加

### 5.1 型

`.claude/scripts/note/catalog/types.ts` に次のunionを追加する。

```ts
export type NoteJourneyRole = "entry" | "hub" | "step" | "conversion";
export type NotePrimaryCta = "article" | "magazine" | "stats47" | "purchase";
```

`NoteArticle`には最小限のoptional fieldを追加する。

```ts
journeyRole?: NoteJourneyRole;
nextBestArticle?: string;
primaryCta?: NotePrimaryCta;
nextOutcome?: string;
```

`nextOutcome`は「次の記事を読む理由」の短い編集文。CTA本文全体やMarkdownをcatalogに保存しない。既存239記事へ一括で値を埋めず、パイロット対象だけに設定する。

`index.ts`から新しい型をexportする。

### 5.2 validator

`validate-note-catalog.ts` に以下を追加する。

error:

- `nextBestArticle`が存在しない。
- 自分自身を参照する。
- リンク先がdraftまたは`noteUrl`なし。
- 原則としてverticalが異なる。姉妹マガジン横断を許可するなら明示的allowlistを定数化する。
- `primaryCta === "article"`なのに`nextBestArticle`がない。
- `primaryCta === "magazine"`なのに`magazine === null`、または対象マガジンに`noteUrl`がない。
- `primaryCta === "stats47"`なのに`stats47Targets`が空。
- `primaryCta === "purchase"`なのに記事もマガジンも購入対象でない。
- `nextBestArticle`があるのに`nextOutcome`が空。

warn:

- `journeyRole`だけあり`primaryCta`がない。
- 公開記事で回遊メタが一部だけ設定されている。
- entry記事の`primaryCta`がpurchaseになっている。

既存未移行記事をerrorにして一括作業を強制しない。回遊メタが1項目でも入った記事に完全性を要求する方式にする。

### 5.3 helper

`index.ts`または新規の小さなpure moduleに次を追加する。

- `getNextBestArticle(article)`
- `getPrimaryCtaTarget(article)`
- `articlesByJourneyRole(role)`

戻り値はURLと対象種別を構造化し、Markdown文字列を返さない。見つからない場合を`undefined`で明示する。

### 5.4 テスト

既存のテスト配置を検索し、同じrunnerを使う。無ければ過剰な基盤を追加せず、validatorからpure validation関数を分離してVitestで検証する。

最低ケース:

1. 正しいarticle CTA。
2. 自己参照。
3. 未公開リンク先。
4. vertical不整合。
5. magazine URL未設定。
6. stats47 targetなし。
7. partial metadata。
8. 既存メタなし記事は後方互換で通過。

## 6. Phase 2 — CTAフッターをcatalog駆動化

### 6.1 既存スクリプトの扱い

既存:

- `add-koumuin-circulation-footer.cjs` はv1 marker。
- `add-koumuin-magazine-footer.cjs` は既存marker以降を切ってv2を付け直す。
- `inject-magazine-url.cjs` はplaceholder置換。

これらを即削除しない。新しいcatalog駆動スクリプトを正系統として追加し、旧スクリプト冒頭にdeprecatedコメントと移行先を記載する。既存呼び出し元を`rg`で確認し、無断で壊さない。

推奨ファイル:

```text
.claude/scripts/note/render-circulation-footer.ts
.claude/scripts/note/apply-circulation-footer.ts
.claude/scripts/note/__tests__/circulation-footer.test.ts
```

### 6.2 renderer

pure functionとして実装する。

入力:

- `NoteArticle`
- 解決済みの次記事
- 解決済みのマガジン

出力:

- markerを含むMarkdown footer文字列

markerは新しいversionにする。

```md
<!-- circulation-footer:v3 -->
```

ルール:

- 主CTAは1つ。
- 副CTAは最大2つ。
- article CTAでは`nextOutcome`をリンク直前に表示する。
- magazine CTAではマガジン名と「何がまとまっているか」を表示する。
- stats47 CTAは素URL。UTMを付けない。
- URLはcatalogの`noteUrl`、magazineの`noteUrl`、`stats47Targets`からのみ取得する。
- 未解決placeholderを出力しない。
- 同じURLを主・副で重複させない。
- `primaryCta`未設定の記事は生成対象外として明示的にskipする。

### 6.3 applier

CLI要件:

```bash
npx tsx .claude/scripts/note/apply-circulation-footer.ts --key <article-key> --dry-run
npx tsx .claude/scripts/note/apply-circulation-footer.ts --keys <comma-separated> --dry-run
npx tsx .claude/scripts/note/apply-circulation-footer.ts --key <article-key> --apply
```

- 既定はdry-run。`--apply`がない限り書き込まない。
- `--all`は初回実装しない。一括誤更新を防ぐ。
- 入力本文はR2 SSOTを`.local/r2/note/.../draft.md`へ同期済みの場合のみ扱う。R2へ直接writeしない。
- `r2Body === false`はエラーではなく明確なskip理由を返す。
- v1/v2/v3 markerの最初から末尾までを置換する。
- markerがない場合は本文末に追加する。
- 2回適用して差分0になる冪等性を保証する。
- dry-runは対象key、旧marker、主CTA種別、リンク先、差分要約を表示する。
- 元ファイルbackupをrepo内に作らない。必要なら`/tmp/`を使う。

### 6.4 renderer/applierテスト

- role別4パターン。
- primary CTAが常に1つ。
- 副CTAが2つ以内。
- UTMなし。
- placeholderなし。
- URL重複なし。
- v1→v3、v2→v3、v3→v3。
- markerなしへの追加。
- 2回実行で同一。
- `r2Body:false`のskip。
- `--dry-run`で書き込みなし。

## 7. Phase 3 — パイロット5記事の選定とローカル反映

### 7.1 対象選定

正しいstats47 metricsを再取得できるまでは、views順位を捏造しない。先に公務員系の公開済み・R2本文あり・無料入口記事から5本選ぶ。

第一候補:

1. `00-claude-code-intro-for-public-servants`
2. `01-claude-code-setup-complete`
3. `00-estat-claude-code-intro`
4. `03-fetch-prefecture-ranking`
5. `08-benchmark-table-5min`

catalogで`status: published`、`noteUrl`あり、`r2Body !== false`を再確認する。条件を満たさない候補は採用せず、理由を記録して代替を選ぶ。

### 7.2 推奨メタ

- 導入2記事は`journeyRole: "entry"`。
- e-Statの#03と#08は`journeyRole: "hub"`または`"step"`を本文内容から決める。
- 主CTAは原則article。マガジンURLがcatalogでnullの間は`primaryCta: "magazine"`を設定しない。
- `nextBestArticle`は公開済みの具体記事のみ。
- `nextOutcome`は40〜80字程度で、次の記事を読むと完了する仕事を書く。

マガジンURLが本文には存在してcatalogでnullなら、勝手に推測せずnote.com実URLと照合してから`magazines.ts`へ書き戻す。外部閲覧が必要なため人間承認を得る。

### 7.3 dry-run

5記事すべてでdry-runし、差分を`/tmp/note-cta-pilot/`へ保存する。プロジェクトルートに一時ファイルを置かない。

目視項目:

- 有料境界より前後のどちらにCTAが入るか。
- 同じマガジン案内が本文中に重複しないか。
- stats47リンクが2〜4箇所の範囲か。
- 読者が次に得る成果が具体的か。
- noteのカード化を阻害するURL表記でないか。
- 記事末で主CTAが最も目立つ順番か。

### 7.4 ローカルapply

dry-runを人間が承認した後だけ`.local/r2/note/` stagingへapplyする。docs/31のoutboxを本文SSOTへ戻さない。R2 pushは行わない。

## 8. Phase 4 — note.com更新（別承認工程）

このPhaseはClaude Codeが自動で開始してはいけない。

実行前に人間へ提示するもの:

- 対象5記事のnote URL。
- 旧CTAと新CTAの差分。
- 主CTAのリンク先。
- 有料記事なら無料/有料境界への影響。
- rollback用の旧本文取得状況。

承認後は`publish-note`のupdate modeを使い、1記事ずつ更新する。最初の1記事を更新したら公開ページを目視し、リンク、改行、カード、有料境界を確認してから残りへ進む。

禁止:

- 新規記事として再投稿する。
- 5記事を目視なしで一括更新する。
- Profile 1やdobokunoteアカウントから更新する。
- マガジン作成・価格変更を同時に行う。

ブラウザ利用後は`.claude/rules/browser-use-cleanup.md`どおりdaemon停止とnote関連タブcloseを行う。

## 9. Phase 5 — 計測と展開判定

更新日を基準に最低2週間、可能なら4週間観測する。

### 指標

主指標:

- note.com → stats47.jpの参照セッション。
- 対応するstats47 landing pageのセッション。
- 有料記事またはマガジン購入数。

代替指標:

- `nextBestArticle`対象記事のviews増分。
- entryから次記事へのviews比率の変化。ただし個人単位の遷移率とは呼ばない。
- likes/commentsは補助指標。

### 判定

- `effect/full`: 主指標が改善し、明確な悪化指標がない。
- `effect/partial`: 次記事viewsは増えたがstats47流入/購入は不変など、一部のみ改善。
- `effect/none`: 十分な露出があるのに主要指標が変わらない。
- `effect/adverse`: stats47流入、購入、記事読了の代理指標が悪化。

サンプルが小さい場合は断定せず`insufficient evidence`として観測延長する。

効果確認後だけ、公務員系の残り公開記事へ10本単位で展開する。stats47-noteは正しいメトリクスとのURL照合後、上位20記事だけを4マガジン候補へ割り当てる。

## 10. stats47-noteマガジン割当の決定規則

LLMに187記事を自由分類させない。まず`stats47Targets`またはranking keyのcategoryから決定的に候補を出す。

- 財政指標 → `s47-fiscal`
- 気候・自然 → `s47-climate`
- 人口・出生・世帯 → `s47-population`
- 労働・所得・賃金 → `s47-labor`
- 複数候補または分類不能 → 未割当のままreview queue

最初は公開済み、R2本文あり、正しいmetrics上位20記事だけ。`recovered-*`や`r2Body:false`は本文を復元するまでCTA改修対象外。

割当スクリプトを作る場合も既定dry-run、明示`--apply`、対象key限定とする。マガジンURLがnullの状態でフッターへリンクを出さない。

## 11. 検証コマンド

既存package scriptsを確認し、利用できるものを優先する。最低限:

```bash
npx tsx .claude/scripts/note/catalog/validate-note-catalog.ts --strict
npx vitest run <追加したnote関連テスト>
node --check .claude/scripts/note/add-koumuin-circulation-footer.cjs
node --check .claude/scripts/note/add-koumuin-magazine-footer.cjs
git diff --check -- .claude/scripts/note .claude/skills/analytics/fetch-note-metrics docs/30_note記事企画 docs/04_レビュー
git status --short
```

`--strict`が既知warn 7件で失敗する仕様なら、通常validate成功と「既知warn 7件、新規warn 0」を別々に示す。既知warnを今回ついでに修正しない。

追加TypeScriptがrepoのtype-check対象に含まれるなら対象workspace/type-checkを実行する。apps/webのfull buildは不要。note.com更新後のみ公開ページの目視確認が必要。

## 12. 完了時の記録

Phase 0〜2の実装が完了したら:

1. `docs/04_レビュー/2026-07-18-note-circulation-cta-redesign.md`へ実装日、変更ファイル、検証結果を追記。
2. 未実施の外部更新は未実施と記載。
3. 新しい恒常ルールが生じた場合のみ`.claude/rules/sns-content-standards.md`へ抽出する。
4. このハンドオフをすぐ削除しない。Phase 3以降が完了して恒常事項と残TODOを抽出した後、`docs/handoffs/README.md`に従い削除する。

## 13. 中断条件

以下では推測で続けず、人間へ報告して止める。

- stats47の正しいnoteアカウント/profileを特定できない。
- catalogのnoteUrlと実公開URLが一致しない。
- R2本文と公開本文のどちらが新しいか判定できない。
- 有料境界を維持してupdateできる保証がない。
- マガジンURLが本文、catalog、note.comで食い違う。
- 対象ファイルに別セッションの未コミット変更があり、安全に分離できない。
- note.com更新、R2 push、git pushなど新しい外部権限が必要。

## 14. Claude Code最終報告テンプレート

```md
## 実装結果

- Phase 0: ...
- Phase 1: ...
- Phase 2: ...

## 検証

- catalog validate: ...
- tests: ...
- diff check: ...

## 未実行

- note.com更新: 未実行
- R2 push: 未実行
- full build: 対象外

## 外部操作待ち

- 承認が必要な対象記事と操作: ...
```
