---
name: post-note-ranking
description: R2ランキング観測値からnote Aシリーズの記事、chart-data、provenance、画像をslug単位で生成する。Use when user says "noteランキング記事", "Aシリーズ生成", "note量産".
disable-model-invocation: true
primary_agent: note-manager
---

# post-note-ranking

1つのranking keyからnote Aシリーズのローカル原稿一式を生成する。公開・R2同期・pushは別工程。
記事templateとRemotion commandの詳細は`reference/runbook.md`の該当Phaseだけを読む。

## 引数

- `rankingKey`（必須）
- `year`（省略時はR2 valuesの最新年）

## 出力

```text
docs/31_note記事原稿/a-<rankingKey>/
├── draft.md
├── chart-data.json
├── data-provenance.json
├── tags.txt
└── images/
    ├── cover-1280x670.png
    ├── choropleth-map-1080x1080.png
    ├── chart-x-1200x630.png
    └── boxplot-1200x630.png
```

## Phase 1: R2入力を固定する

通常は、1 ranking keyずつ次の共通コマンドでPhase 1〜3のローカル原稿を生成する。

```bash
npx tsx .claude/skills/note/post-note-ranking/scripts/generate-ranking-note.ts <rankingKey>
```

このコマンドは47県・欠損・ゼロ除算をfail-closedで検査し、`chart-data.json`、`draft.md`、
`data-provenance.json`、`tags.txt`と既存Remotion用の`.local/r2/sns/ranking/<key>/`入力を作る。
決定的ゲートで停止した場合は`.claude/state/content-operations/note-generation-blockers.json`へ
理由を機械記録し、管理画面`/content/references`では`blocked`として表示する。成功時は同keyの記録を自動解除する。

次のpublic snapshotを取得し、HTTP statusとschemaを確認する。

- `https://storage.stats47.jp/app/ranking/<rankingKey>/item.json`
- `https://storage.stats47.jp/app/stats/<rankingKey>/values.json`
- 関連候補: `app/ranking-items/all.json` / `app/blog/all.json`

指定年の都道府県行だけを使い、順位、平均、標準偏差、偏差値、上位/下位倍率を決定的に計算する。
47県未満、値欠落、ゼロ除算、年不一致があれば原稿生成を止める。

コピーは`item.json`の3層を混ぜずに使う。

- `rankingName ?? title`: 正式指標名。定義・出典・タグに使う
- `readerLabel ?? title`: 平易な指標名。画像の表示名に使う
- `hook`: 読者への問い。記事タイトルと導入に使う

## Phase 2: 再生成可能な入力を保存する

`chart-data.json`へrankingKey、year、取得時刻、計算済みsummary、全都道府県rowを保存する。
同じ入力から表題を再現できるよう、`copy`へcanonicalTitle、readerLabel、hookも保存する。
`data-provenance.json`へR2 source key、restore command、生成chart一覧を保存する。
値をSVGや本文から逆算しない。

詳細schemaは`reference/runbook.md`の「Phase 1.5」と「data-provenance.json」を参照する。

## Phase 3: 記事を書く

`reference/runbook.md`の「Phase 2: 記事テキスト生成」をtemplateとして使う。

- 導入は1位・最下位・差の意外性から始める。
- 表題は`【<year>年版】<hook> 1位は<1位県>｜都道府県ランキング`を基本形とし、
  hookと1位県はR2／`chart-data.json`の値をそのまま使う。年齢などの`subtitle`が
  ある場合は`【<year>年版・<subtitle>】`とし、対象条件を落とさない。
- 「好き」「盛ん」など、観測していない嗜好・因果へ言い換えない。
- 数値、順位、県名は`chart-data.json`だけから取る。
- 上位/下位の背景説明には一次資料を使い、推測を事実として書かない。
- 相関や因果を観測値だけから主張しない。
- `/ranking/<key>`と関連記事への素URLを置き、UTMを付けない。
- Markdown table、見出し絵文字、括弧内への数値詰め込みを避ける。

`tags.txt`は1行1tag、最大99件。

## Phase 4: 画像を生成する

`reference/runbook.md`の「Phase 3: 画像生成」にある既存Remotion compositionを使い、
`chart-data.json`から4枚を生成する。新しいrendererや一時SSOTを作らない。
画像生成を依頼されていない場合は省略できるが、chatで未生成と明示する。

```bash
npm run pipeline:sns --workspace apps/remotion -- --stills-only --note-only --key <rankingKey>
mkdir -p docs/31_note記事原稿/a-<rankingKey>/images
cp .local/r2/sns/ranking/<rankingKey>/note/images/*.png docs/31_note記事原稿/a-<rankingKey>/images/
npx tsx .claude/skills/note/post-note-ranking/scripts/generate-ranking-note.ts <rankingKey> --check --require-images
```

## Gate

- draftの全数値・順位が`chart-data.json`と一致する。
- draft表題の問いが`copy.hook`、1位県が`data[0].area_name`と一致する。
- 画像の`displayTitle`が`copy.readerLabel`と一致し、正式名を平易名として再利用しない。
- `data-provenance.json`のrankingKey/year/source/chart一覧が実ファイルと一致する。
- 生成対象ならPNG 4枚がdecodeでき、期待寸法である。
- stats47 linkが`/rankings/`でなく`/ranking/`を使う。
- R2 sync、commit、push、note公開をローカル生成の完了に含めない。

## 公開への引き渡し

ユーザーがR2同期または公開も明示した場合だけ`reference/runbook.md`の
「生成後: R2同期」を読み、`.claude/rules/branch-workflow.md`の承認境界に従う。

## Output Contract

chatは`Slug | Files | Data evidence | Gates | Not published`の1表のみ。
