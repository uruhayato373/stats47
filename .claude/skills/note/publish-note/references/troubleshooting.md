# トラブルシューティング

> このファイルは `publish-note` スキルの詳細手順です。概要は [SKILL.md](../SKILL.md) を参照。

## 要素検索ヘルパー: find_idx

`state` 出力からテキストでインデックスを検索する。**state 呼び出しを最小限にするため、1回の state で複数要素を検索する。**

```bash
# state を1回取得して /tmp/note-state.txt に保存
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt

# テキストでインデックスを検索する関数
find_idx() {
  local RESULT=$(grep -B1 "$1" /tmp/note-state.txt | head -1 | grep -oE '\[[0-9]+\]' | tr -d '[]')
  echo "$RESULT"
}
```

**リトライロジック**: 要素が見つからない場合、最大2回リトライ（sleep 3 + state 再取得）:

```bash
find_idx_retry() {
  local TARGET="$1"
  local IDX=$(find_idx "$TARGET")
  if [ -z "$IDX" ]; then
    sleep 3
    browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
    IDX=$(find_idx "$TARGET")
  fi
  if [ -z "$IDX" ]; then
    sleep 3
    browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
    IDX=$(find_idx "$TARGET")
  fi
  echo "$IDX"
}
```

## 実証済みの要素パターン

| 要素 | state 内テキスト | 備考 |
|---|---|---|
| タイトル入力 | `placeholder=記事タイトル` | Shadow DOM 内 textarea |
| 本文エリア | `contenteditable=true role=textbox` | |
| 画像を追加ボタン | `aria-label=画像を追加` | エディタ上部 |
| 画像アップロード選択 | 「画像をアップロード」テキストの `<button>` | ドロップダウン内 |
| アイキャッチ file input | `id=note-editor-eyecatch-input type=file` | Shadow DOM 内 |
| トリミング保存ボタン | 「保存」の `<button>`（「下書き保存」ではない方） | |
| 目次ボタン | `aria-label=目次` | 左サイドバー |
| 目次セクション | `role=menuitem aria-label=<見出しテキスト>` | 目次展開後 |
| メニューボタン(+) | `aria-label=メニューを開く` | 空行にカーソル時 |
| 画像挿入メニュー | 「画像」テキストの `<button>` | メニュー展開後 |
| 挿絵 file input | `id=note-editor-image-upload-input type=file` | Shadow DOM 内 |
| 下書き保存ボタン | 「下書き保存」テキストの `<button>` | |
| 公開に進むボタン | 「公開に進む」テキストの `<button>` | |
| ハッシュタグ入力 | `placeholder=ハッシュタグを追加する` | 公開設定画面、Shadow DOM |
| 日時の設定ボタン | 「日時の設定」テキストの `<button>` | 公開設定画面 |
| カレンダー日付 | `aria-label=Choose YYYY年M月D日` の `role=option` | |
| 時刻リスト | `role=option` のテキスト（例: `08:00`） | 30分刻み |
| 予約投稿ボタン | 「予約投稿」テキストの `<button>` | 公開設定画面右上 |
| 完了ダイアログ | 「予約投稿が完了しました」テキスト + 「閉じる」ボタン | |

## state 呼び出し最小化ガイドライン

`browser-use state` は 5-15 秒かかるため、最小限に抑える。

**1回の state で複数要素を検索する:**
- Phase 2: state 1回 → タイトルIDX + 本文IDX の両方を取得
- Phase 4: 「画像を追加」クリック後の state で「画像をアップロード」も確認

**state を省略できるケース:**
- `type` / `keys` コマンドの後は state 不要（インデックスを使わないため）
- 連続する `type` + `Enter` の間に state は不要

**state が必要なケース:**
- click の前（インデックスが必要）
- ページ遷移後（DOM が変わるため）
- upload の前（file input のインデックスが必要）

## エラーハンドリング

- **要素が見つからない場合**: `find_idx_retry` で最大2回リトライ（sleep 3 + state 再取得）。それでも見つからない場合はそのステップをスキップして続行
- **ログインしていない場合**: 停止してユーザーに手動ログインを案内
- **画像アップロード失敗**: テキストのみで下書き保存し、画像挿入はスキップ
- **セッション切れ**: `browser-use close` → `browser-use --headed --profile Default open` で再起動
- **DOM が Empty**: `sleep 3` → state 再取得

## 注意

- **認証情報は扱わない**: Chrome Default プロファイルのセッションに依存
- **要素インデックスは毎回変わる**: state で都度確認。ハードコードしない
- **一時ファイルは `/tmp/` に作成**: `note-data-<slug>.json`, `note-state.txt`, スクリーンショット等
- **$BU 変数を使わない**: 毎回 `browser-use --headed --profile Default` をフルで書く
- **`--session` は指定しない**: デフォルトセッション使用
- **B/C/D シリーズ**: 画像配置が異なる場合あり。note.md の `![...](...)` 行を参照して挿入先を判断
