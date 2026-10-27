# 外部更新後のローカル保存失敗を二重送信せず復旧する

**トリガー**: 画像アップロードなど外部への更新後に、台帳またはjournalの置換がWindowsの `EPERM` / `EACCES` / `EBUSY` で失敗する。
**対処**: 外部更新の失敗とは判断しない。返却URLとjournalの操作状態を先に調べ、公開画像と記事保全の照合が通る場合は記録だけを修復する。応答不明なら再送せず停止する。ローカルの置換だけを上限付きで再試行し、旧ファイルと同じ操作scopeを保持する。
**根拠**: 2026-10-02のnote家計カバー更新では、長崎の台帳保存と和歌山のjournal保存がそれぞれ失敗した。いずれも外部アップロードは成功しており、保存した返却URLと公開画像を照合して再POSTなしで復旧できた。ファイルが一時的に置換できない原因自体は未特定。
**確信度**: 0.9（2件の実操作で確認）
**発見日**: 2026-10-02
**関連**: `.claude/scripts/note/update-note-covers.mjs` / `.claude/scripts/note/lib/cover-assets.mjs` / `data/note/evidence/note-cover-refresh-ledger-91214c55dafc1456.json`

owner: knowledge-curator。外部操作の復旧判断を共有するための記録。操作契約の変更時に見直す。

## 配信画像の検査だけが停止した場合（2026-10-14）

**トリガー**: noteカバーPOSTは201でURLを返し、公開eyecatchも一致するが、`public image differs`でjournalが`uploaded`のまま止まる。
**対処**: 同じ画像を再送しない。採用元SHAと公開配信の実バイトを対比し、原寸で文字全文・構図・切り抜き・色反転を確認する。減色だけと確認できた場合に限り、元SHA・配信SHA・公開URLに限定した目視確認をjournalへ残す。自動検査の失敗値も残し、本文等の全fingerprintとhas_draft、現在の採用SHAを再照合して記録のみ確定する。同じ選択範囲で未反映行を再開する。未確認の画像への一括承認や一律の閾値引き上げは禁止。
**根拠**: 文字込みimagegen画像の1280×670 RGB PNGがnote配信ではpalette PNGとなった。海外旅行・歳出・奈良・果物・教育の画像は平均差3.86〜4.33で閾値3を超えたが、画像対比と公開内容のhashは一致した。特定の減色実装やパラメータまでは未確定。
**確信度**: 0.9（5件の配信を個別確認）。自動判定の改修は`NOTE-COVER-DELIVERY-VERIFY-01`へ分離。
**証拠**: `data/note/evidence/note-cover-refresh-ledger-a4bc4308a8b6dcce.json`の`imageVerification.visualReview`と`recoveredFrom`。

## サイト画像の一括照合でも同じ復旧を適用（2026-10-26）

**根拠**: ranking 500件の公開run `40337293104`は成功したが、後続の公開SHA照合で`link-card-rollout.json.pending`のrenameがEPERMになった。外部再公開をせず同じpublish planから照合を再開する。分割台帳writerにも最大5回の短い置換再試行を適用し、恒久的な失敗は旧台帳を残したままエラーにする。公開成功と記録成功を別々に確かめる。原因となったWindowsプロセスは未特定。
**確信度**: 0.9（既存パターンの別経路での再現）。
**関連**: `.claude/scripts/ogp/lib/link-card-ledger.mjs` / `.claude/scripts/ogp/__tests__/link-card-ledger.test.mjs`
