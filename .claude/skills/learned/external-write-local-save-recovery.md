# 外部更新後のローカル保存失敗を二重送信せず復旧する

**トリガー**: 画像アップロードなど外部への更新後に、台帳またはjournalの置換がWindowsの `EPERM` / `EACCES` / `EBUSY` で失敗する。
**対処**: 外部更新の失敗とは判断しない。返却URLとjournalの操作状態を先に調べ、公開画像と記事保全の照合が通る場合は記録だけを修復する。応答不明なら再送せず停止する。ローカルの置換だけを上限付きで再試行し、旧ファイルと同じ操作scopeを保持する。
**根拠**: 2026-10-02のnote家計カバー更新では、長崎の台帳保存と和歌山のjournal保存がそれぞれ失敗した。いずれも外部アップロードは成功しており、保存した返却URLと公開画像を照合して再POSTなしで復旧できた。ファイルが一時的に置換できない原因自体は未特定。
**確信度**: 0.9（2件の実操作で確認）
**発見日**: 2026-10-02
**関連**: `.claude/scripts/note/update-note-covers.mjs` / `.claude/scripts/note/lib/cover-assets.mjs` / `.claude/state/metrics/note-cover-refresh-ledger-91214c55dafc1456.json`

owner: knowledge-curator。外部操作の復旧判断を共有するための記録。操作契約の変更時に見直す。
