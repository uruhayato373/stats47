# Codex: 教材の企画から作った note 記事 (b-ref-*) の表紙の背景を生成する

下のコードブロックの中身をそのまま Codex (standalone の `codex` / VSCode 拡張、Mac でも Windows でも) に貼る。
最初は 5 本だけ作って止まる。画風を確かめてから、`最初の 5 本` を `残りすべて` に書き換えて貼り直す。
同じ作業ツリーで Claude Code と同時に動かさない (CLAUDE.md「並行エージェント」)。
取り込み (Drive の候補置き場 → 採用 → R2) と表紙への合成は Claude 側で行う (`.claude/rules/note-image-assets.md` 契約 6)。

```text
stats47 リポジトリのルートで作業してください。note 記事の表紙に使う背景画像を、記事ごとに 1 枚ずつ作ります。
git の操作 (add / commit / push / checkout / reset) はしないでください。書いてよい場所は .local/note-reference-covers/ だけです。

# 対象の記事
data/note/articles.json の articles のうち、key が "b-ref-" で始まり、key が "b-ref-mh-a09" ではなく、status が "draft" のもの。
key の昇順に並べ、最初の 5 本だけ作って止めてください。すでに .local/note-reference-covers/<key>.png がある記事は飛ばします。

# 記事ごとに読むもの
- 題名: data/note/articles.json の title
- 表紙の見出し (画像には描かない。あとでテンプレートが重ねる): .claude/scripts/note/catalog/reference-cover-copy.ts の
  REFERENCE_COVER_HEADLINES[key]、無ければ REFERENCE_COVER_EXTRA[key].headline
- 記事が扱うもの: 記事の chart-data.json の metrics[].label (年収・年齢の記事は items[].label)。
  chart-data.json は docs/31_note記事原稿/<key>/ にあればそれを、無ければ
  https://storage.stats47.jp/note/stats47-note/<key>/chart-data.json を読む (公開 URL。認証は要らない)。
  地方別の記事 (b-ref-prc-a47〜a52) は chart-data.json の region (例: 北海道・東北) が題材。

# 1 枚の画像の作り方
- $imagegen を記事ごとに 1 回だけ使う。横長 (1280×670 に近い 16:9 前後) の背景 1 枚。
- 記事が扱うものを、見た瞬間に分かる具体的なモチーフで描く (果物なら実物の果物、お茶なら湯のみ・急須・カップ、
  旅行ならスーツケースや旅先の風景、部活動なら道具、地方別の記事ならその地方らしい風景の一部)。
  一枚につき主題は一つ。抽象的なグラデーションや幾何学模様だけにしない。
- 構図: 左側の 55% は見出しの文字を重ねるので、明度差の小さい落ち着いた余白にする (細かい模様・強いコントラストを置かない)。
  モチーフは右側と下側に寄せる。上下左右の端 40px にはモチーフの重要な部分を置かない。
- 色: 藍 (#1f3a5f 前後)・インク色・白を基調にし、モチーフの色を差し色として 1〜2 色だけ使う。彩度を上げすぎない。
- 画風: 雑誌の挿絵のような、少し紙の質感がある半フラットなイラスト。写真のような写実表現や、実在の人物の顔は描かない。
- 描いてはいけないもの (必ず守る): 文字・数字・記号・ロゴ・透かし・署名 (どの言語でも。看板や包装の文字も含む)、
  日本地図や都道府県の形・行政界、グラフ・地図・表のような統計図、特定の企業・商品・ブランドが分かる意匠、
  不安をあおる表現 (警告色の多用、暗い災害風景など)。
- 作った画像を .local/note-reference-covers/<key>.png として保存する。

# 記録
記事ごとに 1 行、.local/note-reference-covers/prompts.jsonl に次の JSON を追記する:
{"key": "<key>", "file": ".local/note-reference-covers/<key>.png", "prompt": "<$imagegen に渡したプロンプト全文>", "subjects": "<題材>", "note": "<守れなかった条件。無ければ none>"}

# 最後に返すもの
作った記事ごとに 1 行の表 (key | 題材 | ファイル | 守れなかった条件) だけを返してください。
```
