# Codex: 教材の企画から作った note 記事 (b-ref-*) の記事内の図を検査する

下のコードブロックの中身をそのまま Codex (standalone の `codex` / VSCode 拡張、Mac でも Windows でも) に貼る。
1 回で 10 本ずつ進み、結果を .local に追記していくので、終わるまで同じプロンプトを貼り直せば続きから進む。
同じ作業ツリーで Claude Code と同時に動かさない (CLAUDE.md「並行エージェント」)。直しは Claude 側で行う
(図の誤りは生成器 `.claude/scripts/note/reference/build-reference-note*.ts` か、図の元の `quick-still.ts`・svg-builder を直して作り直す)。

```text
stats47 リポジトリのルートで作業してください。note 記事の図を検査します。
git の操作 (add / commit / push / checkout / reset) はしないでください。リポジトリのファイルは直さないでください。
書いてよい場所は .local/note-reference-figure-audit/ と、記事の取り出し先 docs/31_note記事原稿/ (git の対象外の作業場) だけです。
画像は view_image などで実際に開いて目で確かめ、推測で判定しないでください。

# 対象の記事
data/note/articles.json の articles のうち、key が "b-ref-" で始まり、key が "b-ref-mh-a09" ではないもの (91 本)。
key の昇順に並べ、.local/note-reference-figure-audit/results.md にまだ行が無い記事から 10 本だけ検査して止めてください。

# 記事の取り出し
docs/31_note記事原稿/<key>/ に draft.md が無ければ、まず次を実行する:
  npm run note:article -- checkout <key>
認証の設定が無くて失敗したら、公開 URL から次を取って docs/31_note記事原稿/<key>/ に置く (認証は要らない):
  https://storage.stats47.jp/note/stats47-note/<key>/draft.md
  https://storage.stats47.jp/note/stats47-note/<key>/chart-data.json
  https://storage.stats47.jp/note/stats47-note/<key>/data-provenance.json
  draft.md の ![…](images/<ファイル名>) に出てくる画像を https://storage.stats47.jp/note/stats47-note/<key>/images/<ファイル名> から images/ へ

# 記事の中身
- draft.md: 本文。図は ![説明](images/<ファイル名>.png) で、直前の見出しがその図の節。
- images/*.png: 記事内の図。都道府県の記事は全 47 都道府県のタイル地図 (縦長)、年収・年齢の記事は横棒グラフ。地方別の記事 (a47〜a52) には図が無い。
- chart-data.json: 図と本文の数値の正本。指標ごとに label・unit・year・subtitle・capitalCity・全都道府県の rows (rank・areaName・value) を持つ。
  年収の記事 (kind: quintile) は品目ごとの五分位の値 (values・ratio・share)、年齢の記事 (kind: age) は年齢階級ごとの値。

# 図ごとに確かめること
1. 図の題名・指標名が、その図が置かれた節の見出しと chart-data.json の指標と同じものか (別の指標の図が貼られていないか)。
2. 図の年・単位が chart-data.json と同じか。人口当たりなどの指標で、図の題名や単位から分母が落ちて実数に読めないか
   (例: 人口100万人当たりの博物館数が「博物館数 単位: 館」と描かれている)。
3. 図に描かれた値が chart-data.json と一致するか。少なくとも最大と最小の地域 (階級) とその値、凡例の両端の値を照らす。
4. 県庁所在市の値 (capitalCity: true) の図が市名で描かれ、県全体の値に見えないか。逆に県全体の値が市名で描かれていないか。
5. 文字の切れ・重なり・はみ出し、縮小したときに読めない小さな文字、背景と文字のコントラスト不足。
6. 色の濃淡の向きが凡例どおりか (値の大きい地域ほど濃い、など)。値の無い地域の表示が「0」と誤読されないか。
7. 本文 (その節と「## この問いへの答え」) が図について書いていることと図が食い違っていないか (順位・最大・最小・地域の並び)。

# 記録
.local/note-reference-figure-audit/results.md に、検査した図ごとに 1 行を追記する (ファイルが無ければ下の見出し行から作る):
| key | 図 (ファイル名) | 判定 (OK / 要修正) | 重さ (BLOCK / MAJOR / MINOR / -) | 指摘 | 根拠 (図の中で読んだ文字と chart-data.json の値) |
- 問題の無い図も「OK」で 1 行載せる。図の無い記事は「図なし」で 1 行載せる。
- 1 つの図に複数の問題があれば行を分ける。確かめられなかったことは「未確認」と書き、OK にしない。

# 最後に返すもの
今回検査した 10 本の行だけを同じ表の形で返し、表の下に 1 行で、複数の記事に共通する問題 (生成器が原因と思われるもの) と、
91 本のうち残りの本数を書いてください。
```
