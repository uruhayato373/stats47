---
name: reference-kdp-weekly-title-limit
description: KDP は電子書籍の新しいタイトルを週に作れる数に上限があり、日曜 00:00 UTC (日本時間 日曜 9:00) に戻る
metadata:
  type: reference
---

KDP の新しいタイトル作成には、フォーマットごとの週間の作成数の上限がある。上限に達すると詳細ページで「本の作成数上限に達しました」というダイアログが出て、保存しても下書き ID が作られない (URL が `/title-setup/kindle/new` のまま)。`kdp-publish.mjs` は「content へ進めず … 下書き ID を取得できず (URL が new のまま)」と報告する。制限は日曜日の午前 0 時 (UTC)、日本時間の日曜 9:00 にリセットされる (2026-11-18 に画面のダイアログで確認。上限の冊数は画面に出ていない)。

**Why:** 2026-11-18 に地域データブックを 1 日で 7 冊下書きにしようとして、K-S3-02・03 の 2 冊のあと 5 冊が同じ失敗で止まった。失敗の回は下書きを残さない。

**How to apply:** 複数冊を下書きにするときは、週の残りの枠を見込んで日曜 9:00 (JST) をまたいで分ける。この失敗が出たら同じ週に再試行しない (自動操作を重ねると bot 検知の危険がある)。証拠の画面は `.local/kdp-debug/fail-<ID>.png`。関連: [[reference_kdp_bookshelf_archived_view]]、[[project_kindle_publishing_factory]]
