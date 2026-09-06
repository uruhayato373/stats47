# 既存記事の更新（update モード）

すでに note に公開済みの記事を、修正済みの `draft.md` で**更新**する手順。
新規作成（`editor.note.com/new`）ではなく、既存記事の編集画面を開いて本文を差し替え、
「更新」する。価格変更・誤字修正・記述更新などの保守に使う。

## 起動

```
/publish-note --update <slug>
```

`<slug>` は記事ディレクトリ名。複数指定はカンマ区切り（バッチ可）。

## 対象の制約

- **公開済みの記事のみ**。`.claude/state/note-published-urls.json` の `articles` に
  該当 slug が無ければ「未公開のため更新不可」で中断する
- **無料記事は全自動**。有料記事の更新は本文差し替え後に有料エリア境界（`ここから先は有料部分:`）の
  再設定が絡むため、Phase 7-Boundary で境界を自動設定するが、**誤露出防止で最終投稿は screenshot 確認後に
  人間が確定**する（初回 live では境界画面 DOM の捕捉も伴う）。有料記事を更新する場合はこの点を必ずユーザーに告知する

## フロー

create モードとの差分のみ記す。共通手順は [editor-operations.md](editor-operations.md) を参照。

```
Phase 0        : draft.md 読み込み（create と同じ。title / body / images を抽出）
Phase U-0.5    : slug → 公開 URL を note-published-urls.json から引く。無ければ中断
Phase 1        : ブラウザ起動 + アカウント照合ゲート（stats47 か。create と同じ）
Phase U-1      : 既存記事の編集画面を開く（/new ではない）
Phase U-1.5    : アイキャッチ差し替え（カバー更新時のみ。editor-operations.md Phase 2 と同じ）
Phase U-2      : 既存本文を全消去
Phase U-3      : タイトル更新（draft.md と差があれば。無ければスキップ）
Phase U-4      : 本文 paste（チャンク分割。editor-operations.md Phase 4-2 と同じ）
Phase U-5      : 本文画像の再挿入（editor-operations.md Phase 5 と同じ）
Phase U-6      : 「更新」（create の「公開」ではない）
Phase 8 後     : note-published-urls.json の該当記事に updated_at を記録（URL は不変）
→ 終了クリーンアップ（SKILL.md と同じ 3 段 + browser-use-user-data-dir kill）
```

### Phase U-1: 既存記事の編集画面を開く

公開 URL は `https://note.com/stats47/n/<noteId>`。`<noteId>` を取り出し、編集画面を開く。

```bash
# 例: noteId を URL から抽出
NOTE_URL="https://note.com/stats47/n/n455ec72c5d62"
NOTE_ID=$(basename "$NOTE_URL")   # → n455ec72c5d62
browser-use --headed --profile "Profile 5" open "https://editor.note.com/notes/$NOTE_ID/edit"
```

> ⚠️ 編集画面 URL の正確な形式は初回実行時に確認すること。`editor.note.com/notes/<id>/edit`
> で開けない場合は、記事ページ（`note.com/stats47/n/<id>`）を開いて「…」メニュー
> または編集ボタンから編集画面に入る。判明した正しい経路をこのファイルに追記する。

編集画面が開いたら、既存のタイトル・本文・画像がすでに入った状態になる。

### Phase U-2: 既存本文を全消去

本文 contenteditable にフォーカスし、全選択 → 削除する。

```bash
browser-use --headed --profile "Profile 5" eval "
  const editor = document.querySelector('[contenteditable=true]');
  if (editor) {
    editor.focus();
    const r = document.createRange();
    r.selectNodeContents(editor);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
    document.execCommand('delete');
    'cleared';
  } else { 'editor not found'; }
"
sleep 1
```

> ⚠️ 全選択がタイトル欄まで巻き込まないこと。本文 contenteditable に限定して
> `selectNodeContents` する。初回実行時に、消去後タイトルが残っているか必ず確認する。

### Phase U-1.5: アイキャッチ差し替え（カバー更新時のみ）

カバー画像を更新する場合、本文編集の前にアイキャッチを差し替える。
editor-operations.md Phase 2 と同じ手順で、既存アイキャッチを `images/cover-1280x670.png`
で置き換える（アイキャッチ領域を開く → 画像を選択し直す → トリミング保存）。
カバーを変えない更新ではスキップする。

### Phase U-4 以降

本文 paste（Phase 4-2 のチャンク分割方式）、画像再挿入（Phase 5）は create と同一。
**Phase 5（本文画像の挿入）は省略不可** — 表画像・インフォグラフィック・スクリーンショットを
すべて挿入する。挿入数が多くても飛ばさない。

### Phase U-6: 「公開に進む」→「更新する」（2 段）

公開済み記事の編集画面でも、右上ボタンは create と同じ **「公開に進む」**。
それを押した次画面で **「更新する」**（create の「公開」とは別ラベル）をクリックする。
**1 段ではなく 2 段操作**である点に注意（2026-05-21 #00 更新で実機確認）。
有料記事の場合は Phase 7-Boundary で有料エリア境界を自動設定する（誤露出防止で最終「更新する」確定のみ screenshot 確認後に人間が押す）。

## 更新モードで「触らないもの」

- ハッシュタグ（本文更新と同時には触らない。タグだけを95個以上へ揃える場合は `update-published-hashtags.mjs` を使う）
- 販売価格（既存のまま。価格変更は note のペイウォール設定で行う別オペレーション）

本文・本文中画像・（カバー更新時の）アイキャッチを差し替えるのが update モードの責務。

## 実機検証で判明した注意点（2026-05-21 #00 更新）

初回実行で update モードは成功した。実 UI とのすり合わせで以下が判明:

- **編集画面 URL `editor.note.com/notes/<id>/edit` は正しく機能**した（記事ページの編集ボタン経由は不要）
- **本文全消去はタイトルを巻き込まなかった**（`selectNodeContents` で contenteditable のみ。Phase U-2 の手順で OK）
- **eval は最後に必ず文字列を返す**こと（IIFE で `return '<string>'`）。最後の式がオブジェクトを返すと browser-use が `result: None` を返し、成否判定を誤る
- **本文 paste の前に、本文 contenteditable を browser-use の `click` で実フォーカスする**こと。
  `editor.focus()` を JS で呼ぶだけだと初回 paste eval が `result: None` で本文が入らないことがあった。
  `click` でフォーカス → window.__nb 注入 → paste 発火、の順にすると確実
- 「更新」は 1 段ではなく **「公開に進む」→「更新する」の 2 段**（Phase U-6 参照）

## 図が文章を分断したときの是正 (2026-09-06 実測)

### 症状と原因

公開ページで `<figure>` の直前の段落が文の途中で切れている。
例: 「47市平均を1.00と」で段落が終わり、図を挟んで「した比率で見ると」が続く。

原因は `editor-helpers.sh` の `ins_img` が画像挿入位置の決定に **`Home` キー**を使っていたこと。
`Home` は「視覚上の行頭 (折り返し行の先頭)」へ飛ぶため、長い段落では文の途中で改行が入り、
図がその位置に挿さる。**家計シリーズ公開 56 本中 46 本**で発生した。

### 是正はエディタ経由で画像を挿し直さない

エディタ上で画像を消して挿し直すと同じ経路を通るため再分断しうる。代わりに
**公開 API の本文 HTML を組み直して PUT を差し替える**。文章・数値・画像は一切変えず、
block の区切りだけを `draft.md` (SSOT) の段落境界に合わせる。

```bash
# 1. 実測 (read-only)。図の位置が draft.md と一致するかを全記事で判定する
node .claude/scripts/note/audit-note-figure-split.mjs

# 2. 是正 (逐次。記事間に 20-40 秒待つ)
bash .claude/scripts/note/fix-note-figure-split.sh <slug> [<slug> ...]
#    PROBE=1 を付けると PUT payload を観測して送信せずに終わる
```

### 安全装置 (すべて fail-closed)

- 是正後の HTML はローカルで作り、**全文テキスト・リンク・画像 src・figure 数が
  1 バイトも変わらないこと**を検証してからでないとブラウザを触らない
- 公開 PUT は `free_body` のテキストが手元の本文と一致するときだけ差し替える。
  一致しなければ throw して送信しない
- 有料記事 (`price > 0` / `pay_body` あり) は対象外として拒否する
- ハッシュタグは既存 guard と同じく `hashtags.txt` から 99 件で確定する
- `draft.md` に無い末尾ブロック (公開後に足したナビゲーションフッタ等) は原文のまま残す
- 既に分断が無い記事は exit 3 で何もしない (再実行は安全)

### 判定は末尾文字で行わない (2026-09-06 の実測)

最初は「figure 直前の段落が `。！？」）` で終わっているか」で判定していたが、
**`a-kakei-kagawa` を見逃した**。「…上位は清掃代（2.24倍）」+ 図 +「やベッド（2.12倍）…」
という文中の分断でも、末尾が `）` なので文末と誤判定されるためである。

正しい判定は **draft.md (SSOT) との突き合わせ**。図の直前にあるテキストが、draft の
対応する直前 block の全文と一致するかを見る (`misplacedFigures`)。段落が分断されていれば
直前は断片になるので一致しない。この修正で対象は 46 本 → **47 本 (a-kakei 全件)** になった。

### 新規公開後は必ず実測する

`ins_img` は `Home` を段落ノード先頭への Range 移動に置き換えたが、
**この Range 版は新規公開での実地検証が未了**。新規公開のあとは
`audit-note-figure-split.mjs` で分断 0 を確認すること。
