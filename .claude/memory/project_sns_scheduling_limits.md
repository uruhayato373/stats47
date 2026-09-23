---
name: project_sns_scheduling_limits
description: X予約は重み付き280(日本語=2・URL=23)で、lint の char_max 150 では通っても弾かれる。Threads Web の予約は同時25件まで。2026-09-23 に10月末まで予約充填した時の実測
metadata:
  node_type: memory
  type: project
  originSessionId: a6c1fd62-f313-4e8c-a70e-696e85a25824
  modified: 2026-09-23T09:10:04.155Z
---

2026-09-23、X 109件・IG 43件・Threads 76件を10/31まで予約で埋めた時に踏んだ上限 (実測)。

- **X の本文上限は重み付き 280**。日本語1字=2、URL=23、改行=1で数える。`lint-x-captions.cjs` は「URL・空白を除いた文字数 ≤ char_max (最大160)」しか見ないので、日本語144字 (重み284) の投稿が lint を通り、publish-x では「予約後も compose 画面のまま」で失敗した。重み275以下の108件は通った。失敗時は予約一覧 (`x.com/compose/post/unsent/scheduled`) を全件スクロールして未登録を確かめてから再実行する (二重予約防止)。
- **Threads Web の予約は同時 25 件まで**。26件目で「スレッドは25件まで日時設定できます」と出て予約されない。10月末までの76件のうち25件だけ入り、残りは posts.json の threads draft として補充待ち (backlog `THREADS-TOPUP-01`)。`publish-threads.ts` は満杯表示で正常停止する。
- Threads の予約帯の日付表記: 今日 / 明日 / 1週間以内は「金曜日」/ それ以降は「10月4日(日)」。送信ボタンは「投稿」→「日時を指定」に変わる。

**Why:** どちらも UI が黙って弾くだけで、スクリプトの成功判定に頼ると「予約できたつもり」になる。

**How to apply:** X の本文は `lint-x-captions.cjs` が重み付き長 ≤ 280 を検査する (2026-09-23 に追加、`lib/x-weighted-length.cjs`)。lint を通さずに本文を直すときも同じ関数で測る。Threads は 25 件を超える一括予約を組まず、公開で空いた枠へ数日おきに補充する。関連 [[feedback_x_post_url_integrity]] [[project_sns_reorg_2026_07]]
