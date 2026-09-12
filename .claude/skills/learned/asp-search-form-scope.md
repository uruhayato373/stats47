# ASPの検索欄はフォーム内の固有IDで特定する

**トリガー**: ASP管理画面で検索input/submitの一意性検査が失敗する。同じnameがヘッダーと一覧内の両方にある。
**対処**: 入力欄と送信ボタンのid・所属form・action・可視性だけを観測する。操作対象のフォーム内で実機確認済みの固有IDを選び、入力と送信の両方が1件であることを確認する。推測で `.first()` を追加しない。遷移後はサイト帰属とPID/行数パリティを再確認する。
**根拠**: 2026-09-08のafbで `pm_search` と `search_x` が各2件存在。nameで絞ったformも2件になった。一覧内の `#get-keywords` と `#keywordSearchBtn` を実機確認後に使い、6検索すべてで表示総数と抽出PID数の一致を確認した。IDを無条件に固定せず、次回も一意性を検証する。
**確信度**: 0.7
**発見日**: 2026-09-08
**関連**: `.claude/scripts/ads/afb-scan.mjs`、`.claude/scripts/ads/lib/asp-browser.mjs`、`.claude/rules/affiliate-ads-standards.md` §11
