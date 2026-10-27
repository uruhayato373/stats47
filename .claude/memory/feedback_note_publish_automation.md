---
name: note.com 自動投稿の学び
description: /publish-note の実証済みパターン（一括 paste / type 制約 / browser-use cleanup / 確認不要）
type: feedback
originSessionId: 931dd251-e8f5-4988-a5c5-a6306131c5ff
---
2026-04-25 実証で確定した最終形（旧 per-segment 方式は破棄）:

## 既存記事の目次と未公開下書きを分けて保存する（2026-10-27）

- **問題**: カード更新時、公開版は目次なし・未公開下書きは目次ありの1記事で、公開目次が下書き側の設定に変わり、検証例外で下書き復元前に停止した。
- **原因**: GETの`index`は生成済み見出し配列、保存時はboolean。`Boolean([])`はtrueになる。エディタは下書きの設定で開くため、本文だけを差し替えても公開設定を守れない。
- **対策**: `indexEnabled`で配列の長さから表示有無を読み、送信直前に公開版の値を固定する。既存下書きは本文・題名・境界・目次を復元照合し、公開メタ情報の例外でも下書き復元を先に行う。送信状態が未確定なら再送せず原本と公開本文SHAを比較する。
- **証拠**: `data/note/evidence/note-card-draft-preservation-recovery.json`。1件の元データをprivate R2へSHA付き保全し、公開設定・下書き・画像13カードを再照合した。回帰検査は`product-cards.test.mjs`。

## ClipboardEvent paste は同一エディタで 1 回しか機能しない

- 2 回目以降の eval は `result: None` で失敗（contenteditable がフォーカス失う or DataTransfer が動かない）
- `type` コマンドは note エディタの markdown shortcut（`##` `###` `**bold**`）を発動しない → literal 文字列が残る
- → **全本文を 1 つの markdown 文字列に連結 → 1 回だけ ClipboardEvent paste** が唯一の正解
- 1 回 paste すれば H2 / H3 / 太字すべて自動変換される

## URL → OGP カードのトレードオフ

- 一括 paste では URL は plain text のまま（ClipboardEvent は note の URL→card 変換をトリガしない）
- カード化したいなら **paste 後に手動で各 URL 行末で Enter** （または将来 Phase 4-3 として自動化）
- 旧方式の type+Enter は URL カード化はできるが、後続の text segment の markdown 変換を全部失うため net で損

## browser-use 終了時 daemon 必須停止

- `browser-use ... close` は page を閉じるだけで `browser_use.skill_cli.daemon` を止めない
- 残ると Chromium インスタンスが累積、6 個重なって OS が重くなる + 次回 `open` が 60s timeout
- スクリプト末尾と `trap` で必ず:
  ```
  pkill -KILL -f "browser_use.skill_cli.daemon"
  pkill -KILL -f "user-data-dir=.*ms-playwright/mcp-chrome"
  ```

## browser-use state は遅い（5-15秒）

- 1 回の state で複数要素のインデックスを取得（`/tmp/note-state.txt` に save → `grep -B1` で複数 pattern を検索）
- `type` / `keys` の連続実行の間に state は不要

## findIdx ヘルパーの注意点

- 親要素の `[N]<button />` の直下に菅子要素のテキスト `画像をアップロード` がある形式
- 同一行に `[N]` がない場合は **直前の親行から `[N]` を取る** ロジックが必須

## profile

- note.com セッションは Chrome **Profile 1**（Default ではない、2026-04-25 確定）
- `browser-use --headed --profile "Profile 1" ...`

## 確認プロンプトは不要

ユーザーは「確認なしで全て投稿して欲しい」と明言。`/publish-note` は全ステップを自動実行し、結果をスクリーンショットで報告するのみ。
