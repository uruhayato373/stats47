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
- **当面は無料記事を主対象**とする。有料記事の更新は本文差し替え後に有料エリア境界
  （`ここから先は有料部分:`）の再設定が絡むため、Phase 7-Pricing と同じく半自動
  （境界設定は手動確認）。有料記事を更新する場合はこの点を必ずユーザーに告知する

## フロー

create モードとの差分のみ記す。共通手順は [editor-operations.md](editor-operations.md) を参照。

```
Phase 0        : draft.md 読み込み（create と同じ。title / body / images を抽出）
Phase U-0.5    : slug → 公開 URL を note-published-urls.json から引く。無ければ中断
Phase 1        : ブラウザ起動 + アカウント照合ゲート（stats47 か。create と同じ）
Phase U-1      : 既存記事の編集画面を開く（/new ではない）
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

### Phase U-4 以降

本文 paste（Phase 4-2 のチャンク分割方式）、画像再挿入（Phase 5）は create と同一。

### Phase U-6: 「更新」

公開済み記事の編集画面では、最終ボタンは「公開」ではなく **「更新」**（または
「公開に進む」→「更新する」）。state で「更新」ラベルのボタンを探してクリックする。
有料記事の場合は Phase 7-Pricing と同様に有料エリア境界の確認が挟まる（半自動）。

## 更新モードで「触らないもの」

- アイキャッチ画像（既存のまま。変更が必要なら別途）
- ハッシュタグ（既存のまま。再入力すると重複する恐れ）
- 販売価格（既存のまま。価格変更は別オペレーション）

本文と本文中画像のみを差し替えるのが update モードの責務。
