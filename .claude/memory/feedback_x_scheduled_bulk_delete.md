---
name: feedback_x_scheduled_bulk_delete
description: X予約一覧の一括削除は描画中の7〜8件しか消えない。台帳キーで選択→削除→読み直しを残件0まで繰り返し、残す行は毎回照合する
metadata:
  node_type: memory
  type: feedback
  originSessionId: ded49037-4a83-4955-aaa2-92740c4becc0
  modified: 2026-09-23T06:29:05.325Z
---

X の予約一覧 (`x.com/compose/post/unsent/scheduled`) で「編集」→チェック→「削除」→確認ダイアログ (`confirmationSheetConfirm`) を押しても、1 回で消えるのは画面に描画されている 7〜8 件だけ。2026-09-23 に 31 件を選択して削除したところ 8 件しか消えず、同じ手順を 5 回繰り返して 31 件を消した。選択状態は表示外に出た行では保持されないとみられる (未検証の推定)。

**Why:** 1 回の削除で完了したと思い込むと、取り消したはずの予約が投稿されてしまう。逆に「すべて選択」を使うと残すべき予約まで消える。

**How to apply:** 予約本文の先頭 (URL・空白・# を除いた 25 字) で台帳 `posts.json` の行と照合し、削除対象だけを選ぶ。削除後は必ず一覧を読み直し、残件が「残す行だけ」になるまで繰り返す。各回で残す行が全部残っていることを確認してから次に進む。台帳は X 側の読み直しが一致してから `status: deleted` に更新する。X の posted 判定は [[feedback_x_post_url_integrity]] のとおり status URL で行う。
